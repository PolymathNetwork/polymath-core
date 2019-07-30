var common = require('./common/common_functions');

/////////////////////////////ARTIFACTS//////////////////////////////////////////
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis')

/////////////////////////GLOBAL VARS//////////////////////////////////////////
let _tokenSymbol; //token symbol
let _transferTo; //investment beneficiary
let _transferAmount; //ETH investment

let securityToken;

//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////

async function startScript(tokenSymbol, transferTo, transferAmount) {
  _tokenSymbol = tokenSymbol;
  _transferTo = transferTo;
  _transferAmount = transferAmount;

  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    transfer();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

async function transfer() {
  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(_tokenSymbol).call({}, function (error, result) {
    if (result != "0x0000000000000000000000000000000000000000") {
      console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
      let securityTokenABI = abis.securityToken();
      securityToken = new web3.eth.Contract(securityTokenABI, result);
    }
  });

  try{
    let transferAction = securityToken.methods.transfer(_transferTo,web3.utils.toWei(_transferAmount,"ether"));
    let receipt = await common.sendTransaction(transferAction);
    let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Transfer');
    console.log('\x1b[32m%s\x1b[0m', `
  Account ${event.from}
  transferred ${web3.utils.fromWei(event.value,"ether")} tokens
  to account ${event.to}`
    );
  } catch (err){
    console.log(err);
    console.log('\x1b[31m%s\x1b[0m', "\nThere was an error processing the transfer transaction. \nThe most probable cause for this error is one of the involved accounts not being in the whitelist or under a lockup period.");
    return;
  }
};

module.exports = {
  executeApp: async function(tokenSymbol, transferTo, transferAmount) {
        return startScript(tokenSymbol, transferTo, transferAmount);
    }
}
