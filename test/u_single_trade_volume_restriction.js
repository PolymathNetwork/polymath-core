import latestTime from './helpers/latestTime';
import {
    duration,
    ensureException,
    promisifyLogWatch,
    latestBlock
} from './helpers/utils';
import takeSnapshot, {
    increaseTime,
    revertToSnapshot
} from './helpers/time';
import {
    encodeProxyCall
} from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const SingleTradeVolumeRestrictionManagerFactory = artifacts.require('./SingleTradeVolumeRestrictionManagerFactory.sol');
const SingleTradeVolumeRestrictionManager = artifacts.require('./SingleTradeVolumeRestrictionManager');
const CountTransferManagerFactory = artifacts.require('./CountTransferManagerFactory.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('SingleTradeVolumeRestrictionManager', accounts => {



    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_SingleTradeVolumeRestrictionManagerFactory;
    let I_SingleTradeVolumeRestrictionManager;
    let P_SingleTradeVolumeRestrictionManagerFactory;
    let P_SingleTradeVolumeRestrictionManager;
    let I_SingleTradeVolumeRestrictionPercentageManager;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[5];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({
            from: account_polymath
        });

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {
            from: account_polymath
        })

        // STEP 2: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {
            from: account_polymath
        });
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {
            from: account_polymath
        });

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {
            from: account_polymath
        });

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactoryFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {
            from: account_polymath
        });

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the SingleTradeVolumeRestrictionManagerFactory
        I_SingleTradeVolumeRestrictionManagerFactory = await SingleTradeVolumeRestrictionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {
            from: account_polymath
        });

        assert.notEqual(
            I_SingleTradeVolumeRestrictionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SingleTradeVolumeRestrictionManagerFactory contract was not deployed"
        );


        P_SingleTradeVolumeRestrictionManagerFactory = await SingleTradeVolumeRestrictionManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {
            from: account_polymath
        });
        assert.notEqual(
            P_SingleTradeVolumeRestrictionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SingleTradeVolumeRestrictionManagerFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, {
            from: account_polymath
        });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, {
            from: account_polymath
        });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, {
            from: account_polymath
        });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, {
            from: account_polymath
        });

        // (C) : Register SingleTradeVolumeRestrictionManagerFactory
        await I_ModuleRegistry.registerModule(I_SingleTradeVolumeRestrictionManagerFactory.address, {
            from: account_polymath
        });
        await I_ModuleRegistry.verifyModule(I_SingleTradeVolumeRestrictionManagerFactory.address, true, {
            from: account_polymath
        });

        await I_ModuleRegistry.registerModule(P_SingleTradeVolumeRestrictionManagerFactory.address, {
            from: account_polymath
        });
        await I_ModuleRegistry.verifyModule(P_SingleTradeVolumeRestrictionManagerFactory.address, true, {
            from: account_polymath
        });

        // Step 7: Deploy the STFactory contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({
            from: account_polymath
        });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({
            from: account_polymath
        });
        let bytesProxy = encodeProxyCall([I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {
            from: account_polymath
        });
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
        // Step 10: Deploy the FeatureRegistry

        I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address, {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {
            from: account_polymath
        });

        assert.notEqual(
            I_FeatureRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FeatureRegistry contract was not deployed",
        );

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_STRProxied.address, {
            from: account_polymath
        });
        await I_ModuleRegistry.updateFromRegistry({
            from: account_polymath
        });
    })

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, {
                from: token_owner
            });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, {
                from: token_owner
            });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, {
                from: token_owner,
                gas: 60000000
            });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({
                from: _blockNo
            }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = await I_SecurityToken.modules(2, 0);
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

            assert.notEqual(
                I_GeneralTransferManager.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "GeneralTransferManager contract was not deployed",
            );

        });
    });
    //
    describe("Buy tokens using whitelist & manual approvals", async () => {

        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true, {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('100', 'ether'), {
                from: token_owner
            });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('100', 'ether')
            );
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true, {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('1', 'ether'), {
                from: token_owner
            });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });
        //
        it("Fails to attach the SingleTradeVolumeRestrictionManager with the security token due to fees not paid", async () => {
            let managerArgs = web3.eth.abi.encodeFunctionCall({
                name: 'configure',
                type: 'function',
                inputs: [{
                        type: 'bool',
                        name: '_isTransferLimitInPercentage'
                    },
                    {
                        type: 'uint256',
                        name: '_globalTransferLimitInPercentageOrToken'
                    }
                ]
            }, [true, 90])
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                });
            } catch (error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });



        it("Should successfully attach the Paid SingleTradeVolumeRestrictionManager with the security token", async () => {
            let managerArgs = web3.eth.abi.encodeFunctionCall({
                name: 'configure',
                type: 'function',
                inputs: [{
                        type: 'bool',
                        name: '_isTransferLimitInPercentage'
                    },
                    {
                        type: 'uint256',
                        name: '_globalTransferLimitInPercentageOrToken'
                    }
                ]
            }, [false, 90]);
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {
                from: token_owner
            });
            let tx = await I_SecurityToken.addModule(P_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, web3.utils.toWei("500", "ether"), 0, {
                from: token_owner
            });
            assert.equal(tx.logs[3].args._type.toNumber(), transferManagerKey, "SingleTradeVolumeRestrictionManager did not get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "SingleTradeVolumeRestriction",
                "SingleTradeVolumeRestrictionManagerFactory module was not added"
            );
            P_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx.logs[3].args._module);
        });

        it("Should successfully attach the SingleTradeVolumeRestrictionManager with the security token", async () => {
            let managerArgs = web3.eth.abi.encodeFunctionCall({
                name: 'configure',
                type: 'function',
                inputs: [{
                        type: 'bool',
                        name: '_isTransferLimitInPercentage'
                    },
                    {
                        type: 'uint256',
                        name: '_globalTransferLimitInPercentageOrToken'
                    }
                ]
            }, [false, 7 * 10 ** 16])
            const tx = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, {
                from: token_owner
            });
            assert.equal(tx.logs[2].args._type.toNumber(), transferManagerKey, "PercentageTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "SingleTradeVolumeRestriction",
                "SingleTradeVolumeRestriction module was not added"
            );
            I_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the SingleTradeVolumeRestrictionManager (Percentage) with the security token", async () => {
            let managerArgs = web3.eth.abi.encodeFunctionCall({
                name: 'configure',
                type: 'function',
                inputs: [{
                        type: 'bool',
                        name: '_isTransferLimitInPercentage'
                    },
                    {
                        type: 'uint256',
                        name: '_globalTransferLimitInPercentageOrToken'
                    }
                ]
            }, [true, 90]);
            const tx = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, {
                from: token_owner
            });
            assert.equal(tx.logs[2].args._type.toNumber(), transferManagerKey, "PercentageTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "SingleTradeVolumeRestriction",
                "SingleTradeVolumeRestriction module was not added"
            );
            I_SingleTradeVolumeRestrictionPercentageManager = SingleTradeVolumeRestrictionManager.at(tx.logs[2].args._module);
        });

        it('should return get permissions', async () => {
            let permissions = await I_SingleTradeVolumeRestrictionPercentageManager.getPermissions();
            assert.equal(permissions.length, 1, "Invalid Permissions");
            assert.equal(
                web3.utils.toAscii(permissions[0]).replace(/\u0000/g, ''),
                "ADMIN",
                'Wrong permissions'
            );
        });

        it('add exempt wallet', async () => {
            let errorThrown = false;
            try {
                let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5]);
            } catch (e) {
                errorThrown = true;
            }
            assert.ok(errorThrown, "Non Admins cannot add exempt wallets");


            let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet added as exempt");
        });

        it('should remove an exempt wallet', async () => {
            let errorThrown = false;
            try {
                let tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5]);
            } catch (e) {
                errorThrown = true;
            }
            assert.ok(errorThrown, "Non Admins cannot add exempt wallets");


            let tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5], {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet removed from exempt");
        });

        it('should set transfer limit for a wallet', async () => {
            let errorThrown = false;
            try {
                let tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitForWallet(accounts[4], 100);
            } catch (e) {
                errorThrown = true;
            }
            assert.ok(errorThrown, "Non Admins cannot set transfer limits");

            let tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitForWallet(accounts[4], 100, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._wallet, accounts[4]);
            assert.equal(tx.logs[0].args._amount, 100);

            tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 50, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet added to transfer limits");
            assert.equal(tx.logs[0].args._percentage, 50, "Wrong percentage set");
        });

        it('should remove transfer limit for wallet', async () => {
            let errorThrown = false;
            try {
                let tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitForWallet(accounts[4]);
            } catch (e) {
                errorThrown = true;
            }
            assert.ok(errorThrown, "Non Admins cannot set/remove transfer limits");
            let tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitForWallet(accounts[4], {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet removed");
        });

        it("Should pause the tranfers at Manager level", async () => {
            let tx = await I_SingleTradeVolumeRestrictionManager.pause({
                from: token_owner
            });
        });

        it('should be able to set a global transfer limit', async () => {
            let errorThrown = false;
            try {
                let tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(100 * 10 ** 18);
            } catch (e) {
                errorThrown = true;
            }
            assert.ok(errorThrown, true);


            let tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._amount, 10, "Global Limit not set");

            errorThrown = false;

            try {
                let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(89);
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Global limit can be set by non-admins");
            tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(40, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._percentage, 40, "Global Limit not set");

            errorThrown = false;
            try {
                await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(101 * 10 ** 16, {
                    from: token_owner
                });
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Global limit cannot be set to more than 100");

            errorThrown = false;
            try {
                await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInPercentage(10, {
                    from: token_owner
                });
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Global limit in percentage cannot be set when limit is in tokens");
            errorThrown = false;
            try {
                await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(10, {
                    from: token_owner
                });
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Global limit in tokens cannot be set when limit is in percentage");
        });

        it('should perform batch updates', async () => {
            let wallets = [accounts[0], accounts[1], accounts[2]];
            let tokenLimits = [1, 2, 3];
            let percentageLimits = [5, 6, 7];

            // add exempt wallet multi
            let tx = await P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, {
                from: token_owner
            });
            let logs = tx.logs.filter(log => log.event === 'ExemptWalletAdded');
            assert.equal(logs.length, wallets.length, "Batch Exempt wallets not added");
            for (let i = 0; i < logs.length; i++) {
                assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
            }

            // remove exempt wallet multi
            tx = await P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, {
                from: token_owner
            })
            logs = tx.logs.filter(log => log.event === 'ExemptWalletRemoved');
            assert.equal(logs.length, wallets.length, "Batch Exempt wallets not removed");

            for (let i = 0; i < logs.length; i++) {
                assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
            }

            tx = await P_SingleTradeVolumeRestrictionManager.setTransferLimitForWalletMulti(wallets, tokenLimits, {
                from: token_owner
            });
            logs = tx.logs.filter(log => log.event == 'TransferLimitInTokensSet');
            assert.equal(wallets.length, logs.length, "Transfer limit not set");
            for (let i = 0; i < wallets.length; i++) {
                assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not set for wallet");
                assert.equal(logs[i].args._amount.toNumber(), tokenLimits[i]);
            }

            tx = await P_SingleTradeVolumeRestrictionManager.removeTransferLimitForWalletMulti(wallets, { from:token_owner });
            logs = tx.logs.filter(log => log.event === 'TransferLimitRemoved');
            assert.equal(logs.length, wallets.length, "Transfer limit not removed");
            for (let i = 0; i < wallets.length; i++) {
                assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not removed for wallet");
            }

            tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, {from:token_owner});
            logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageSet');
            assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

            for (let i = 0; i< wallets.length; i++) {
                assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
                assert.equal(logs[i].args._percentage.toNumber(), percentageLimits[i]);
            }
        })

        it('should be able to transfer tokens SingleTradeVolumeRestriction', async () => {
            await I_SingleTradeVolumeRestrictionManager.unpause({
                from: token_owner
            })
            await I_SingleTradeVolumeRestrictionPercentageManager.pause({
                from: token_owner
            })
            await P_SingleTradeVolumeRestrictionManager.pause({
                from: token_owner
            });

            await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true, {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            await I_GeneralTransferManager.modifyWhitelist(
                account_investor4,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true, {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            await I_GeneralTransferManager.modifyWhitelist(
                account_investor5,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true, {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            //setting a max of 5 tokens
            await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(web3.utils.toWei('5', 'ether'), {
                from: token_owner
            })
            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('6', 'ether'), {
                    from: account_investor1
                });
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Transfer should have not happened");
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('4', 'ether'), {
                from: account_investor1
            });
            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei('4', 'ether'));

            // exempt wallet
            await I_SingleTradeVolumeRestrictionManager.addExemptWallet(account_investor1, {
                from: token_owner
            });
            await I_SecurityToken.transfer(account_investor5, web3.utils.toWei('7', 'ether'), {
                from: account_investor1
            });
            assert.equal((await I_SecurityToken.balanceOf(account_investor5)).toNumber(), web3.utils.toWei('7', 'ether'));

            //special limits wallet
            await I_SingleTradeVolumeRestrictionManager.setTransferLimitForWallet(account_investor5, web3.utils.toWei('5', 'ether'), {
                from: token_owner
            });
            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor4, web3.utils.toWei('7', 'ether'), {
                    from: account_investor5
                });
            } catch (e) {
                errorThrown = true;
                ensureException(e);
            }
            assert.ok(errorThrown, true, "Transfer should have not happened");
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei('4', 'ether'), {
                from: account_investor5
            })
            assert.equal((await I_SecurityToken.balanceOf(account_investor4)).toNumber(), web3.utils.toWei('4', 'ether'))
        })

        it('should be able to transfer tokens (percentage transfer limit)', async () => {
            await I_SingleTradeVolumeRestrictionManager.pause({
                from: token_owner
            });
            let balance = (await I_SecurityToken.balanceOf(account_investor2)).toNumber();
            await I_SecurityToken.transfer(account_investor1, balance, {
                from: account_investor2
            });


            balance = (await I_SecurityToken.balanceOf(account_investor3)).toNumber();

            await I_SecurityToken.transfer(account_investor1, balance, {
                from: account_investor3
            });


            balance = (await I_SecurityToken.balanceOf(account_investor4)).toNumber();
            await I_SecurityToken.transfer(account_investor1, balance, {
                from: account_investor4
            });

            balance = (await I_SecurityToken.balanceOf(account_investor5)).toNumber();
            await I_SecurityToken.transfer(account_investor1, balance, {
                from: account_investor5
            });

            await I_SingleTradeVolumeRestrictionPercentageManager.unpause({
                from: token_owner
            });
            // //
            await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(49 * 10 ** 16, {
                from: token_owner
            });

            let errorThrown = false;
            try {
                // more than the limit
                await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('90', 'ether'), {
                    from: account_investor1
                });
            } catch (e) {
                ensureException(e);
                errorThrown = true;
            }
            assert.ok(errorThrown, true, "Transfer above limit happened");


            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('20', 'ether'), {
                from: account_investor1
            });
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei('20', 'ether'))

            await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(account_investor1, 5 * 10 ** 16, {
                from: token_owner
            });
            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('35', 'ether'), {
                    from: account_investor1
                });
            } catch (e) {
                ensureException(e);
                errorThrown = true;
            }
            assert.ok(errorThrown, true, "transfer happened above limit");

            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), {
                from: account_investor1
            });
            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei('1', 'ether'));
        });



    });

    describe("SingleTradeVolumeRestrictionManager Factory test cases", async () => {

        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_SingleTradeVolumeRestrictionManagerFactory.setupCost.call(), 0);
            assert.equal(await I_SingleTradeVolumeRestrictionManagerFactory.getType.call(), 2);
            let name = web3.utils.toUtf8(await I_SingleTradeVolumeRestrictionManagerFactory.getName.call());
            assert.equal(name, "SingleTradeVolumeRestriction", "Wrong Module added");
            let desc = await I_SingleTradeVolumeRestrictionManagerFactory.getDescription.call();
            assert.equal(desc, "Imposes volume restriction on a single trade", "Wrong Module added");
            let title = await I_SingleTradeVolumeRestrictionManagerFactory.getTitle.call();
            assert.equal(title, "Single Trade Volume Restriction Manager", "Wrong Module added");
            let inst = await I_SingleTradeVolumeRestrictionManagerFactory.getInstructions.call();
            assert.equal(inst, "Allows an issuer to impose volume restriction on a single trade. Init function takes two parameters. First parameter is a bool indicating if restriction is in percentage. The second parameter is the value in percentage or amount of tokens", "Wrong Module added");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_SingleTradeVolumeRestrictionManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "Single Trade");
            assert.equal(web3.utils.toUtf8(tags[1]), "Transfer");
            assert.equal(web3.utils.toUtf8(tags[2]), "Volume");
        });


    });
});
