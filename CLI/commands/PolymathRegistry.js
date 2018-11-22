const contracts = require('./helpers/contract_addresses')
const common = require('./common/common_functions')
const abis = require('./helpers/contract_abis')
const gbl = require('./common/global')

/*
const PolymathRegistry = require('./commands/PolymathRegistry')

await PolymathRegistry.init()
await PolymathRegistry.getAddress()
await PolymathRegistry.iAmOwner()
await PolymathRegistry.changeAddress(["SecurityTokenRegistry", "0xB51E15f7D4377B7A98eC632649c30B2bCA3548F9"])
*/

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
    await common.sendTransaction(contract.methods[methodName].apply(this, methodArguments), options);
  }
}

class PolymathRegistry extends Contract {
  constructor () {
    super()
  }

  async init () {
    this.contract = await Contract.connect("polymathRegistry")
  }

  async getAddress () {
    return Contract.call(this.contract, "getAddress", ["SecurityTokenRegistry"])
  }

  async iAmOwner () {
    return Contract.owner(this.contract)
  }

  async changeAddress (args) {
    Contract.transaction(this.contract, "changeAddress", args, {})
  }
}

module.exports = new PolymathRegistry()
