
const SecurityToken = artifacts.require('./contracts/SecurityToken.sol');

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
  let C_SecurityToken;
  let C_CSTOCrowdsale;


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

    //C_PolyToken = await PolyToken.new({from:account_polymath});

    // Deploy Token
    C_SecurityToken = await SecurityToken.new(token_owner,token_totalSupply,token_name, token_symbol,token_decimals,{from:account_issuer});
  });

  // Step 1: Deploy SecurityToken contract

  describe("Deploy Example Token contract", async function () {

    it("Should have deployed all contracts", async function () {
      console.log(`\nPolymath Network Smart Contracts Deployed:\n
        SecurityToken: ${C_SecurityToken.address}\n
      `);

      assert.notEqual(C_SecurityToken.address.valueOf(), "0x0000000000000000000000000000000000000000", "contract was not deployed");

    });

    it("Should have the correct data", async function () {

      let st_symbol = await C_SecurityToken.symbol({from:account_issuer});
      let st_name = await C_SecurityToken.name({from:account_issuer});
      let st_totalSupply = await C_SecurityToken.totalSupply({from:account_issuer});
      let st_decimals = await C_SecurityToken.decimals({from:account_issuer});
      let st_owner = await C_SecurityToken.owner({from:account_issuer});

      console.log(`\nSecurity Token data:\n
        Symbol: ${st_symbol}\n
        Name: ${st_name}\n
        TotalSupply: ${st_totalSupply}\n
        Decimals: ${st_decimals}\n
        Owner: ${st_owner}\n
      `);

      assert.equal(st_symbol, token_symbol, "token data is incorrect");

    });
  });

});
