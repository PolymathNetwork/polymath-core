const abis = require('./helpers/contract_abis')

class Validation {

  static _isMessage (str) {
    return (typeof msg === "string" && msg != "")
  }

  static isFunction (fn, msg) {
    let message = "Callback must be a function"
    if (typeof fn != "function") {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }

  static isAContract (name, msg) {
    let message = "Contract name is wrong"
    if (abis[name] === undefined) {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }

  static isAddress (address, msg) {
    let message = "Contract address is wrong"
    if (!web3.utils.isAddress(address)) {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }

  static isContract (obj, msg) {
    let message = "Contract is not defined"
    if (!this.isAddress(obj._address)) {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }

  static isValidMethod (contract, methodName, msg) {
    let message = "Method does not exist"
    if (contract.methods[methodName] === undefined) {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }

  static isArray (arr, msg) {
    let message = "Data must be an array"
    if (arr.constructor !== Array) {
      if (this._isMessage(msg)) {
        message = msg
      }
      throw message
    }
    return true
  }
}

module.exports = Validation