
const ModuleRegistry = artifacts.require('./contracts/ModuleRegistry.sol');
const SecurityToken = artifacts.require('./contracts/SecurityToken.sol');
const GeneralTransferManagerFactory = artifacts.require('./contracts/GeneralTransferManagerFactory.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require('./TickerRegistrar.sol');

const Web3 = require('web3')

var BigNumber = require('bignumber.js')

//The following line is required to use timeTravel with web3 v1.x.x
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

const timeTravel = function (time) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [time], // 86400 is num seconds in day
      id: new Date().getTime()
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

const mineBlock = function () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_mine"
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

const logTitle = function (title) {
  console.log("*****************************************");
  console.log(title);
  console.log("*****************************************");
}

const logError = function (err) {
  console.log("-----------------------------------------");
  console.log(err);
  console.log("-----------------------------------------");
}

contract('SecurityToken', function(accounts) {

  ////

  const DECIMALSFACTOR = new BigNumber(10).pow(18);

  // const TOKEN_NAME = "Polymath";
  // const TOKEN_SYMBOL = "POLY";
  // const TOKEN_DECIMALS = 18;
  // const TOTAL_SUPPLY = 1000000000 * DECIMALSFACTOR;

  ////
  // Accounts
  ////

  let account_polymath;
  let account_issuer;
  let account_investor1;


  ////
  // Contracts
  ////

  //let C_PolyToken;
  let C_ModuleRegistry;
  let C_GeneralTransferManagerFactory;
  let C_SecurityToken;
  let C_CSTOCrowdsale;
  let C_SecurityTokenRegistrar;
  let C_TickerRegistrar;


  // ST data
  let token_name = "Example Token";
  let token_symbol = "EXA";
  let token_totalSupply = 100000;
  let token_owner;
  let token_decimals = 0;

  before(async() => {

    account_polymath = accounts[0];
    account_issuer = accounts[1];
    account_investor1 = accounts[2];

    token_owner = account_issuer;

  });

  // POLYMATH SETUP step 1: Deploy the Ticker Registrar contract

  describe("Deploy Ticker Registrar", async() => {

    it("Should Successfully deploy the ticker registrar", async() =>{
      C_TickerRegistrar = await TickerRegistrar.new({ from: account_polymath });

      console.log(`\nPolymath Network Smart Contracts Deployed:\n
        TickerRegistrar: ${C_TickerRegistrar.address}\n
      `);

      assert.notEqual(C_TickerRegistrar.address.valueOf(), "0x0000000000000000000000000000000000000000", "TickerRegistrar contract was not deployed");

    });
  });

  // POLYMATH SETUP step 2: Deploy Module Registry contract

  describe("Deploy Module Registry contract", async function () {

    it("Should have deployed contract", async function () {
      C_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

      console.log(`\nPolymath Network Smart Contracts Deployed:\n
        ModuleRegistry: ${C_ModuleRegistry.address}\n
      `);

      assert.notEqual(C_ModuleRegistry.address.valueOf(), "0x0000000000000000000000000000000000000000", "ModuleRegistry contract was not deployed");

    });
  });

  // POLYMATH SETUP step 3: Deploy GeneralTransferManagerFactory contract

  describe("Deploy GeneralTransferManagerFactory contract", async() => {

    it("Should have deployed contract", async function () {
      C_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new({from:account_polymath});

      console.log(`\nPolymath Network Smart Contracts Deployed:\n
        GeneralTransferManagerFactory: ${C_GeneralTransferManagerFactory.address}\n
      `);

      assert.notEqual(C_GeneralTransferManagerFactory.address.valueOf(), "0x0000000000000000000000000000000000000000", "GeneralTransferManagerFactory contract was not deployed");

    });
  });

  // POLYMATH SETUP step 4: Add GeneralTransferManagerFactory to ModuleRegistry

  describe("Add GeneralTransferManagerFactory to ModuleRegistry", async function () {

    it("Should have added GeneralTransferManager module to registry", async function () {
      await C_ModuleRegistry.registerModule(C_GeneralTransferManagerFactory.address,{from:account_polymath});
      let module_ = await C_ModuleRegistry.registry(C_GeneralTransferManagerFactory.address);

      assert.equal(web3.utils.toAscii(module_[1]).replace(/\u0000/g, ''), "GeneralTransferManager", "GeneralTransferManager module was not added");

    });
  });

  // POLYMATH SETUP step 5: Deploy the securityTokenRegistrar

  describe("Deploy the SecurityTokenRegistrar contract", async()=> {

    it("Should successfully deploy the contract", async() => {
     C_SecurityTokenRegistrar = await SecurityTokenRegistrar.new(
        C_ModuleRegistry.address,
        C_TickerRegistrar.address,
        C_GeneralTransferManagerFactory.address,
        {
           from: account_polymath
        });

      console.log(`\nPolymath Network Smart Contracts Deployed:\n
      SecurityTokenRegistrar: ${C_SecurityTokenRegistrar.address}\n
     `);

      assert.notEqual(C_SecurityTokenRegistrar.address.valueOf(), "0x0000000000000000000000000000000000000000", "SecurityTokenRegistrar contract was not deployed");
    });

  });

//////////////////////////////////////// Below performed steps will performed by the end user //////////////////////////////////////////  

// Step 1: Deploy SecurityToken contract

  describe("Deploy Example Token contract", async function () {

    it("Should register the token symbol with the platform", async() => {
      const tx = await C_TickerRegistrar.registerTicker(token_symbol, "jhon@example.com", { from : token_owner });

      assert.equal(tx.logs[0].args._owner, token_owner, "Ticker doesn't get register with the platform");
      assert.equal(tx.logs[0].args._symbol, token_symbol, "Ticker doesn't get register with the platform");
    });

    it("Should have deployed all contracts", async function () {
      const tx = await C_SecurityTokenRegistrar.generateSecurityToken(token_owner, token_name, token_symbol, token_decimals, web3.utils.fromAscii("DATA"), { from: account_issuer });
    
      assert.equal(tx.logs[0].args._ticker, token_symbol, "SecurityToken Doesn't get generate");
      
      C_SecurityToken = SecurityToken.at(tx.logs[0].args._securityTokenAddress);
      
      console.log(`\nPolymath Network Smart Contracts Deployed:\n
        SecurityToken: ${C_SecurityToken.address}\n
      `);

      assert.notEqual(C_SecurityToken.address.valueOf(), "0x0000000000000000000000000000000000000000", "contract was not deployed");

    });

    it("Should have the correct data", async function () {

      let st_symbol = await C_SecurityToken.symbol({from:account_issuer});
      let st_name = await C_SecurityToken.name({from:account_issuer});
      let st_decimals = await C_SecurityToken.decimals({from:account_issuer});
      let st_owner = await C_SecurityToken.owner({from:account_issuer});

      console.log(`\nSecurity Token data:\n
        Symbol: ${st_symbol}\n
        Name: ${st_name}\n
        Decimals: ${st_decimals}\n
        Owner: ${st_owner}\n
      `);

      assert.equal(st_symbol, token_symbol, "token data is incorrect");

    });
  });

});
