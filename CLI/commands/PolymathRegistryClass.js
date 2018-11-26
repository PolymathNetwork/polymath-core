const Contract = require('./ContractClass')

class PolymathRegistry extends Contract {
  constructor () {
    super()
  }

  async init () {
    this.contract = await Contract.connect("polymathRegistry")
  }

  async getAddress (arg) {
    return Contract.call(this.contract, "getAddress", arg)
  }

  async iAmOwner () {
    return Contract.owner(this.contract)
  }

  async changeAddress (args) {
    await Contract.transaction(this.contract, "changeAddress", args, {})
  }
}

module.exports = new PolymathRegistry()
