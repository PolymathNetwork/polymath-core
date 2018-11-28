const chalk = require('chalk')
const Tx = require('ethereumjs-tx')
const abis = require('./helpers/contract_abis')
const permissionsList = require('./common/permissions_list')

class Contract {

  constructor (contractName, address) {
    this.contract = new web3.eth.Contract(abis[contractName](), address)
  }

  async sendTransaction (action, options) {

    await this._checkPermissions(action)

    options = this._getFinalOptions(options)
    const gasLimit = await this._getGasLimit(options, action)

    console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${action._method.name} - Gas limit provided: ${gasLimit} ----`));    

    const nonce = await web3.eth.getTransactionCount(options.from.address);
    const parameter = {
      from: options.from.address,
      to: action._parent._address,
      data: action.encodeABI(),
      gasLimit: gasLimit,
      gasPrice: options.gasPrice,
      nonce: nonce,
      value: web3.utils.toHex(options.value)
    }

    const transaction = new Tx(parameter)
    transaction.sign(Buffer.from(options.from.privateKey.replace('0x', ''), 'hex'))
    return await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
    .on('transactionHash', function(hash) {
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}`
      )
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.
        Gas used: ${receipt.gasUsed} - Gas spent: ${web3.utils.fromWei((new web3.utils.BN(options.gasPrice)).mul(new web3.utils.BN(receipt.gasUsed)))} Ether
        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
      )
    })
  }

  async call (methodName, methodArguments, cbError) {
    try {
      return await this.contract.methods[methodName].apply(this, methodArguments).call()
    } catch (e) {
      cbError(e)
    }
  }

  async owner () {
    return await this.contract.methods.owner().call()
  }

  methods() {
    return this.contract.methods
  }

  async _checkPermissions (contractName, functionName, contractRegistry) {

    let permission = permissionsList.verifyPermission(contractName, functionName)
    if (permission === undefined) {
      return true
    }
    let stAddress = await contractRegistry.methods.securityToken().call()
    let securityToken = await this._connect(abis.securityToken(), stAddress)
    let stOwner = await securityToken.methods.owner().call()
    if (stOwner == Issuer.address) {
      return true
    }
    let result = await securityToken.methods.checkPermission(Issuer.address, contractRegistry.options.address, web3.utils.asciiToHex(permission)).call()
    return result
  }

  async _connect (abi, address) {

    const contractRegistry = new web3.eth.Contract(abi, address)
    contractRegistry.setProvider(web3.currentProvider)
    return contractRegistry
  };

  _getFinalOptions (options) {

    if (typeof options != "object") {
      options = {}
    }
    const defaultOptions = {
      from: Issuer,
      gasPrice: defaultGasPrice,
      value: undefined,
      factor: 1.2
    }
    return Object.assign(defaultOptions, options)
  };
  
  async _getGasLimit (options, action) {

    let block = await web3.eth.getBlock("latest");
    let networkGasLimit = block.gasLimit;
    let gas = Math.round(options.factor * (await action.estimateGas({ from: options.from.address, value: options.value})));
    return (gas > networkGasLimit) ? networkGasLimit : gas;
  }

}

module.exports = Contract