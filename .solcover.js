module.exports = {
    norpc: true,
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    testCommand: 'node --max-old-space-size=3500 ../node_modules/.bin/truffle test `find test/*.js ! -name a_poly_oracle.js -and ! -name s_poly_capped_sto.js -and ! -name q_usd_tiered_sto_sim.js -and ! -name z_general_permission_manager_fuzzer.js` --network coverage',
    deepSkip: true,
    skipFiles: ['external', 'flat', 'helpers', 'mocks', 'oracles', 'libraries/KindMath.sol', 'libraries/BokkyPooBahsDateTimeLibrary.sol', 'storage', 'modules/Experimental'],
    forceParse: ['mocks', 'oracles', 'helpers', 'modules/Experimental']
};
