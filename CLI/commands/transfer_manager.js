const readlineSync = require('readline-sync');
const chalk = require('chalk');
const ethers = require('ethers');
const common = require('./common/common_functions');
const global = require('./common/global');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');

const MODULES_TYPES = {
  PERMISSION: 1,
  TRANSFER: 2,
  STO: 3,
  DIVIDEND: 4,
  BURN: 5
}

// App flow
let tokenSymbol;
let securityToken;
let securityTokenRegistry;
let network;

async function executeApp(remoteNetwork) {
  network = remoteNetwork;
  await global.initialize(remoteNetwork);
  
  common.logAsciiBull();
  console.log("*********************************************");
  console.log("Welcome to the Command-Line Transfer Manager.");
  console.log("*********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();
  try {
    await start_explorer();
  } catch (err) {
    console.log(err);
    return;
  }
};

async function setup(){
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function start_explorer() {
  console.log('\n\x1b[34m%s\x1b[0m',"Transfer Manager - Main Menu");

  if (!tokenSymbol)
    tokenSymbol = readlineSync.question('Enter the token symbol: ');

  let result = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (result == "0x0000000000000000000000000000000000000000") {
    tokenSymbol = undefined;
    console.log(chalk.red(`Token symbol provided is not a registered Security Token.`));
  } else {
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI,result);
    
    let tmModules = securityToken.methods.getModulesByType(MODULES_TYPES.TRANSFER).call();

    let options = [];
    let forcedTransferDisabled = await securityToken.methods.controllerDisabled().call();
    if (!forcedTransferDisabled) {
      options.push('Forced Transfers');
    }

    options.push('GeneralTransferManager', 'ManualApprovalTransferManager', 'PercentageTransferManager', 'CountTransferManager',
     'SingleTradeVolumeRestrictionTM', 'LookupVolumeRestrictionTM');

    let index = readlineSync.keyInSelect(options, 'Choose one:');
    let optionSelected = options[index];
    console.log('Selected:', index != -1 ? optionSelected : 'Cancel', '\n');
    switch (optionSelected) {
      case 'Forced Transfers':
        await forcedTransfers();
        break;
      case 'GeneralTransferManager':
        await generalTransferManager();
        break;
      case 'ManualApprovalTransferManager':
        await manualApprovalTransferManager();
        break;
      case 'PercentageTransferManager':
        await percentageTransferManager();
        break;
      case 'CountTransferManager':
        await countTransferManager();
        break;
      case 'SingleTradeVolumeRestrictionTM':
        await singleTradeVolumeRestrictionTM();
        break;
      case 'LookupVolumeRestrictionTM':
        await lookupVolumeRestrictionTM();
        break;
    }
  }

  //Restart
  await start_explorer();
}

async function forcedTransfers() {
  let options = ['Disable controller', 'Set controller'];
  let controller = await securityToken.methods.controller().call();
  if (controller == Issuer.address) {
    options.push('Force Transfer');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?');
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Cancel', '\n');
  switch (optionSelected) {
    case 'Disable controller':
      if (readlineSync.keyInYNStrict()) {
        let disableControllerAction = securityToken.methods.disableController();
        await common.sendTransaction(Issuer, disableControllerAction, defaultGasPrice);
        console.log(chalk.green(`Forced transfers have been disabled permanently`));
      }
      break;
    case 'Set controller':
      let controllerAddress = readlineSync.question(`Enter the address for the controller (${Issuer.address}): `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
        defaultInput: Issuer.address
      });
      let setControllerAction = securityToken.methods.setController(controllerAddress);
      let setControllerReceipt = await common.sendTransaction(Issuer, setControllerAction, defaultGasPrice);
      let setControllerEvent = common.getEventFromLogs(securityToken._jsonInterface, setControllerReceipt.logs, 'SetController');
      console.log(chalk.green(`New controller is ${setControllerEvent._newController}`));
      break;
    case 'Force Transfer':
      let from = readlineSync.question('Enter the address from which to take tokens: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
      });
      let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(from).call());
      console.log(chalk.yellow(`Balance of ${from}: ${fromBalance} ${tokenSymbol}`));
      let to = readlineSync.question('Enter address where to send tokens: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
      });
      let toBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(to).call());
      console.log(chalk.yellow(`Balance of ${to}: ${toBalance} ${tokenSymbol}`));
      let amount = readlineSync.question('Enter amount of tokens to transfer: ', {
        limit: function (input) {
          return parseInt(input) <= parseInt(fromBalance);
        },
        limitMessage: `Amount must be less or equal than ${fromBalance} ${tokenSymbol}`,
      });
      let data = readlineSync.question('Enter the data to indicate validation: ');
      let log = readlineSync.question('Enter the data attached to the transfer by controller to emit in event: ');
      let forceTransferAction = securityToken.methods.forceTransfer(from, to, web3.utils.toWei(amount), web3.utils.asciiToHex(data), web3.utils.asciiToHex(log));
      let forceTransferReceipt = await common.sendTransaction(Issuer, forceTransferAction, defaultGasPrice, 0, 1.5);
      let forceTransferEvent = common.getEventFromLogs(securityToken._jsonInterface, forceTransferReceipt.logs, 'ForceTransfer');
      console.log(chalk.green(`  ${forceTransferEvent._controller} has successfully forced a transfer of ${web3.utils.fromWei(forceTransferEvent._value)} ${tokenSymbol} 
  from ${forceTransferEvent._from} to ${forceTransferEvent._to} 
  Verified transfer: ${forceTransferEvent._verifyTransfer}
  Data: ${web3.utils.hexToAscii(forceTransferEvent._data)}
        `));
      console.log(`Balance of ${from} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(from).call())} ${tokenSymbol}`);
      console.log(`Balance of ${to} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(to).call())} ${tokenSymbol}`);
      break;
  }
}

async function generalTransferManager() {
  let options = ['Change Issuance Address', 'Change Signing Address', 'Change Allow All Transfers', 'Change Allow All Whitelist Transfers',
                'Change Allow All Whitelist Issuances', 'Change Allow All Burn Transfers', 'Modify Whitelist', 'Modify Whitelist from CSV',
                'Modify Whitelist Signed'];
  let index = readlineSync.keyInSelect(options, 'What do you want to do?');
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Cancel', '\n');
  switch (optionSelected) {
    case 'Change Issuance Address':
      let issuanceAddress = readlineSync.question('Enter the new issuance address: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let changeIssuanceAddressAction = currentTransferManager.methods.changeIssuanceAddress(issuanceAddress);
      let changeIssuanceAddressReceipt = await common.sendTransaction(Issuer.address, changeIssuanceAddressAction, defaultGasPrice);
      let changeIssuanceAddressEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeIssuanceAddressReceipt.logs, 'ChangeIssuanceAddress');
      console.log(chalk.green(`${changeIssuanceAddressEvent._issuanceAddress} is the new address for the issuance!`));
      break;
    case 'Change Signing Address':
      let signingAddress = readlineSync.question('Enter the new signing address: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let changeSigningAddressAction = currentTransferManager.methods.changeSigningAddress(signingAddress);
      let changeSigningAddressReceipt = await common.sendTransaction(Issuer.address, changeSigningAddressAction, defaultGasPrice);
      let changeSigningAddressEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeSigningAddressReceipt.logs, 'ChangeSigningAddress');
      console.log(chalk.green(`${changeSigningAddressEvent._signingAddress} is the new address for the signing!`));
      break;
    case 'Change Allow All Transfers':
      let allowAllTransfers = readlineSync.keyInYNStrict('Do you want to remove all restrictions for any addresses?'); 
      let changeAllowAllTransfersAction = currentTransferManager.methods.changeAllowAllTransfers(allowAllTransfers);
      let changeAllowAllTransfersReceipt = await common.sendTransaction(Issuer.address, changeAllowAllTransfersAction, defaultGasPrice);
      let changeAllowAllTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllTransfersReceipt.logs, 'AllowAllTransfers');
      if (changeAllowAllTransfersEvent._allowAllTransfers) {
        console.log(chalk.green(`All transfers are allowed!`));
      } else {
        console.log(chalk.green(`Transfers are restricted!`));
      }
      break;
    case 'Change Allow All Whitelist Transfers':
      let allowAllWhitelistTransfers = readlineSync.keyInYNStrict('Do you want to ignore time locks from whitelist (address must still be whitelisted)?'); 
      let changeAllowAllWhitelistTransfersAction = currentTransferManager.methods.changeAllowAllWhitelistTransfers(allowAllWhitelistTransfers);
      let changeAllowAllWhitelistTransfersReceipt = await common.sendTransaction(Issuer.address, changeAllowAllWhitelistTransfersAction, defaultGasPrice);
      let changeAllowAllWhitelistTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllWhitelistTransfersReceipt.logs, 'AllowAllWhitelistTransfers');
      if (changeAllowAllWhitelistTransfersEvent._allowAllWhitelistTransfers) {
        console.log(chalk.green(`Time locks from whitelist are ignored for transfers!`));
      } else {
        console.log(chalk.green(`Transfers are restricted by time locks from whitelist!`));
      }
      break;
    case 'Change Allow All Whitelist Issuances':
      let allowAllWhitelistIssuances = readlineSync.keyInYNStrict('Do you want to ignore time locks from whitelist (address must still be whitelisted)?'); 
      let changeAllowAllWhitelistIssuancesAction = currentTransferManager.methods.changeAllowAllIssuancesTransfers(allowAllWhitelistIssuances);
      let changeAllowAllWhitelistIssuancesReceipt = await common.sendTransaction(Issuer.address, changeAllowAllWhitelistIssuancesAction, defaultGasPrice);
      let changeAllowAllWhitelistIssuancesEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllWhitelistIssuancesReceipt.logs, 'AllowAllWhitelistIssuances');
      if (changeAllowAllWhitelistIssuancesEvent._allowAllWhitelistIssuances) {
        console.log(chalk.green(`Time locks from whitelist are ignored for issuances!`));
      } else {
        console.log(chalk.green(`Issuances are restricted by time locks from whitelist!`));
      }
      break;
    case 'Change Allow All Burn Transfers':
      let allowAllBurnTransfers = readlineSync.keyInYNStrict('Do you want to ignore time locks from whitelist (address must still be whitelisted)?');
      let changeAllowAllBurnTransfersAction = currentTransferManager.methods.allowAllBurnTransfers(allowAllBurnTransfers);
      let changeAllowAllBurnTransfersReceipt = await common.sendTransaction(Issuer.address, changeAllowAllBurnTransfersAction, defaultGasPrice);
      let changeAllowAllBurnTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllBurnTransfersReceipt.logs, 'AllowAllBurnTransfers');
      if (changeAllowAllBurnTransfersEvent._allowAllWhitelistTransfers) {
        console.log(chalk.green(`To burn tokens is allowed!`));
      } else {
        console.log(chalk.green(`The burning mechanism is deactivated!`));
      }
      break;
    case 'Modify Whitelist':
      let investor = readlineSync.question('Enter the address to whitelist: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let fromTime = readlineSync.questionInt('Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens: ');
      let toTime = readlineSync.questionInt('Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others: ');
      let expiryTime = readlineSync.questionInt('Enter the time till investors KYC will be validated (after that investor need to do re-KYC): ');
      let canBuyFromSTO = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      let modifyWhitelistAction = currentTransferManager.methods.modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO);
      let modifyWhitelistReceipt = await common.sendTransaction(Issuer.address, modifyWhitelistAction, defaultGasPrice);
      let modifyWhitelistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${modifyWhitelistEvent._investor} has been whitelisted sucessfully!`));
    case 'Modify Whitelist from CSV':
      console.log(chalk.yellow(`Data is going to be read from 'data/whitelist_data.csv'. Be sure this file is updated!`));
      if (readlineSync.keyInYNStrict(`Do you want to continue?`)) {
        shell.exec(`${__dirname}/scripts/script.sh Whitelist ${tokenSymbol} 75 ${network}`);
      }
      break;
    /*
    case 'Modify Whitelist Signed':
      let investorSigned = readlineSync.question('Enter the address to whitelist: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let fromTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens: ');
      let toTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others: ');
      let expiryTimeSigned = readlineSync.questionInt('Enter the time till investors KYC will be validated (after that investor need to do re-KYC): ');
      let vSigned = readlineSync.questionInt('Enter v: ');
      let rSigned = readlineSync.question('Enter r: ');
      let sSigned = readlineSync.question('Enter s: ');
      let canBuyFromSTOSigned = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      let modifyWhitelistSignedAction = currentTransferManager.methods.modifyWhitelistSigned(investorSigned, fromTimeSigned, toTimeSigned, expiryTimeSigned, canBuyFromSTOSigned);
      let modifyWhitelistSignedReceipt = await common.sendTransaction(Issuer.address, modifyWhitelistSignedAction, defaultGasPrice);
      let modifyWhitelistSignedEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistSignedReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${modifyWhitelistSignedEvent._investor} has been whitelisted sucessfully!`));
      break;
    */
  }
}

async function singleTradeVolumeRestrictionTM() {
  let primaryIssuanceAllowed = await currentTransferManager.methods.allowPrimaryIssuance().call();
  let allowPrimeryIssuanceOption = primaryIssuanceAllowed ? 'Allow Primary Issuance' : 'Disallow Primary Issuance';
  
  let options = [allowPrimeryIssuanceOption, 'Add exempted wallet', 'Remove exempted wallet'];

  let isTransferLimitInPercentage = await currentTransferManager.methods.isTransferLimitInPercentage().call();
  if (isTransferLimitInPercentage) {
    options.push('Change transfer limit to tokens', 'Change default percentage limit', 
                'Set percentage transfer limit per account', 'Remove percentage transfer limit per account');
  } else {
    options.push('Change transfer limit to percentage', 'Change default tokens limit', 
                'Set tokens transfer limit per account', 'Remove tokens transfer limit per account');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?');
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Cancel', '\n');
  switch (optionSelected) {
    case 'Allow Primary Issuance':
      let allowPrimaryIssuanceAction = currentTransferManager.methods.setAllowPrimaryIssuance(true);
      await common.sendTransaction(Issuer.address, allowPrimaryIssuanceAction, defaultGasPrice);
      break;
    case 'Disallow Primary Issuance':
      let disallowPrimaryIssuanceAction = currentTransferManager.methods.setAllowPrimaryIssuance(false);
      await common.sendTransaction(Issuer.address, disallowPrimaryIssuanceAction, defaultGasPrice);
      break;
    case 'Add exempted wallet':
      let walletToExempt = readlineSync.question('Enter the wallet to exempt', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let addExemptWalletAction = currentTransferManager.methods.addExemptWallet(walletToExempt);
      let addExemptWalletReceipt = await common.sendTransaction(Issuer.address, addExemptWalletAction, defaultGasPrice);
      let addExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addExemptWalletReceipt.logs, 'ExemptWalletAdded');
      console.log(chalk.green(`${addExemptWalletEvent._wallet} has been exempted sucessfully!`));
      break;
    case 'Remove exempted wallet':
      let exemptedWallet = readlineSync.question('Enter the wallet to remove from exempt', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let removeExemptWalletAction = currentTransferManager.methods.removeExemptWallet(exemptedWallet);
      let removeExemptWalletReceipt = await common.sendTransaction(Issuer.address, removeExemptWalletAction, defaultGasPrice);
      let removeExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeExemptWalletReceipt.logs, 'ExemptWalletRemoved');
      console.log(chalk.green(`${removeExemptWalletEvent._wallet} has been removed from exempt wallets sucessfully!`));
      break;
    case 'Change transfer limit to tokens':
      let newDefaultLimitInTokens = readlineSync.questionInt('Enter the amount of tokens for default limit: ', {
        limit: function(input) {
          return input > 0;
        },
        limitMessage: "Must be greater than zero"
      }); 
      let changeTransferLimitToTokensAction = currentTransferManager.methods.changeTransferLimitToTokens(web3.utils.toWei(newDefaultLimitInTokens));
      let changeTransferLimitToTokensReceipt = await common.sendTransaction(Issuer.address, changeTransferLimitToTokensAction, defaultGasPrice);
      let changeTransferLimitToTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeTransferLimitToTokensReceipt.logs, 'GlobalTransferLimitInTokensSet');
      console.log(chalk.green(`Transfer limit has been set to tokens sucessfully!`));
      console.log(chalk.green(`The default transfer limit is ${changeTransferLimitToTokensEvent._amount} ${tokenSymbol}`));
      break;
    case 'Change transfer limit to percentage':
      let newDefaultLimitInPercentage = readlineSync.questionInt('Enter the percentage for default limit: ', {
        limit: function(input) {
          return 0 < input <= 100;
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }); 
      let changeTransferLimitToPercentageAction = currentTransferManager.methods.changeTransferLimitToPercentage(newDefaultLimitInPercentage);
      let changeTransferLimitToPercentageReceipt = await common.sendTransaction(Issuer.address, changeTransferLimitToPercentageAction, defaultGasPrice);
      let changeTransferLimitToPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeTransferLimitToPercentageReceipt.logs, 'GlobalTransferLimitInPercentageSet');
      console.log(chalk.green(`Transfer limit has been set to tokens sucessfully!`));
      console.log(chalk.green(`The default transfer limit is ${changeTransferLimitToPercentageEvent._percentage}%`));
      break;
    case 'Change default percentage limit':
      let defaultLimitInPercentage = readlineSync.questionInt('Enter the percentage for default limit: ', {
        limit: function(input) {
          return 0 < input <= 100;
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }); 
      let changeGlobalLimitInPercentageAction = currentTransferManager.methods.changeGlobalLimitInPercentage(defaultLimitInPercentage);
      let changeGlobalLimitInPercentageReceipt = await common.sendTransaction(Issuer.address, changeGlobalLimitInPercentageAction, defaultGasPrice);
      let changeGlobalLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeGlobalLimitInPercentageReceipt.logs, 'GlobalTransferLimitInPercentageSet');
      console.log(chalk.green(`The default transfer limit is ${changeGlobalLimitInPercentageEvent._percentage}%`));
      break;
    case 'Change default tokens limit':
      let defaultLimitInTokens = readlineSync.questionInt('Enter the amount of tokens for default limit: ', {
        limit: function(input) {
          return input > 0;
        },
        limitMessage: "Must be greater than zero"
      }); 
      let changeGlobalLimitInTokensAction = currentTransferManager.methods.changeGlobalLimitInTokens(web3.utils.toWei(defaultLimitInTokens));
      let changeGlobalLimitInTokensReceipt = await common.sendTransaction(Issuer.address, changeGlobalLimitInTokensAction, defaultGasPrice);
      let changeGlobalLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeGlobalLimitInTokensReceipt.logs, 'GlobalTransferLimitInTokensSet');
      console.log(chalk.green(`The default transfer limit is ${changeGlobalLimitInTokensEvent._amount} ${tokenSymbol}`));
      break;
    case 'Set percentage transfer limit per account':
      let percentageAccount = readlineSync.question('Enter the wallet: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let accountLimitInPercentage = readlineSync.questionInt(`Enter the transfer limit for ${percentageAccount} in percentage: `, {
        limit: function(input) {
          return 0 < input <= 100;
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }); 
      let setTransferLimitInPercentageAction = currentTransferManager.methods.setTransferLimitInPercentage(percentageAccount, web3.utils.toWei(accountLimitInPercentage));
      let setTransferLimitInPercentageReceipt = await common.sendTransaction(Issuer.address, setTransferLimitInPercentageAction, defaultGasPrice);
      let setTransferLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, setTransferLimitInPercentageReceipt.logs, 'TransferLimitInPercentageSet');
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInPercentageEvent._wallet} is ${setTransferLimitInPercentageEvent._percentage}%`));
      break;
    case 'Set tokens transfer limit per account':
      let tokensAccount = readlineSync.question('Enter the wallet: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let accountLimitInTokens = readlineSync.questionInt(`Enter the transfer limit for ${tokensAccount} in amount of tokens: `, {
        limit: function(input) {
          return input > 0;
        },
        limitMessage: "Must be greater than zero"
      }); 
      let setTransferLimitInTokensAction = currentTransferManager.methods.setTransferLimitInTokens(tokensAccount, web3.utils.toWei(accountLimitInTokens));
      let setTransferLimitInTokensReceipt = await common.sendTransaction(Issuer.address, setTransferLimitInTokensAction, defaultGasPrice);
      let setTransferLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, setTransferLimitInTokensReceipt.logs, 'TransferLimitInTokensSet');
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInTokensEvent._wallet} is ${setTransferLimitInTokensEvent._percentage} ${tokenSymbol}`));
      break;
    case 'Remove percentage transfer limit per account':
      let percentageAccountToRemove = readlineSync.question('Enter the wallet to remove: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let removeTransferLimitInPercentageAction = currentTransferManager.methods.removeTransferLimitInPercentage(percentageAccountToRemove);
      let removeTransferLimitInPercentageReceipt = await common.sendTransaction(Issuer.address, removeTransferLimitInPercentageAction, defaultGasPrice);
      let removeTransferLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeTransferLimitInPercentageReceipt.logs, 'TransferLimitInPercentageRemoved');
      console.log(chalk.green(`The transfer limit for ${removeTransferLimitInPercentageEvent._wallet} is the default limit`));
      break;
    case 'Remove tokens transfer limit per account':
      let tokensAccountToRemove = readlineSync.question('Enter the wallet to remove: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let removeTransferLimitInTokensAction = currentTransferManager.methods.removeTransferLimitInTokens(tokensAccountToRemove);
      let removeTransferLimitInTokensReceipt = await common.sendTransaction(Issuer.address, removeTransferLimitInTokensAction, defaultGasPrice);
      let removeTransferLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeTransferLimitInTokensReceipt.logs, 'TransferLimitInTokensRemoved');
      console.log(chalk.green(`The transfer limit for ${removeTransferLimitInTokensEvent._wallet} is the default limit`));
      break;
  }
}
/*
// Copied from tests
function signData(tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo, pk) {
  let packedData = ethers.utils
      .solidityKeccak256(
          ["address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "uint256"],
          [tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo]
      )
      .slice(2);
  packedData = new Buffer(packedData, "hex");
  packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
  packedData = web3.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });
  return ethUtil.ecsign(new Buffer(packedData.slice(2), "hex"), new Buffer(pk, "hex"));
}
*/

module.exports = {
  executeApp: async function(type, remoteNetwork) {
    return executeApp(type, remoteNetwork);
  }
}