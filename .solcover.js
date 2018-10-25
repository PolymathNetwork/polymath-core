module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node ../node_modules/.bin/truffle test `find test/*.js ! -name a_poly_oracle.js -and ! -name s_v130_to_v140_upgrade.js` --network coverage',
    deepSkip: true,
    skipFiles: ['external', 'flat', 'helpers', 'mocks', 'oracles', 'libraries/KindMath.sol', 'storage', 'modules/Experimental'],
    forceParse: ['mocks', 'oracles']
};
