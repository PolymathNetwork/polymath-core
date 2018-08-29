const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};
var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('../common/common_functions');
var contracts = require('../helpers/contract_addresses');
var abis = require('../helpers/contract_abis');
const Web3 = require('web3');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// App flow
let accounts;
let Issuer;
let defaultGasPrice;
let tokenSymbol;
let securityToken;
let polyToken;
let erc20DividendCheckpoint;
let generalTransferManager;

async function executeApp() {
  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];
  defaultGasPrice = common.getGasPrice(await web3.eth.net.getId());

  await setup();
  await start_explorer();
};

async function setup(){
  try {
    let tickerRegistryAddress = await contracts.tickerRegistry();
    let tickerRegistryABI = abis.tickerRegistry();
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polyTokenAddress = await contracts.polyToken();
    let polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function start_explorer(){
  if (!tokenSymbol) tokenSymbol = readlineSync.question('Enter the token symbol: ');
  
  let result = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({from: Issuer});
  if (result == "0x0000000000000000000000000000000000000000") {
    tokenSymbol = undefined;
    console.log(chalk.red(`Token symbol provided is not a registered Security Token.`));
  } else {
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI,result);

    // Get the GTM
    result = await securityToken.methods.getModule(2, 0).call({ from: Issuer });
    if (result[1] == "0x0000000000000000000000000000000000000000") {
      console.log(chalk.red(`General Transfer Manager is not attached.`));
    } else {
      generalTransferManagerAddress = result[1];
      let generalTransferManagerABI = abis.generalTransferManager();
      generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);
      generalTransferManager.setProvider(web3.currentProvider);

      let checkpointNum = await securityToken.methods.currentCheckpointId().call({ from: Issuer });
      console.log("Token is at checkpoint: ", checkpointNum);

      let options = ['Mint tokens', 'Transfer tokens',
        'Explore account at checkpoint', 'Explore total supply at checkpoint', 'Create checkpoint', 
        'Calculate Dividends', 'Calculate Dividends at past checkpoint'];
      
      // Only show dividend options if divididenModule is already attached 
      if (await isDividendsModuleAttached()) {
        options.push('Push dividends to account', 'Pull dividends to account', 
          'Explore POLY balance', 'Reclaimed dividends after expiry')
      }

      let index = readlineSync.keyInSelect(options, 'What do you want to do?');
      console.log("Selected: ", index != -1 ? options[index] : 'Cancel');
      switch (index) {
        case 0:
        // Mint tokens
        let _to =  readlineSync.question('Enter beneficiary of minting: ');
        let _amount =  readlineSync.question('Enter amount of tokens to mint: ');
        await mintTokens(_to,_amount);
        break;
        case 1:
          // Transfer tokens
          let _to2 =  readlineSync.question('Enter beneficiary of tranfer: ');
          let _amount2 =  readlineSync.question('Enter amount of tokens to transfer: ');
          await transferTokens(_to2,_amount2);
        break;
        case 2:
          // Explore account at checkpoint
          let _address =  readlineSync.question('Enter address to explore: ');
          let _checkpoint =  readlineSync.question('At checkpoint: ');
          await exploreAddress(_address,_checkpoint);
        break;
        case 3:
          // Explore total supply at checkpoint
          let _checkpoint2 =  readlineSync.question('Explore total supply at checkpoint: ');
          await exploreTotalSupply(_checkpoint2);
        break;
        case 4:
          // Create checkpoint
          await securityToken.methods.createCheckpoint().send({ from: Issuer});
        break;
        case 5:
          // Calculate Dividends
          let erc20Dividend =  readlineSync.question('How much POLY would you like to distribute to token holders?: ');
          let _issuerBalance = await polyToken.methods.balanceOf(Issuer).call();
          if(parseInt(web3.utils.fromWei(_issuerBalance, "ether")) >= parseInt(erc20Dividend)) {
            await createDividends(erc20Dividend);
          } else {
            console.log(chalk.red(`
                You have ${web3.utils.fromWei(_issuerBalance, "ether")} POLY need more ${(parseInt(erc20Dividend) - parseInt(web3.utils.fromWei(_issuerBalance, "ether")))} POLY
                Visit faucet to grab more POLY tokens\n`
            ));
            process.exit(0);
          }
        break;
        case 6:
          // Calculate Dividends at a checkpoint
          let _erc20Dividend =  readlineSync.question('How much POLY would you like to distribute to token holders?: ');
          let issuerBalance = await polyToken.methods.balanceOf(Issuer).call();
          if (parseInt(web3.utils.fromWei(issuerBalance)) < parseInt(_erc20Dividend)) {
            console.log(chalk.red(`
                You have ${web3.utils.fromWei(issuerBalance, "ether")} POLY need more ${(parseInt(_erc20Dividend) - parseInt(web3.utils.fromWei(issuerBalance)))} POLY
                Visit faucet to grab POLY tokens\n`
            ));
            process.exit(0);
          }
          let _checkpointId = readlineSync.question(`Enter the checkpoint on which you want to distribute dividend: `);
          let currentCheckpointId = await securityToken.methods.currentCheckpointId().call();
          if (parseInt(currentCheckpointId) >= parseInt(_checkpointId)) {
            await createDividendWithCheckpoint(_erc20Dividend, _checkpointId);
          } else {
            console.log(chalk.red(`Future checkpoint are not allowed to create the dividends`));
          }
        break;
        case 7:
          // Push dividends to account
          let _checkpoint3 =  readlineSync.question('Distribute dividends at checkpoint: ');
          let _address2 =  readlineSync.question('Enter addresses to push dividends to (ex- add1,add2,add3,...): ');
          await pushDividends(_checkpoint3,_address2);
        break;
        case 8:
          // Pull dividends to account
          let _checkpoint7 =  readlineSync.question('Distribute dividends at checkpoint: ');
          await pullDividends(_checkpoint7);
        break;
        case 9:
          //explore POLY balance
          let _checkpoint4 = readlineSync.question('Enter checkpoint to explore: ');
          let _address3 =  readlineSync.question('Enter address to explore: ');
          let _dividendIndex = await erc20DividendCheckpoint.methods.getDividendIndex(_checkpoint4).call();
          if (_dividendIndex.length == 1) {
            let divsAtCheckpoint = await erc20DividendCheckpoint.methods.calculateDividend(_dividendIndex[0],_address3).call({ from: Issuer});
            console.log(`
              POLY Balance: ${web3.utils.fromWei((await polyToken.methods.balanceOf(_address3).call()).toString())} POLY
              Dividends owed at checkpoint ${_checkpoint4}: ${web3.utils.fromWei(divsAtCheckpoint)} POLY
            `)
          } else {
            console.log(chalk.red("Future checkpoints are not allowed"));
          }
        break;
        case 10:
          // Reclaimed dividends after expiry
          let _checkpoint5 = readlineSync.question('Enter the checkpoint to explore: ');
          await reclaimedDividend(_checkpoint5);
          break;
        case -1:
          process.exit(0);
          break;
      }
    }
  }
  //Restart
  start_explorer();
}

async function mintTokens(address, amount){
  if (await securityToken.methods.finishedIssuerMinting().call()) {
    console.log(chalk.red("Minting is not possible - Minting has been permanently disabled by issuer"));
  } else {
    let result = await securityToken.methods.getModule(3, 0).call({from: Issuer});
    let isSTOAttached = result[1] != "0x0000000000000000000000000000000000000000";
    if (isSTOAttached) {
      console.log(chalk.red("Minting is not possible - STO is attached to Security Token"));
    } else {
      await whitelistAddress(address);
  
      try {
        let mintAction = securityToken.methods.mint(address,web3.utils.toWei(amount,"ether"));
        let GAS = await common.estimateGas(mintAction, Issuer, 1.2);
        await mintAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
        .on('transactionHash', function(hash){
          console.log(`
            Your transaction is being processed. Please wait...
            TxHash: ${hash}\n`
          );
        })
        .on('receipt', function(receipt){
          console.log(`
            Congratulations! The transaction was successfully completed.
      
            Minted ${web3.utils.fromWei(receipt.events.Transfer.returnValues.value,"ether")} tokens
            to account ${receipt.events.Transfer.returnValues.to}
      
            Review it on Etherscan.
            TxHash: ${receipt.transactionHash}\n`
          );
        });
      } catch (err) {
        console.log(err);
        console.log(chalk.red("There was an error processing the transfer transaction. \n The most probable cause for this error is one of the involved accounts not being in the whitelist or under a lockup period."));
      }
    }
  }
}

async function transferTokens(address, amount){
  await whitelistAddress(address);

  try{
    let transferAction = securityToken.methods.transfer(address,web3.utils.toWei(amount,"ether"));
    let GAS = await common.estimateGas(transferAction, Issuer, 1.5);
    await transferAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.
  
        Account ${receipt.events.Transfer.returnValues.from}
        transfered ${web3.utils.fromWei(receipt.events.Transfer.returnValues.value,"ether")} tokens
        to account ${receipt.events.Transfer.returnValues.to}
  
        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
      );
    });
  } catch (err) {
    console.log(err);
    console.log(chalk.red("There was an error processing the transfer transaction. \n The most probable cause for this error is one of the involved accounts not being in the whitelist or under a lockup period."));
  }
}

async function exploreAddress(address, checkpoint){
  let balance = await securityToken.methods.balanceOf(address).call({from: Issuer});
  balance = web3.utils.fromWei(balance,"ether");
  console.log(`Balance of ${address} is: ${balance} (Using balanceOf)`);

  let balanceAt = await securityToken.methods.balanceOfAt(address,checkpoint).call({from: Issuer});
  balanceAt = web3.utils.fromWei(balanceAt,"ether");
  console.log(`Balance of ${address} is: ${balanceAt} (Using balanceOfAt - checkpoint ${checkpoint})`);
}
  
async function exploreTotalSupply(checkpoint){
  let totalSupply = await securityToken.methods.totalSupply().call({from: Issuer});
  totalSupply = web3.utils.fromWei(totalSupply,"ether");
  console.log(`TotalSupply is: ${totalSupply} (Using totalSupply)`);

  let totalSupplyAt = await securityToken.methods.totalSupplyAt(checkpoint).call({from: Issuer});
  totalSupplyAt = web3.utils.fromWei(totalSupplyAt,"ether");
  console.log(`TotalSupply is: ${totalSupplyAt} (Using totalSupplyAt - checkpoint ${checkpoint})`);
}

async function createDividends(erc20Dividend){
  await addDividendsModule();

  let time = Math.floor(Date.now()/1000);
  let defaultTime = time + duration.minutes(10);
  let expiryTime = readlineSync.questionInt('Enter the dividend expiry time (Unix Epoch time)\n(10 minutes from now = ' + defaultTime + ' ): ', {defaultInput: defaultTime});

  let approveAction = polyToken.methods.approve(erc20DividendCheckpoint._address, web3.utils.toWei(erc20Dividend));
  let GAS = await common.estimateGas(approveAction, Issuer, 1.2);
  await approveAction.send({from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
  .on('receipt', function(receipt) {
    console.log(`
      Allowance: ${web3.utils.fromWei(receipt.events.Approval.returnValues._value, "ether")} POLY
      TxHash: ${receipt.transactionHash}\n`
    );
  })

  //Send ERC20 dividends
  let createDividendAction = erc20DividendCheckpoint.methods.createDividend(time, expiryTime, polyToken._address, web3.utils.toWei(erc20Dividend));
  GAS = await common.estimateGas(createDividendAction, Issuer, 1.2);
  await createDividendAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice })
  .on('transactionHash', function(hash){
    console.log(`
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt){
    console.log(`
      Congratulations! Dividend is created successfully.
      CheckpointId: ${receipt.events.ERC20DividendDeposited.returnValues._checkpointId}
      TxHash: ${receipt.transactionHash}\n`
    );
  })
}

async function createDividendWithCheckpoint(erc20Dividend, checkpointId) {
  await addDividendsModule(); 

  let time = Math.floor(Date.now()/1000);
  let defaultTime = time + duration.minutes(10);
  let expiryTime = readlineSync.questionInt('Enter the dividend expiry time (Unix Epoch time)\n(10 minutes from now = ' + defaultTime + ' ): ', {defaultInput: defaultTime});
  
  let dividendStatus = await erc20DividendCheckpoint.methods.getDividendIndex(checkpointId).call();
  if (dividendStatus.length != 1) {
    let approveAction = polyToken.methods.approve(erc20DividendCheckpoint._address, web3.utils.toWei(erc20Dividend,"ether"));
    let GAS = await common.estimateGas(approveAction, Issuer, 1.2);
    await approveAction.send({from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
    .on('receipt', function(receipt) {
    console.log(`
      Allowance: ${web3.utils.fromWei(receipt.events.Approval.returnValues._value, "ether")} POLY
      TxHash: ${receipt.transactionHash}\n`
      );
    })
    //Send ERC20 dividends
    let createDividendWithCheckpointAction = erc20DividendCheckpoint.methods.createDividendWithCheckpoint(time, expiryTime, polyToken._address, web3.utils.toWei(erc20Dividend), checkpointId);
    GAS = await common.estimateGas(createDividendWithCheckpointAction, Issuer, 1.2);
    await createDividendWithCheckpointAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice })
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! Dividend is created successfully.
        CheckpointId: ${receipt.events.ERC20DividendDeposited.returnValues._checkpointId}
        TxHash: ${receipt.transactionHash}\n`
      );
    })
  } else {
    console.log(chalk.blue(`\nDividends are already distributed at checkpoint '${checkpointId}'. Not allowed to re-create\n`));
  }
}

async function pushDividends(checkpoint, account){
let accs = account.split(',');
let dividend = await erc20DividendCheckpoint.methods.getDividendIndex(checkpoint).call();
  if(dividend.length == 1) {
    try {
      let _dividendData = await erc20DividendCheckpoint.methods.dividends(dividend[0]).call();
      if (parseInt(_dividendData[3]) >= parseInt(Math.floor(Date.now()/1000))) {
        let pushDividendPaymentToAddressesAction = erc20DividendCheckpoint.methods.pushDividendPaymentToAddresses(dividend[0], accs);
        let GAS = await common.estimateGas(pushDividendPaymentToAddressesAction, Issuer, 1.2);
        await pushDividendPaymentToAddressesAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice })
        .on('transactionHash', function(hash){
          console.log(`
            Your transaction is being processed. Please wait...
            TxHash: ${hash}\n`
          );
        })
        .on('receipt', function(receipt){
          console.log(`
            Congratulations! Dividends are pushed successfully
            TxHash: ${receipt.transactionHash}\n`
          );
        })
      } else {
        console.log(`\nSorry! You missed the ${chalk.yellow("Golden")} opportunity to get the dividend benefits\n`);
      }
    } catch(error) {
      console.log(error.message);
      console.log(chalk.red("\nPossible chance that one of the address already claim the dividend"));
    }
  } else {
    console.log(chalk.red("Future checkpoints are not allowed"));
  }
}

async function pullDividends(checkpointId) {
let dividend = await erc20DividendCheckpoint.methods.getDividendIndex(checkpointId).call();
if(dividend.length == 1) {
  try {
    let _dividendData = await erc20DividendCheckpoint.methods.dividends(dividend[0]).call();
    if (parseInt(_dividendData[3]) >= parseInt(Math.floor(Date.now()/1000))) {
        let pullDividendPaymentAction = erc20DividendCheckpoint.methods.pullDividendPayment(dividend[0]);
        let GAS = await common.estimateGas(pullDividendPaymentAction, Issuer, 1.2);
        await pullDividendPaymentAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice })
        .on('transactionHash', function(hash){
          console.log(`
            Your transaction is being processed. Please wait...
            TxHash: ${hash}\n`
          );
        })
        .on('receipt', function(receipt){
          console.log(`
            Congratulations! Dividends are pull successfully
            TxHash: ${receipt.transactionHash}\n`
          );
        })
      } else {
        console.log(`\nSorry! You missed the ${chalk.yellow("Golden")} opportunity to get the dividend benefits\n`);
      }
    } catch(error) {
      console.log(error.message);
      console.log(chalk.red(`May be ${Issuer} already claimed his dividends`));
    }
  } else {
    console.log(chalk.red("Future checkpoints are not allowed"));
  }
}

async function reclaimedDividend(checkpointId) {
  let dividendIndex = await erc20DividendCheckpoint.methods.getDividendIndex(checkpointId).call();
  if (dividendIndex.length == 1) {
    let reclaimDividendAction = erc20DividendCheckpoint.methods.reclaimDividend(dividendIndex[0]);
    let GAS = await common.estimateGas(reclaimDividendAction, Issuer, 1.2);
    await reclaimDividendAction.send({from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
    .on("transactionHash", function(hash) {
      console.log(`
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.

        Claimed Amount ${web3.utils.fromWei(receipt.events.ERC20DividendReclaimed.returnValues._claimedAmount)} POLY
        to account ${receipt.events.ERC20DividendReclaimed.returnValues._claimer}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
      );
    })
  } else {
    console.log(chalk.red("Future checkpoints are not allowed"));
  }
}

async function whitelistAddress(address) {
  let now = Math.floor(Date.now() / 1000);
  let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(address, now, now, now + 31536000, true);
  let GAS = await common.estimateGas(modifyWhitelistAction, Issuer, 1.2);
  await modifyWhitelistAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
  .on('receipt', function(receipt){
    console.log(chalk.green(`\nWhitelisting successful for ${address}.`));
  });
}

async function isDividendsModuleAttached() {
  let result = await securityToken.methods.getModuleByName(4, web3.utils.toHex("ERC20DividendCheckpoint")).call({ from: Issuer });
  erc20DividendCheckpointAddress = result[1];
  if (erc20DividendCheckpointAddress != "0x0000000000000000000000000000000000000000") {
    let erc20DividendCheckpointABI = abis.etherDividendCheckpoint();
    erc20DividendCheckpoint = new web3.eth.Contract(erc20DividendCheckpointABI, erc20DividendCheckpointAddress);
    erc20DividendCheckpoint.setProvider(web3.currentProvider);
  }

  return (typeof erc20DividendCheckpoint !== 'undefined');
}

async function addDividendsModule() {
  if (!(await isDividendsModuleAttached())) {
    let erc20DividendCheckpointFactoryAddress = await contracts.erc20DividendCheckpointFactoryAddress();
    let addModuleAction = securityToken.methods.addModule(erc20DividendCheckpointFactoryAddress, web3.utils.fromAscii('', 16), 0, 0);
    let GAS = await common.estimateGas(addModuleAction, Issuer, 1.2);
    await addModuleAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice })
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.
        Module deployed at address: ${receipt.events.LogModuleAdded.returnValues._module}
        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
      );
      let erc20DividendCheckpointABI = abis.erc20DividendCheckpoint();
      erc20DividendCheckpoint = new web3.eth.Contract(erc20DividendCheckpointABI, receipt.events.LogModuleAdded.returnValues._module);
      erc20DividendCheckpoint.setProvider(web3.currentProvider);
    })
  }
}

module.exports = {
  executeApp: async function() {
        return executeApp();
    }
}