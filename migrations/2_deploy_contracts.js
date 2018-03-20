const SecurityToken = artifacts.require('./SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO= artifacts.require('./DummySTO.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO= artifacts.require('./CappedSTO.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require('./TickerRegistrar.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
var web3; // Hardcoded development port

var BigNumber = require('bignumber.js')

const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";
const perm = [];

module.exports = async (deployer, network, accounts) => {
  var investor1;
  const PolymathAccount = accounts[0];
  var Issuer;

  if (network == 'development') {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    investor1 = accounts[3];
    Issuer = accounts[1];
  }
  else if (network == 'ropsten') {
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
    investor1 = '0x37e1411f518226a7e1b4e8eb8bb0e0e9f7f86580';
    Issuer = PolymathAccount;
  }
  else if (network == 'mainnet') {
    web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
  }
   
  // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // 1. Deploy the token faucet of polymath
  await deployer.deploy(PolyTokenFaucet);
  // 2. Deploy Registry, Transfer Manager
  await deployer.deploy(ModuleRegistry, {from: PolymathAccount});
  await deployer.deploy(GeneralTransferManagerFactory, {from: PolymathAccount});

  // 3. Register the Transfer Manager module
  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount});

  // 4. Deploy Ticker Registrar and SecurityTokenRegistrar
  await deployer.deploy(TickerRegistrar, {from: PolymathAccount});
  await deployer.deploy(SecurityTokenRegistrar, ModuleRegistry.address, TickerRegistrar.address, GeneralTransferManagerFactory.address, {from: PolymathAccount});
  let tickerRegistrar = await TickerRegistrar.deployed();
  await tickerRegistrar.setTokenRegistrar(SecurityTokenRegistrar.address, {from: PolymathAccount});

  // B) DEPLOY STO factories and register them with the Registry
  await deployer.deploy(DummySTOFactory, {from: PolymathAccount});
  await moduleRegistry.registerModule(DummySTOFactory.address, {from: PolymathAccount});
  await deployer.deploy(CappedSTOFactory, {from: PolymathAccount});
  await moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount});

  // -------- END OF SETUP -------

  // ** Token Deployment **
  // 1. Register ticker symbol
  await tickerRegistrar.registerTicker(symbol, "poly@polymath.network", { from: Issuer });
 
  // 2. Deploy Token
  let STRegistrar = await SecurityTokenRegistrar.deployed();
  let r_generateSecurityToken = await STRegistrar.generateSecurityToken(name, symbol, 18, tokenDetails, { from: Issuer });
  let newSecurityTokenAddress = r_generateSecurityToken.logs[0].args._securityTokenAddress;
  let securityToken = await SecurityToken.at(newSecurityTokenAddress);
  //console.log(securityToken);

  // 3. Get Transfer Module and Initialize STO module
  let generalTransferManagerObject = await securityToken.modules(1);
  let generalTransferManager = await GeneralTransferManager.at(generalTransferManagerObject[1]);

  //Generate bytes to initialise the DummySTO - args for its initFunction are:
  //configure(uint256 _startTime, uint256 _endTime, uint256 _cap, bytes32 _someBytes)
  // let bytesSTO = web3.eth.abi.encodeFunctionCall({
  //     name: 'configure',
  //     type: 'function',
  //     inputs: [{
  //         type: 'uint256',
  //         name: '_startTime'
  //     },{
  //         type: 'uint256',
  //         name: '_endTime'
  //     },{
  //         type: 'uint256',
  //         name: '_cap'
  //     },{
  //         type: 'string',
  //         name: '_someString'
  //     }
  //     ]
  // }, ['1', '2', '3', "SomeString"]);
  //address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm, bool _replaceable
  // let r_DummySTOFactory = await securityToken.addModule(DummySTOFactory.address, bytesSTO, 0, perm, false, {from: owner});
  // let dummySTOAddress =  r_DummySTOFactory.logs[1].args._module;
  // let dummySTO = await DummySTO.at(dummySTOAddress);
  //
  // console.log((await dummySTO.startTime()).toString());
  // console.log((await dummySTO.endTime()).toString());
  // console.log((await dummySTO.cap()).toString());
  // console.log(await dummySTO.someString());
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
      }
      ]
  }, [(Date.now())/1000, (Date.now()+3600 * 24)/1000, web3.utils.toWei('100000', 'ether'), '1000']);

  let r_CappedSTOFactory = await securityToken.addModule(CappedSTOFactory.address, bytesSTO, 0, perm, false, { from: Issuer });
  let cappedSTOAddress =  r_CappedSTOFactory.logs[1].args._module;
  let cappedSTO = await CappedSTO.at(cappedSTOAddress);

  // console.log((await cappedSTO.startTime()).toString());
  // console.log((await cappedSTO.endTime()).toString());
  // console.log((await cappedSTO.cap()).toString());
  // console.log((await cappedSTO.rate()).toString());

  // 4. Add investor to whitelist
  await generalTransferManager.modifyWhitelist(investor1, (Date.now()+3600 * 24)/1000, (Date.now()+3600 * 24)/1000, { from: Issuer });

//   // 5. INVEST
//   let r = await cappedSTO.buyTokens(investor1, {from: investor1, value:web3.utils.toWei('1', 'ether')});
//   let investorCount = await cappedSTO.investorCount();

//   console.log(`
//     ---------------------------------------------------------------
//     --------- INVESTED IN STO ---------
//     ---------------------------------------------------------------
//     - ${r.logs[0].args.beneficiary} purchased ${web3.utils.fromWei(r.logs[0].args.amount.toString(10))} tokens!
//     - Investor count: ${investorCount}
//     ---------------------------------------------------------------
//   `);

};
