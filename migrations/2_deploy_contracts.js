const PolyToken = artifacts.require('./helpers/PolyToken.sol');
const SecurityToken = artifacts.require('./tokens/SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO= artifacts.require('./DummySTO.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO= artifacts.require('./CappedSTO.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersionProxy_001 = artifacts.require('./tokens/STVersionProxy_001.sol');
const STVersionProxy_002 = artifacts.require('./tokens/STVersionProxy_002.sol');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

var BigNumber = require('bignumber.js')

const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";

module.exports = async (deployer, network, accounts) => {

  const PolymathAccount = accounts[0];
  const Issuer = accounts[1];
  const investor1 = accounts[3];
  const investor2 = accounts[4];
  const Permission = accounts[5];

  // ----------- POLYMATH NETWORK Configuration ------------

  // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // 1. Deploy Registry, Transfer Manager, Permission Manager, (temp) PolyToken
  await deployer.deploy(ModuleRegistry, {from: PolymathAccount});
  await deployer.deploy(GeneralTransferManagerFactory, {from: PolymathAccount});
  await deployer.deploy(GeneralPermissionManagerFactory, {from: PolymathAccount});
  await deployer.deploy(PolyToken, {from: PolymathAccount});

  // 2. Register the Transfer Manager module
  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount});
  await moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount});

  // 3. Deploy Ticker Registry and SecurityTokenRegistry
  await deployer.deploy(STVersionProxy_001,GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount});
  let stVersionProxy_001 = await STVersionProxy_001.deployed();

  await deployer.deploy(TickerRegistry, {from: PolymathAccount});
  await deployer.deploy(SecurityTokenRegistry, PolyToken.address, ModuleRegistry.address, TickerRegistry.address,stVersionProxy_001.address, {from: PolymathAccount});
  let tickerRegistry = await TickerRegistry.deployed();
  await tickerRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount});

  // B) DEPLOY STO factories and register them with the Registry
  await deployer.deploy(CappedSTOFactory, {from: PolymathAccount});
  await moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount});

  // -------- END OF POLYMATH NETWORK Configuration -------

  // ----------- SECURITY TOKEN & STO DEPLOYMENT ------------

  // 1. Register ticker symbol
  await tickerRegistry.registerTicker(symbol, "poly@polymath.network", { from: Issuer });

  // 2. Deploy Token
  let STRegistry = await SecurityTokenRegistry.deployed();
  console.log("Creating Security Token");
  let protocolVer = web3.utils.toAscii(await STRegistry.protocolVersion());
  console.log("Protocol Version:",protocolVer);
  let protocolVerST = await STRegistry.protocolVersionST(protocolVer);
  console.log("Protocol Version ST:",protocolVerST);
  let r_generateSecurityToken = await STRegistry.generateSecurityToken(name, symbol, 18, tokenDetails, { from: Issuer });
  let newSecurityTokenAddress = r_generateSecurityToken.logs[1].args._securityTokenAddress;
  let securityToken = await SecurityToken.at(newSecurityTokenAddress);
  console.log("Token Version:",web3.utils.toAscii(await(securityToken.securityTokenVersion())));
  //console.log(securityToken);

  // 3. Get Transfer Module and Initialize STO module
  let generalTransferManagerObject = await securityToken.modules(2);
  let generalTransferManager = await GeneralTransferManager.at(generalTransferManagerObject[1]);
  let generalPermissionManagerObject = await securityToken.modules(1);
  let generalPermissionManager = await GeneralPermissionManager.at(generalPermissionManagerObject[1]);

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
  }, [Math.floor(Date.now()/1000) + 5, Math.floor(Date.now()/1000) + (100 * 24 * 60 * 60), BigNumber(100000 * 10**18), BigNumber(1000), BigNumber(0), PolyToken.address, Issuer]);

  console.log(Math.floor(Date.now()/1000), Math.floor(Date.now()/1000) + (100 * 24 * 60 * 60), BigNumber(100000 * 10**18), BigNumber(1000), BigNumber(0), PolyToken.address, Issuer);

  let r_CappedSTOFactory = await securityToken.addModule(CappedSTOFactory.address, bytesSTO, 0, false, { from: Issuer });
  //console.log(JSON.stringify(r_CappedSTOFactory));
  let cappedSTOAddress =  r_CappedSTOFactory.logs[1].args._module;
  let cappedSTO = await CappedSTO.at(cappedSTOAddress);

  // console.log((await cappedSTO.startTime()).toString());
  // console.log((await cappedSTO.endTime()).toString());
  // console.log((await cappedSTO.cap()).toString());
  // console.log((await cappedSTO.rate()).toString());

  // ----------- END OF SECURITY TOKEN & STO DEPLOYMENT ------------

  // ----------- WHITELISTING & INVESTING ------------

  // 4. Add investor to whitelist

  await generalTransferManager.modifyWhitelist(investor1, (Date.now()+3600 * 24)/1000, (Date.now()+3600 * 24)/1000, { from: Issuer });
  // 5. INVEST
  // let r = await cappedSTO.buyTokens(investor1, {from: investor1, value:web3.utils.toWei('1', 'ether')});
  // let investorCount = await cappedSTO.investorCount();
  //
  // console.log(`
  //   ---------------------------------------------------------------
  //   --------- INVESTED IN STO ---------
  //   ---------------------------------------------------------------
  //   - ${r.logs[0].args.beneficiary} purchased ${web3.utils.fromWei(r.logs[0].args.amount.toString(10))} tokens!
  //   - Investor count: ${investorCount}
  //   ---------------------------------------------------------------
  // `);
  //
  // try {
  //   await generalTransferManager.modifyWhitelist(investor2, (Date.now()+3600 * 24)/1000, (Date.now()+3600 * 24)/1000, { from: Permission });
  // } catch (err) {
  //   console.log("Failed to add investor 2 with invalid Permission (expected)");
  // }
  //
  // // 6. Set up Permission
  // //Only Issuer (owner of the ST) can do this for now
  // await generalPermissionManager.addPermission(Permission, "WhitelistPermission", { from: Issuer });
  // await generalPermissionManager.changePermission(Permission, generalTransferManagerObject[1], "WHITELIST", true, { from: Issuer });
  //
  // // 7. Permission adds whitelist for investor_2
  // await generalTransferManager.modifyWhitelist(investor2, (Date.now()+3600 * 24)/1000, (Date.now()+3600 * 24)/1000, { from: Permission });
  //
  // // 8. Investor_2 invests
  // r = await cappedSTO.buyTokens(investor2, {from: investor2, value:web3.utils.toWei('1', 'ether')});
  // investorCount = await cappedSTO.investorCount();
  //
  // console.log(`
  //   ---------------------------------------------------------------
  //   --------- INVESTED IN STO ---------
  //   ---------------------------------------------------------------
  //   - ${r.logs[0].args.beneficiary} purchased ${web3.utils.fromWei(r.logs[0].args.amount.toString(10))} tokens!
  //   - Investor count: ${investorCount}
  //   ---------------------------------------------------------------
  // `);
  //
  // // Token upgrade example
  // console.log("Example of Token Version Upgrade");
  // await tickerRegistry.registerTicker("V2", "v2@polymath.network", { from: Issuer });
  // await deployer.deploy(STVersionProxy_002,GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount});
  // let stVersionProxy_002 = await STVersionProxy_002.deployed();
  // await STRegistry.setProtocolVersion(stVersionProxy_002.address,web3.utils.fromAscii("0.0.2"),{from:PolymathAccount});
  // let protocolVerV2 = web3.utils.toAscii(await STRegistry.protocolVersion());
  // console.log("Protocol Version:",protocolVerV2);
  // let protocolVerSTV2 = await STRegistry.protocolVersionST(protocolVerV2);
  // console.log("Protocol Version ST:",protocolVerSTV2);
  // let r_generateSecurityTokenV2 = await STRegistry.generateSecurityToken(name, "V2", 18, tokenDetails, { from: Issuer });
  // let newSecurityTokenAddressV2 = r_generateSecurityTokenV2.logs[1].args._securityTokenAddress;
  // let securityTokenV2 = await SecurityToken.at(newSecurityTokenAddressV2);
  // console.log("Token Version:",web3.utils.toAscii(await(securityTokenV2.securityTokenVersion())));

};
