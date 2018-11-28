const contracts = require('./helpers/contract_addresses')
const Validation = require('./ValidationClass')
const Contract = require('./ContractClass')

class PolymathRegistry extends Validation {

  async _init() {
    if (!this.contract) {
      this.contract = new Contract("polymathRegistry", await contracts["polymathRegistry"]())
    }
  }

  async getAddress (arg) {
    Validation.isArray(arg)

    await this._init()
    return this.contract.call("getAddress", arg, () => {})
  }

  async iAmOwner () {
    await this._init()
    return this.contract.owner() == Issuer.address
  }

  async changeAddress (args) {
    Validation.isArray(arg)

    await this._init()
    await this.contract.sendTransaction(this.contract.methods()["changeAddress"].apply(this, args))
  }
}

module.exports = new PolymathRegistry()
