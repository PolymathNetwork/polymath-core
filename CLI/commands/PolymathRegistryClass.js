const contracts = require('./helpers/contract_addresses')
const Contract = require('./ContractClass')

class PolymathRegistry extends Contract {

  constructor () {
    super()
  }

  async _init() {
    if (!this.contract) {
      this.contract = Contract.connect("polymathRegistry", await contracts["polymathRegistry"]())
    }
  }

  async getAddress (arg) {
    await this._init()
    return Contract.call(this.contract, "getAddress", arg, () => {})
  }

  async iAmOwner () {
    await this._init()
    return Contract.owner(this.contract) == Issuer.address
  }

  async changeAddress (args) {
    await this._init()
    await Contract.transaction(this.contract, "changeAddress", args, {}, () => {})
  }
}

module.exports = new PolymathRegistry()
