var readlineSync = require('readline-sync');

function readAddress(message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: defaultValue
  });
}

function readMultipleAddresses(message) {
  return readlineSync.question(message, {
    limit: function (input) {
      return input === '' || input.split(",").every(a => web3.utils.isAddress(a));
    },
    limitMessage: `All addresses must be valid`
  });
}

function readPercentage(message, defaultValue) {
  return readlineSync.question(`${message} (number between 0-100): `, {
    limit: function (input) {
      return (parseFloat(input) >= 0 && parseFloat(input) <= 100);
    },
    limitMessage: 'Must be a value between 0 and 100',
    defaultInput: defaultValue
  });
}

function readNumberGreaterThan(minValue, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return parseFloat(input) > minValue;
    },
    limitMessage: `Must be greater than ${minValue}`,
    defaultInput: defaultValue
  });
}

function readNumberGreaterThanOrEqual(minValue, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return parseFloat(input) >= minValue;
    },
    limitMessage: `Must be greater than or equal ${minValue}`,
    defaultInput: defaultValue
  });
}

function readNumberLessThan(maxValue, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return parseFloat(input) < maxValue;
    },
    limitMessage: `Must be less than ${maxValue}`,
    defaultInput: defaultValue
  });
}

function readNumberLessThanOrEqual(maxValue, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return parseFloat(input) < maxValue;
    },
    limitMessage: `Must be less than or equal ${maxValue}`,
    defaultInput: defaultValue
  });
}
  
function readNumberBetween(minValue, maxValue, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return parseFloat(input) >= minValue && parseFloat(input) <= maxValue;
    },
    limitMessage: `Must be betwwen ${minValue} and ${maxValue}`,
    defaultInput: defaultValue
  });
}

function readStringNonEmpty(message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return input.length > 0;
    },
    limitMessage: "Must be a valid string",
    defaultInput: defaultValue
  });
}

function readStringNonEmptyWithMaxBinarySize(maxBinarySize, message, defaultValue) {
  return readlineSync.question(message, {
    limit: function (input) {
      return input.length > 0 && Buffer.byteLength(input, 'utf8') < maxBinarySize
    },
    limitMessage: `Must be a valid string with binary size less than ${maxBinarySize}`,
    defaultInput: defaultValue
  });
}

function readDateInTheFuture(message, defaultValue) {
  const now = Math.floor(Date.now() / 1000);
  return readlineSync.question(message, {
    limit: function (input) {
      return parseInt(input) >= now;
    },
    limitMessage: `Must be a future date`,
    defaultInput: defaultValue
  });
}

module.exports = {
  readAddress,
  readMultipleAddresses,
  readPercentage,
  readNumberGreaterThan,
  readNumberGreaterThanOrEqual,
  readNumberLessThan,
  readNumberLessThanOrEqual,
  readNumberBetween,
  readStringNonEmpty,
  readStringNonEmptyWithMaxBinarySize,
  readDateInTheFuture
}