module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node ../node_modules/.bin/truffle test `find test/*.js ! -name a_poly_oracle.js` --network coverage',
    deepSkip: true,
    skipFiles: ['external', 'flat']
};