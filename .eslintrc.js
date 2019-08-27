module.exports = {
    "extends": "standard",
    "env": {
      "node": true,
      "es6": true,
      "mocha": true
    },
    "globals" : {
      "artifacts": false,
      "contract": false,
      "assert": false,
      "web3": false
    },
    "rules": {
	   "indent": 0,
	   "camelcase": 0,
     "no-unused-vars": 0,
     "quotes": 0,
     "semi": 0,
     "space-before-function-paren": 0,
     "no-array-constructor": 0,
     "object-curly-spacing": 0,
     "key-spacing": 0,
	}
};
