var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js')

let _GANACHE_CONTRACTS = true;
let tickerRegistryAddress;
let securityTokenRegistryAddress;
let cappedSTOFactoryAddress;

if(_GANACHE_CONTRACTS){
  tickerRegistryAddress = "0xc16761ae340da4c0af3bb2b9431b907059d3dc00";
  securityTokenRegistryAddress = "0xf4f4f1fffc15b763970a8c7d2b8a556dbad73340";
  cappedSTOFactoryAddress = "0x47ef06350b02ffb806d98ae0af975c843fd4abef";
}else{
  tickerRegistryAddress = "0xfc2a00bb5b7e3b0b310ffb6de4fd1ea3835c9b27";
  securityTokenRegistryAddress = "0x6958fca8a4cd4418a5cf9ae892d1a488e8af518f";
  cappedSTOFactoryAddress = "0x128674eeb1c26d59a27ec58e9a76142e55bade2d";
}

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
try{
  tickerRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
}catch(err){
  console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}



const Web3 = require('web3');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

///////////////////
//Crowdsale params

let startTime;
let endTime;
let wallet;
let rate;
let cap;
let issuerTokens;
let minContribution;
let maxContribution;

let tokenName;
let tokenSymbol;
let tokenDecimals = 18;

const tokenDetails = "This is a legit issuance...";

////////////////////////

let tickerRegistry;
let securityTokenRegistry;
let securityToken;
let cappedSTO;
let generalTransferManager;

// App flow
let index_mainmenu;

let accounts;
let Issuer;

let _DEBUG = false;

let DEFAULT_GAS_PRICE = 80000000000;

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(@(&&@@@@@@@@@@@@@@@@@@@@@@@@@@(((@&&&&(/@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((#%%%#@@@@@@@@@@@@@@@@@@@@%##(((/@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((#%%%%%@#@@@@@@@@@@@@(&#####@@@@@@@@%&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#((((((((((((((##%%%%%%%&&&%%##@%#####%(@@@@@@@#%#&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%((((((((((((((((((###%%%%%((#####%%%####@@@@@@@###((@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((((((((((((((((####%%%#((((######%&%@@(##&###(@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((((((((((((((((((((((####%%#(((((((#((((((((((((#(@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((((((((((((((((((######%(((((((((((((#&(/@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#(((((((((((((((((((((((((((((((###############(##%%#@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((##############(((((((((((((((((###################%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@(&#((#(##################((((((((((((((((((##%%##############@@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@/%#(((((((##%((((##############((((((((((((((((((##%%#############%%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@((((((((((###%%((((((##########(((((((((((((((((((#%%%############%%%#@@@@@@@@@
@@@@@@@@@@@@@@@@@@%((((((((((####%%%((((((((#######(((((((((((####(((((@%%############%%%#@@@@@@@@@
@@@@@@@@@####%%%%%#(((((((((#####%%%%(((((((((((###((((#######(((((((((&@@(&#########%%%%&@@@@@@@@@
@@@@@@@@&(((#####%###(((((((#####%%%%%((((((((####%%%%%%%%&%@%#((((((((@@@@@@(#(####%%%%%%@@@@@@@@@
@@@@@@@&(((@@@@@@@####(((((######%%%%%%##&########%%%%%#@@@@###(((((#(@@@@@@@@@@@###%%#@@@@@@@@@@@@
@@@#%&%(((@@@@@@@@#####(((#######%%%%@@@@@@@@@@@((##@@@@@@@@%###((((/@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@#%%&%#@@@@@@@@@@############%%%%@@@@@@@@@@@@@@@@@@@@(@&&&&#####(#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@#%%%%%#((%%%%%%#@@@@@@@@@@@@@@@@@@@@(####%((((%#(@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@&%%%#((((((%%&@@@@@@@@@@@@@@@@@@@@@@###%%#((@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%%%((((((((& @@@@@@@@@@@@@@@@@@@@@@@%%&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%(((((&#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@&((###@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@#####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@&####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&%##@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@#%####%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`)

  console.log("********************************************")
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************")

  setup();

};

async function setup(){
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI,tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI,securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
  }catch(err){
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }

  createST20();

}

async function createST20() {

  console.log("The following script will create a new ST-20 according to the parameters you enter.");

  if(_DEBUG){
    console.log('\x1b[31m%s\x1b[0m',"Warning: Debugging is activated. Start and End dates will be adjusted for easier testing.");
  }

  let start = readlineSync.question('Press enter to continue or exit (CTRL + C): ', {
    defaultInput: 'Y'
  });

  if(start != "Y") return;

  step_ticker_reg();
  //step_STO_Launch();
};

async function step_ticker_reg(){
  let receipt;

  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Symbol Registration");

  let alreadyRegistered = false;
  let available = false;

  while(!available) {
    tokenSymbol =  readlineSync.question('Enter the symbol for your new token: ');
    await tickerRegistry.methods.getDetails(tokenSymbol).call({from: Issuer}, function(error, result){
        if(new BigNumber(result[1]).toNumber() == 0){
          available = true;
        }else if(result[0] == Issuer){
          console.log('\x1b[32m%s\x1b[0m',"Token Symbol has already been registered by you, skipping registration");
          available = true;
          alreadyRegistered = true;
        }else{
          console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
        }
    });
  }

  if(!alreadyRegistered){
    try{
      await tickerRegistry.methods.registerTicker(tokenSymbol, "").send({ from: Issuer, gas:200000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);


    }catch (err){
      console.log(err.message);
      return;
    }
  }

  await step_token_deploy();
}

async function step_token_deploy(){

  let tokenDeployed = false;
  let tokenDeployedAddress;
  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({from: Issuer}, function(error, result){
    if(result != "0x0000000000000000000000000000000000000000"){
      console.log('\x1b[32m%s\x1b[0m',"Token has already been deployed at address "+result+". Skipping registration");
      tokenDeployedAddress = result;
      tokenDeployed = true;
    }

  });

  if(tokenDeployed){
    securityToken = new web3.eth.Contract(securityTokenABI,tokenDeployedAddress);

    await securityToken.methods.modules(2).call({from: Issuer}, function(error, result){
      console.log(result);
    });
  }else{
    let receipt;

    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");
    tokenName =  readlineSync.question('Enter the name for your new token: ');

    try{
      await securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, tokenDecimals, web3.utils.fromAscii(tokenDetails)).send({ from: Issuer, gas:4500000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Deployed Token at address: ${receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress}
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );

        securityToken = new web3.eth.Contract(securityTokenABI,receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress);
      })
      .on('error', console.error);

    }catch (err){
      console.log(err.message);
      return;
    }
  }

  await step_Wallet_Issuance();
}

async function step_Wallet_Issuance(){

  let initialMint;
  await securityToken.getPastEvents('Transfer', {
    filter: {from: "0x0000000000000000000000000000000000000000"}, // Using an array means OR: e.g. 20 or 23
    fromBlock: 0,
    toBlock: 'latest'
  }, function(error, events){
    initialMint = events;
  });

  let generalTransferManagerAddress;
  await securityToken.methods.modules(2).call({from: Issuer}, function(error, result){
    generalTransferManagerAddress = result[1];
    generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,generalTransferManagerAddress);
    console.log("GTM Address:",generalTransferManagerAddress);
  });

  if(initialMint.length > 0){
    console.log('\x1b[32m%s\x1b[0m',web3.utils.fromWei(initialMint[0].returnValues.value,"ether") +" Tokens have already been minted for "+initialMint[0].returnValues.to+". Skipping initial minting");
  }else{
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Minting for Issuer");

    console.log("Before setting up the STO, you can mint any amount of tokens that will remain under your control");
    let mintWallet =  readlineSync.question('Add the address that will hold the issued tokens to the whitelist ('+Issuer+'): ');
    if(mintWallet == "") mintWallet = Issuer;

    try{

      // Add address to whitelist

      await generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000)).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Adding wallet to whitelist. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);

      // Mint tokens

      issuerTokens =  readlineSync.question('How many tokens do you plan to mint for the wallet you entered? (500.000): ');
      if(issuerTokens == "") issuerTokens = '500000';

      await securityToken.methods.mint(mintWallet,web3.utils.toWei(issuerTokens,"ether")).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Minting tokens. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);

    }catch (err){
      console.log(err.message);
      return;
    }
  }

  await step_STO_Launch();
}

async function step_STO_Launch(){
  let receipt;

  let stoCreated = false;
  await securityToken.methods.modules(3).call({from: Issuer}, function(error, result){
    if(result.moduleAddress != "0x0000000000000000000000000000000000000000"){
      console.log('\x1b[32m%s\x1b[0m',"STO has already been created at address "+result.moduleAddress+". Skipping STO creation");
      stoCreated = true;
      cappedSTO = new web3.eth.Contract(cappedSTOABI,result.moduleAddress);
    }
  });

  if(stoCreated){
    let displayStartTime;
    let displayEndTime;
    let displayRate;
    let displayCap;
    let displayWallet;
    let displayIssuerTokens;

    await cappedSTO.methods.startTime().call({from: Issuer}, function(error, result){
      displayStartTime = result;
    });
    await cappedSTO.methods.endTime().call({from: Issuer}, function(error, result){
      displayEndTime = result;
    });
    await cappedSTO.methods.rate().call({from: Issuer}, function(error, result){
      displayRate = result;
    });
    await cappedSTO.methods.cap().call({from: Issuer}, function(error, result){
      displayCap = result;
    });
    await cappedSTO.methods.wallet().call({from: Issuer}, function(error, result){
      displayWallet = result;
    });

    console.log(`
      ***** STO Information *****
      - Raise Cap:       ${web3.utils.fromWei(displayCap,"ether")}
      - Start Time:      ${displayStartTime}
      - End Time:        ${displayEndTime}
      - Rate:            ${displayRate}
      - Wallet:          ${displayWallet}
    `);

  }else{
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration (Capped STO in ETH)");

    cap =  readlineSync.question('How many tokens do you plan to sell on the STO? (500.000)');
    startTime =  readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(5 minutes from now = '+(Math.floor(Date.now()/1000)+300)+' ): ');
    endTime =  readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = '+(Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60))+' ): ');
    rate =  readlineSync.question('Enter the rate (1 ETH = X ST) for the STO (1000): ');
    wallet =  readlineSync.question('Enter the address that will receive the funds from the STO ('+Issuer+'): ');

    if(startTime == "") startTime = BigNumber((Math.floor(Date.now()/1000)+300));
    if(endTime == "") endTime = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
    if(cap == "") cap = '500000';
    if(rate == "") rate = BigNumber(1000);
    if(wallet == "") wallet = Issuer;

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_startTime'
        },{
            type: 'uint256',
            name: '_endTime'
        },{
            type: 'uint256',
            name: '_cap'
        },{
            type: 'uint256',
            name: '_rate'
        },{
            type: 'uint8',
            name: '_fundRaiseType'
        },{
            type: 'address',
            name: '_polyToken'
        },{
            type: 'address',
            name: '_fundsReceiver'
        }
        ]
    }, [startTime, endTime, web3.utils.toWei(cap, 'ether'), rate,0,0,wallet]);

    try{
      await securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, 0,0, false).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          STO deployed at address: ${receipt.events.LogModuleAdded.returnValues._module}
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);

      //console.log("aaa",receipt.logs[1].args._securityTokenAddress);

    }catch (err){
      console.log(err.message);
      return;
    }
  }

}

executeApp();
