module.exports = {
    //testrpcOptions: '--port 8545 -l 5000000',
    port: 8545,
    copyPackages: ['openzeppelin-solidity'],
    skipFiles: ['tokens/STVersionProxy001.sol',
                'tokens/STVersionProxy002.sol',
                'tokens/SecurityTokenV2.sol',
                'interfaces/IModule.sol',
                'interfaces/IModuleFactory.sol',
                'interfaces/IModuleRegistry.sol',
                'interfaces/ISecurityToken.sol',
                'interfaces/ISecurityTokenRegistrar.sol',
                'interfaces/IST20.sol',
                'interfaces/ISTProxy.sol',
                'interfaces/ITickerRegistry.sol',
                'helpers/Util.sol',
                'helpers/TokenBurner.sol',
                'Migrations.sol']
};