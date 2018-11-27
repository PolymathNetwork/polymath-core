const common = require('./common/common_functions')
const abis = require('./helpers/contract_abis')
const Validation = require('./ValidationClass')

class Contract extends Validation {

  constructor () {
    super()
  }

  static connect (contractName, address) {
    Validation.isAContract(contractName)
    Validation.isAddress(address)

    return new web3.eth.Contract(abis[contractName](), address)
  }

  static async call (contract, methodName, methodArguments, cbError) {
    Validation.isContract(contract)
    Validation.isValidMethod(contract, methodName)
    Validation.isArray(methodArguments)
    Validation.isFunction(cbError)

    try {
      return await contract.methods[methodName].apply(this, methodArguments).call()
    } catch (e) {
      cbError(e)
    }
  }

  static async owner (contract) {
    Validation.isContract(contract)

    return await contract.methods.owner().call()
  }

  static async transaction (contract, methodName, methodArguments, options, cbError) {
    Validation.isContract(contract)
    Validation.isValidMethod(contract, methodName)
    Validation.isArray(methodArguments)
    Validation.isFunction(cbError)
    
    try {
      await common.sendTransaction(contract.methods[methodName].apply(this, methodArguments), options);
    } catch (e) {
      cbError(e)
    }
  }
}

module.exports = Contract