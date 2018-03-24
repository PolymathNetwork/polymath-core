var readlineSync = require('readline-sync');

const tickerRegistryAddress = "0x2981123c3fd9791ffce30efb649a3070f622e528";
const securityTokenRegistryAddress = "0xfa839E611F1d9BBFb52188a201891310Fd363013";

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
let tokenCap;
let minContribution;
let maxContribution;

let tokenName;
let tokenSymbol;
let tokenDecimals = 18;

const tokenDetails = "This is a legit issuance...";

////////////////////////

let tickerRegistry;
let securityTokenRegistry;

// App flow
let index_mainmenu;

let accounts;
let Issuer;

let _DEBUG = true;

let tickerRegistryABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "expiryLimit",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "STRAddress",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "_owner",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "_symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "name": "_timestamp",
        "type": "uint256"
      }
    ],
    "name": "LogRegisterTicker",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "_oldExpiry",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "_newExpiry",
        "type": "uint256"
      }
    ],
    "name": "LogChangeExpiryLimit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_symbol",
        "type": "string"
      },
      {
        "name": "_contact",
        "type": "string"
      }
    ],
    "name": "registerTicker",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_newExpiry",
        "type": "uint256"
      }
    ],
    "name": "changeExpiryLimit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_STRegistry",
        "type": "address"
      }
    ],
    "name": "setTokenRegistry",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_symbol",
        "type": "string"
      },
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "checkValidity",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_symbol",
        "type": "string"
      }
    ],
    "name": "getDetails",
    "outputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "string"
      },
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
let securityTokenRegistryABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "securityTokens",
    "outputs": [
      {
        "name": "symbol",
        "type": "string"
      },
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "tokenDetails",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "tickerRegistry",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "protocolVersion",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "protocolVersionST",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "moduleRegistry",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "polyAddress",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_polyAddress",
        "type": "address"
      },
      {
        "name": "_moduleRegistry",
        "type": "address"
      },
      {
        "name": "_tickerRegistry",
        "type": "address"
      },
      {
        "name": "_STVersionProxy",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "_ticker",
        "type": "string"
      },
      {
        "indexed": false,
        "name": "_securityTokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "LogNewSecurityToken",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_name",
        "type": "string"
      },
      {
        "name": "_symbol",
        "type": "string"
      },
      {
        "name": "_decimals",
        "type": "uint8"
      },
      {
        "name": "_tokenDetails",
        "type": "bytes32"
      }
    ],
    "name": "generateSecurityToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_stVersionProxyAddress",
        "type": "address"
      },
      {
        "name": "_version",
        "type": "bytes32"
      }
    ],
    "name": "setProtocolVersion",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_symbol",
        "type": "string"
      }
    ],
    "name": "getSecurityTokenAddress",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log("********************************************")
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************")

  setup();

};

async function setup(){
  tickerRegistry = new web3.eth.Contract(tickerRegistryABI,tickerRegistryAddress);
  tickerRegistry.setProvider(web3.currentProvider);
  securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI,securityTokenRegistryAddress);
  securityTokenRegistry.setProvider(web3.currentProvider);
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
};

async function step_ticker_reg(){
  let receipt;

  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 1: Symbol Registration");
  tokenSymbol =  readlineSync.question('Enter the Symbol for your new token: ');

  try{
    await tickerRegistry.methods.registerTicker(tokenSymbol, "poly@polymath.network").send({ from: Issuer, gas:200000})
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.\n
        Review it on Etherscan.\n
        TxHash: ${receipt.transactionHash}\n`
      );
    })
    .on('error', console.error);


  }catch (err){
    console.log(err.message);
    return;
  }

  await step_token_deploy();
}

async function step_token_deploy(){
  let receipt;

  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 2: Token Deployment");
  tokenName =  readlineSync.question('Enter the Name for your new token: ');

  try{
    await securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, tokenDecimals, web3.utils.fromAscii(tokenDetails)).send({ from: Issuer, gas:4500000})
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.\n
        Deployed Token at address: ${receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress}
        Review it on Etherscan.\n
        TxHash: ${receipt.transactionHash}\n`
      );
    })
    .on('error', console.error);

    //console.log("aaa",receipt.logs[1].args._securityTokenAddress);

  }catch (err){
    console.log(err.message);
    return;
  }

  console.log("FINISHED");
}

async function step_other(){
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 1: Token Name");
  tokenName =  readlineSync.question('Enter a name for your new token: ');
  console.log("You entered: ", tokenName, "\n");

  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 2: Token Symbol");
  tokenSymbol =  readlineSync.question('Enter a symbol for '+tokenName+': ');
  console.log("You entered: ", tokenSymbol, "\n");

  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 3: Decimals");
  tokenDecimals =  readlineSync.questionInt('How many decimals will '+tokenName+' token ('+tokenSymbol+')'+' have?: ');
  console.log("You entered: ", tokenDecimals, "\n");

  console.log('\x1b[43m%s\x1b[0m',tokenName + ' token ('+tokenSymbol+') ' + 'with '+ tokenDecimals +' decimals will be used for the ICO.');
  console.log("\n");

  /////////////
  // Start Date

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 1: Start date");
  startTime =  readlineSync.question('Choose a start date for the crowdsale: ');
  console.log("You chose: ", startTime, "\n");

  ///////////
  // End Date

  var options_endTime = {limit: function(input) {
    return (startTime <= parseInt(input));
  },limitMessage: "Please enter an end time later than the start time"};

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 2: End date");
  endTime =  readlineSync.question('Choose an end date for the crowdsale: ',options_endTime);
  console.log("You chose: ", endTime, "\n");

  /////////
  // Wallet

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 3: Wallet address");
  wallet =  readlineSync.question('Enter an ETH address to be used as wallet (funds will be transferred to this account): ');
  console.log("You chose: ", wallet, "\n");

  /////////
  // Rate

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 4: ETH to " + tokenSymbol + " exchange rate.");
  rate =  readlineSync.questionInt('Enter the exchange rate for your token (1 ETH = x '+ tokenSymbol+ '): ');
  console.log("Each 1 ETH will yield "+ rate +" "+ tokenSymbol + "\n");

  ////////////
  // ICO Token Cap

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 5: Token Cap");
  tokenCap =  readlineSync.questionInt('What will be the maximum tokens to be minted? (Token Cap): ');
  tokenCap = tokenCap * 10 ** tokenDecimals;
  console.log("The ICO will mint and distribute a maximum of " + tokenCap + " tokens.\n");

  ///////////////////
  // Min contribution

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 6: Minimum allowed contribution");
  minContribution =  readlineSync.questionFloat('What will be the minimum possible contribution? (in ether) ');
  console.log("The minimum allowed contribution will be " + minContribution + " ether.\n");

  ///////////////////
  // Max contribution

  var options_maxContrib = {limit: function(input) {
    return (minContribution < parseFloat(input));
  },limitMessage: "Please enter a maximum contribution higher than the minimum contribution."};


  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 7: Maximum allowed contribution");
  maxContribution =  readlineSync.question('What will be the maximum possible contribution? (in wei) ',options_maxContrib);
  console.log("The maximum allowed contribution will be " + maxContribution + " wei.\n");

  if(_DEBUG){
    startTime = Math.floor(new Date().getTime() /1000);
    endTime = Math.floor(new Date().getTime() /1000 + (3600 * 24 * 30));

    console.log('\x1b[31m%s\x1b[0m',"Warning: Debugging is activated. Start and End dates have been modified");
  }

  console.log("----------------------------------------------------");
  console.log('\x1b[34m%s\x1b[0m',"Please review the information you entered:");
  console.log("Token name: ", tokenName);
  console.log("Token symbol: ", tokenSymbol);
  console.log("Token decimals: ", tokenDecimals);
  console.log("Start date: ", startTime);
  console.log("End date: ", endTime);
  console.log("Wallet: ", wallet);
  console.log("Exchange rate: ", rate);
  console.log("Token Cap: ", tokenCap);
  console.log("Minimum contribution (in ether): ", minContribution);
  console.log("Maximum contribution (in ether): ", maxContribution);
  console.log("----------------------------------------------------");
  // ICO creation

  let token;

  // try{
  //
  //   crowdsaleGenerator = await CrowdsaleGenerator.new(
  //     startTime, endTime, wallet, rate,
  //     tokenCap, web3.utils.toWei(minContribution.toString(10),"ether"),
  //     web3.utils.toWei(maxContribution.toString(10),"ether"),
  //     tokenName, tokenSymbol, tokenDecimals,
  //     {from:accounts[0],gas:4000000});
  //
  //   let tokenAddress = await crowdsaleGenerator.token({from:accounts[0],gas:2000000});
  //   token = await TokenGenerator.at(tokenAddress);
  //
  //   console.log("\n")
  //   console.log('\x1b[42m%s\x1b[0m',"Congratulations! The ICO was successfully generated.")
  //   console.log('\x1b[43m%s\x1b[0m',"ICO Address: " + crowdsaleGenerator.address.valueOf());
  //   console.log('\x1b[43m%s\x1b[0m',"TOKEN Address: "+ token.address.valueOf());
  //
  // } catch (err){
  //   console.log(err);
  // }
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

executeApp();
