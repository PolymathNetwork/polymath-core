module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node --max-old-space-size=3500 ../node_modules/.bin/truffle test test/w_lockup_transfer_manager.js --network coverage',
    skipFiles: ['external', 'flat', 'helpers', 'mocks', 'oracles', 'libraries/KindMath.sol', 'libraries/BokkyPooBahsDateTimeLibrary.sol', 'storage', 'modules/Experimental'],
};
