module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node --max-old-space-size=3072 ../node_modules/.bin/truffle test `find test/*.js ! -name a_poly_oracle.js -and ! -name s_v130_to_v140_upgrade.js` --network coverage',
    deepSkip: true,
    skipFiles: ['external', 'flat']
};