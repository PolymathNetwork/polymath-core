module.exports = {
    norpc: true,
    port: 8545,
    testCommand: 'node ../node_modules/.bin/truffle test `ls test/*.js`  --network coverage',
    copyPackages: ['openzeppelin-solidity'],
    deepSkip: true,
    skipFiles: ['external']
};