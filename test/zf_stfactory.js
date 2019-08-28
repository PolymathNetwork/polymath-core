import Web3 from 'web3';
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork } from "./helpers/createInstances";
import { zero_address } from "./helpers/constants";

const BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const PolymathRegistry = artifacts.require("./PolymathRegistry.sol");
const SecurityTokenLogic = artifacts.require("./SecurityToken.sol");
const ISecurityToken = artifacts.require("./ISecurityToken.sol");
const STFactory = artifacts.require("./STFactory.sol");
const STGetter = artifacts.require("./STGetter.sol");
const DataStoreLogic = artifacts.require('./DataStore.sol');
const DataStoreFactory = artifacts.require('./DataStoreFactory.sol');
const GeneralTransferManager = artifacts.require("./GeneralTransferManager.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");

const transferManagerKey = 2;

let I_PolymathRegistry;
let I_STGetter;
let I_SecurityToken;
let I_DataStoreLogic;
let I_DataStoreFactory;
let I_GeneralTransferManagerLogic;
let I_GeneralTransferManagerFactory;
let I_STFactory;

let I_GeneralPermissionManagerFactory;
let I_LockUpTransferManagerFactory;
let I_LockUpTransferManager;
let I_SecurityTokenRegistryProxy;
let I_GeneralPermissionManager;
let I_GeneralTransferManager;
let I_ModuleRegistryProxy;
let I_ModuleRegistry;
let I_FeatureRegistry;
let I_SecurityTokenRegistry;
let I_CappedSTOFactory;
let I_SecurityToken2;
let I_STRProxied;
let I_MRProxied;
let I_CappedSTO;
let I_PolyToken;
let I_MockRedemptionManagerFactory;
let I_MockRedemptionManager;
let I_STRGetter;
let I_STGetter2;
let stGetter;

let tokenInitBytesCall;
let tokenUpgradeBytesCall;
let account_polymath;
let account_issuer;
let account_nonissuer;

contract("STFactory", async (accounts) => {
    account_polymath = accounts[0];
    account_issuer = accounts[1];
    account_nonissuer = accounts[2];

    // Populate test dependencies.
    before(async () => {
        I_PolymathRegistry = await PolymathRegistry.new({ from: account_polymath });
        I_STGetter = await STGetter.new({ from: account_polymath });
        I_SecurityToken = await SecurityTokenLogic.new({ from: account_polymath });
        I_DataStoreLogic = await DataStoreLogic.new({ from: account_polymath });
        I_DataStoreFactory = await DataStoreFactory.new(I_DataStoreLogic.address, { from: account_polymath });
        I_GeneralTransferManagerLogic = await GeneralTransferManager.new(zero_address, zero_address, { from: account_polymath });
        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(new BN(0), I_GeneralTransferManagerLogic.address, I_PolymathRegistry.address, true, {
            from: account_polymath
        });
        const tokenInitBytes = {
            name: "initialize",
            type: "function",
            inputs: [
                {
                    type: "address",
                    name: "_getterDelegate"
                }
            ]
        };
        tokenInitBytesCall = web3.eth.abi.encodeFunctionCall(tokenInitBytes, [I_STGetter.address]);

        const tokenUpgradeBytes = {
            name: "upgrade",
            type: "function",
            inputs: [
                {
                    type: "address",
                    name: "_getterDelegate"
                },
                {
                    type: "uint256",
                    name: "_upgrade"
                }
            ]
        };
        tokenUpgradeBytesCall = web3.eth.abi.encodeFunctionCall(tokenUpgradeBytes, [I_STGetter.address, 12]);
    });

    describe('Contructor params', async () => {
        it('Should be deployed successfully', async () => {
            I_STFactory = await STFactory.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address, "3.0.0",
                I_SecurityToken.address,
                tokenInitBytesCall,
                { from: account_polymath }
            );
            assert.notEqual(I_STFactory.address.valueOf(), zero_address, "STFactory contract was not deployed");
        });

        it('Should NOT be deployed without the ST logic contract', async () => {
            await catchRevert(STFactory.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address, "3.0.0",
                zero_address,
                tokenInitBytesCall,
                { from: account_polymath }),
                "Invalid Address"
            )
        });

        it('Should NOT be deployed without the GTM factory', async () => {
            await catchRevert(STFactory.new(
                I_PolymathRegistry.address,
                zero_address,
                I_DataStoreFactory.address, "3.0.0",
                I_SecurityToken.address,
                tokenInitBytesCall,
                { from: account_polymath }),
                "Invalid Address"
            )
        });

        it('Should NOT be deployed without the data store factory', async () => {
            await catchRevert(STFactory.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                zero_address, "3.0.0",
                I_SecurityToken.address,
                tokenInitBytesCall,
                { from: account_polymath }),
                "Invalid Address"
            )
        });

        it('Should NOT be deployed without the polymath registry address', async () => {
            await catchRevert(STFactory.new(
                zero_address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address, "3.0.0",
                I_SecurityToken.address,
                tokenInitBytesCall,
                { from: account_polymath }),
                "Invalid Address"
            )
        });

        it('Should NOT be deployed without a version', async () => {
            await catchRevert(STFactory.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address, "",
                I_SecurityToken.address,
                tokenInitBytesCall,
                { from: account_polymath }),
                "Empty version"
            )
        });

        it('Should NOT be deployed with invalid initialization data', async () => {
            await catchRevert(STFactory.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address, "3.0.0",
                I_SecurityToken.address,
                web3.utils.toHex(""),
                { from: account_polymath }),
                "Invalid Initialization"
            );
        });
    });

    describe('Deploying tokens', async () => {
        before(async () => {
            // Step:1 Create the polymath ecosystem contract instances
            let instances = await setUpPolymathNetwork(account_polymath, account_issuer);
            [
                I_PolymathRegistry,
                I_PolyToken,
                I_FeatureRegistry,
                I_ModuleRegistry,
                I_ModuleRegistryProxy,
                I_MRProxied,
                I_GeneralTransferManagerFactory,
                I_STFactory,
                I_SecurityTokenRegistry,
                I_SecurityTokenRegistryProxy,
                I_STRProxied,
                I_STRGetter,
                I_STGetter
            ] = instances;

            console.log(`
            --------------------- Polymath Network Smart Contracts: ---------------------
            PolymathRegistry:                  ${I_PolymathRegistry.address}
            SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
            SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
            ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
            ModuleRegistry:                    ${I_ModuleRegistry.address}
            FeatureRegistry:                   ${I_FeatureRegistry.address}
    
            STFactory:                         ${I_STFactory.address}
            GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
            -----------------------------------------------------------------------------
            `);
        });

        it('Should deploy tokens successfully', async () => {
            const tx = await I_STFactory.deployToken(
                "test",
                "TEST",
                18,
                "",
                account_issuer,
                false,
                I_PolymathRegistry.address,
                { from: account_issuer }
            );
            const address = tx.logs[0].address;

            assert.notEqual(typeof address, undefined, "Security Token contract was not deployed");
            assert.notEqual(address, zero_address, "Security Token contract was not deployed");
        });

        it('Should NOT deploy tokens without default dataStore factory', async () => {
            let snapId = await takeSnapshot();

            const dataStoreFactory_orig = await I_STFactory.dataStoreFactory();
            await I_STFactory.updateDefaultDataStore(zero_address, { from: account_polymath });
            const dataStoreFactory_new = await I_STFactory.dataStoreFactory();
            assert.equal(dataStoreFactory_new, zero_address);
            assert.notEqual(dataStoreFactory_new, dataStoreFactory_orig);

            await catchRevert(I_STFactory.deployToken(
                "test2",
                "TEST2",
                18,
                "",
                account_issuer,
                false,
                account_issuer,
                { from: account_issuer }
            ));

            await revertToSnapshot(snapId);
        });

        it('Should deploy tokens even without default TM factory', async () => {
            let snapId = await takeSnapshot();

            const transferManagerFactoryOrig = await I_STFactory.transferManagerFactory();
            await I_STFactory.updateDefaultTransferManager(zero_address, { from: account_polymath });

            assert.equal(await I_STFactory.transferManagerFactory(), zero_address);
            assert.notEqual(await I_STFactory.transferManagerFactory(), transferManagerFactoryOrig);

            const tx = await I_STFactory.deployToken(
                "test2",
                "TEST2",
                18,
                "",
                account_issuer,
                false,
                I_PolymathRegistry.address,
                { from: account_issuer }
            );

            const address = tx.logs[0].address;
            let token = await ISecurityToken.at(address);
            const attachedTMs = await token.getModulesByType(transferManagerKey)
            assert.equal(attachedTMs.length, 0, 'Default GTM is present');
            await revertToSnapshot(snapId);
        });

        describe('setLogicContract', async () => {
            let I_SecurityToken_alt;
            let I_STFactory_alt;

            before(async () => {
                I_SecurityToken_alt = await SecurityTokenLogic.new({ from: account_polymath });
                I_STFactory_alt = await STFactory.new(
                    I_PolymathRegistry.address,
                    I_GeneralTransferManagerFactory.address,
                    I_DataStoreFactory.address, "3.0.0",
                    I_SecurityToken.address,
                    tokenInitBytesCall,
                    { from: account_polymath }
                );
            });

            it('Should fail to set the current logic contract one more time.', async () => {
                await catchRevert(I_STFactory_alt.setLogicContract('4.0.0', I_SecurityToken.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Same logic contract");
            });

            it('Should fail to set a logic contract for current version.', async () => {
                await catchRevert(I_STFactory_alt.setLogicContract('3.0.0', I_SecurityToken_alt.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Same version");
            });

            it('Should fail to set an invalid address.', async () => {
                await catchRevert(I_STFactory_alt.setLogicContract('4.0.0', zero_address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid address");
            });

            it('Should fail to set a logic contract without proper initialization callback', async () => {
                await catchRevert(I_STFactory_alt.setLogicContract('4.0.0', I_SecurityToken_alt.address, web3.utils.toHex(""), tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid Initialization");
            });

            it('Should fail to set a logic contract without proper upgrade data', async () => {
                await catchRevert(I_STFactory_alt.setLogicContract('4.0.0', I_SecurityToken_alt.address, tokenInitBytesCall, web3.utils.toHex(""), { from: account_polymath }),
                    "Invalid Upgrade");
            });

            it('Should set new logic contract, provided all params are valid', async () => {
                const I_SecurityToken_alt2 = await SecurityTokenLogic.new({ from: account_polymath });
                await I_STFactory_alt.setLogicContract('4.0.0', I_SecurityToken_alt2.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath });
            });
        });

        describe('updateLogicContract', async () => {
            let I_SecurityToken_alt;
            let I_STFactory_alt;

            before(async () => {
                I_SecurityToken_alt = await SecurityTokenLogic.new({ from: account_polymath });
                I_STFactory_alt = await STFactory.new(
                    I_PolymathRegistry.address,
                    I_GeneralTransferManagerFactory.address,
                    I_DataStoreFactory.address, "3.0.0",
                    I_SecurityToken.address,
                    tokenInitBytesCall,
                    { from: account_polymath }
                );
            });

            it('Should fail to update the current logic contract to version 0.', async () => {
                await catchRevert(I_STFactory_alt.updateLogicContract(0, '4.0.0', I_SecurityToken.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid upgrade");
            });

            it('Should fail to update the current logic contract to a version greater than latestUpgrade version.', async () => {
                await catchRevert(I_STFactory_alt.updateLogicContract(2, '4.0.0', I_SecurityToken.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid upgrade");
            });

            it('Should fail to update an invalid address.', async () => {
                await catchRevert(I_STFactory_alt.updateLogicContract(1, '4.0.0', zero_address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid address");
            });

            it('Should fail to update a logic contract without proper initialization callback', async () => {
                await catchRevert(I_STFactory_alt.updateLogicContract(1, '4.0.0', I_SecurityToken_alt.address, web3.utils.toHex(""), tokenUpgradeBytesCall, { from: account_polymath }),
                    "Invalid Initialization");
            });

            it('Should fail to update a logic contract without proper upgrade data', async () => {
                await catchRevert(I_STFactory_alt.updateLogicContract(1, '4.0.0', I_SecurityToken_alt.address, tokenInitBytesCall, web3.utils.toHex(""), { from: account_polymath }),
                    "Invalid Upgrade");
            });

            it('Should update new logic contract, if all params are valid', async () => {
                const I_SecurityToken_alt2 = await SecurityTokenLogic.new({ from: account_polymath });
                await I_STFactory_alt.updateLogicContract(1, '4.0.0', I_SecurityToken_alt2.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath });
            });

            describe('setLogicContract, then updateLogicContract', async () => {
                let I_SecurityToken_alt2;
                let I_STFactory_alt2;
                let I_SecurityToken_alt3;

                before(async () => {
                    I_SecurityToken_alt2 = await SecurityTokenLogic.new({ from: account_polymath });
                    I_STFactory_alt2 = await STFactory.new(
                        I_PolymathRegistry.address,
                        I_GeneralTransferManagerFactory.address,
                        I_DataStoreFactory.address, "3.0.0",
                        I_SecurityToken.address,
                        tokenInitBytesCall,
                        { from: account_polymath }
                    );

                    await I_STFactory_alt2.setLogicContract('4.0.0', I_SecurityToken_alt2.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath });
                    I_SecurityToken_alt3 = await SecurityTokenLogic.new({ from: account_polymath });
                });

                it('Should fail to update using the intial logic contract.', async () => {
                    const latestUpgrade = await I_STFactory_alt2.latestUpgrade();
                    assert.equal(latestUpgrade.toNumber(), 2, 'setLogicContract has failed to increment latestUpgrade');

                    await catchRevert(I_STFactory_alt2.updateLogicContract(2, '5.0.0', I_SecurityToken.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                        "Same logic contract");
                });

                it('Should fail to update a logic contract for current version.', async () => {
                    await catchRevert(I_STFactory_alt2.updateLogicContract(2, '3.0.0', I_SecurityToken_alt3.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath }),
                        "Same version");
                });

                it('Otherwise, updating logic contract should succeed', async () => {
                    await I_STFactory_alt2.updateLogicContract(2, '5.0.0', I_SecurityToken_alt3.address, tokenInitBytesCall, tokenUpgradeBytesCall, { from: account_polymath })
                });
            });
        });
    });
});
