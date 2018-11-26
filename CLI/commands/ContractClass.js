const contracts = require('./helpers/contract_addresses')
const common = require('./common/common_functions')
const abis = require('./helpers/contract_abis')
const gbl = require('./common/global')

class Contract {
  static async connect (contractName) {
    return new web3.eth.Contract(abis[contractName](), await contracts[contractName]())
  }

  static async call (contract, methodName, methodArguments) {
    try {
      return await contract.methods[methodName].apply(this, methodArguments).call()
    } catch (e) {
      console.log(`${methodName} call - `.toUpperCase(), e.message)
      process.exit(0)
    }
  }

  static async owner (contract) {
    return await contract.methods.owner().call() == Issuer.address
  }

  static async transaction (contract, methodName, methodArguments, options) {
    try {
      await common.sendTransaction(contract.methods[methodName].apply(this, methodArguments), options);
    } catch(e) {
      console.log(`Transaction error - ${e}`)
    }
  }
}

module.exports = Contract