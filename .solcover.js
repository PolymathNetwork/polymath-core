module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node ../node_modules/.bin/truffle test --network coverage',
    deepSkip: true,
    skipFiles: ['external', 'flat']
};
