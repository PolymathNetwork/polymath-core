const common = require('./common/common_functions')
const abis = require('./helpers/contract_abis')

class Contract {
  static connect (contractName, address) {
    return new web3.eth.Contract(abis[contractName](), address)
  }

  static async call (contract, methodName, methodArguments, cbError) {
    try {
      return await contract.methods[methodName].apply(this, methodArguments).call()
    } catch (e) {
      cbError()
    }
  }

  static async owner (contract) {
    return await contract.methods.owner().call()
  }

  static async transaction (contract, methodName, methodArguments, options, cbError) {
    try {
      await common.sendTransaction(contract.methods[methodName].apply(this, methodArguments), options);
    } catch (e) {
      cbError()
    }
  }
}

module.exports = Contract