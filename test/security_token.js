import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';

const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyToken = artifacts.require('./PolyToken.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const TokenBurner = artifacts.require('./TokenBurner.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('SecurityToken', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;

    let balanceOfReceiver;
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let ID_snap;
    const message = "Transaction Should Fail!!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_CappedSTO;
    let I_PolyToken;
    let I_TokenBurner;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = 'FLAGS';
    const TM_Perm_Whitelist = 'WHITELIST';

    // Capped STO details
    let startTime;
    let endTime;
    const cap = new BigNumber(10000).times(new BigNumber(10).pow(18));
    const rate = 1000;
    const fundRaiseType = 0;
    const functionSignature = {
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_startTime'
        },{
            type: 'uint256',
            name: '_endTime'
        },{
            type: 'uint256',
            name: '_cap'
        },{
            type: 'uint256',
            name: '_rate'
        },{
            type: 'uint8',
            name: '_fundRaiseType',
        },{
            type: 'address',
            name: '_fundsReceiver'
        }
        ]
    };

    before(async() => {

        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_investor3 = accounts[7];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
        token_owner = account_issuer;

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the Polytoken Contract
        I_PolyToken = await PolyTokenFaucet.new();

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, { from: token_owner });

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: token_owner });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new({ from: account_polymath });

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 8: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolyToken.address,
            I_ModuleRegistry.address,
            I_TickerRegistry.address,
            I_STVersion.address,
            {
                from: account_polymath
            });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistry
        await I_TickerRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});
        await I_ModuleRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            CappedSTOFactory: ${I_CappedSTOFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:5000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
            LogAddModule.stopWatching();
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = await I_SecurityToken.modules(transferManagerKey, 0);
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

            assert.notEqual(
                I_GeneralTransferManager.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "GeneralTransferManager contract was not deployed",
            );

        });

        it("Should successfully attach the STO factory with the security token", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, true, { from: token_owner, gas: 50000000 });
            assert.equal(tx.logs[2].args._type, stoKey, "CappedSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "CappedSTO",
                "CappedSTOFactory module was not added"
            );
            I_CappedSTO = CappedSTO.at(tx.logs[2].args._module);
        });
    });

    describe("Module related functions", async() => {
        it("Should get the modules of the securityToken by index", async () => {
            let moduleData = await I_SecurityToken.getModule.call(stoKey, 0);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
            assert.isTrue(moduleData[2]);
        });

        it("Should get the modules of the securityToken by index (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModule.call(permissionManagerKey, 0);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "");
            assert.equal(moduleData[1], "0x0000000000000000000000000000000000000000");
            assert.isFalse(moduleData[2]);
        });

        it("Should get the modules of the securityToken by name", async () => {
            let moduleData = await I_SecurityToken.getModuleByName.call(stoKey, "CappedSTO");
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
            assert.isTrue(moduleData[2]);
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModuleByName.call(permissionManagerKey, "GeneralPermissionManager");
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "");
            assert.equal(moduleData[1], "0x0000000000000000000000000000000000000000");
            assert.isFalse(moduleData[2]);
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModuleByName.call(transferManagerKey, "CountTransferManager");
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "");
            assert.equal(moduleData[1], "0x0000000000000000000000000000000000000000");
            assert.isFalse(moduleData[2]);
        });

        it("Should fail in updating the token details", async() => {
            let errorThrown = false;
            try {
                let log = await I_SecurityToken.updateTokenDetails("new token details", {from: account_delegate});
            } catch (error) {
                console.log(`msg.sender should be the owner of the token`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should update the token details", async() => {
            let log = await I_SecurityToken.updateTokenDetails("new token details", {from: token_owner});
            assert.equal(web3.utils.toAscii(log.logs[0].args._newDetails).replace(/\u0000/g, ''),"new token details");
        });

        it("Should fails in removing the module from the securityToken", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken.removeModule(stoKey, 0, { from : token_owner });
            } catch (error) {
                console.log(`Test case passed by restricting the removal of non replacable module`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully remove the general transfer manager module from the securityToken -- fails msg.sender should be Owner", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.removeModule(transferManagerKey, 0, { from : account_temp });
            } catch (error) {
                console.log(`Test Case passed by restricting the unknown account to call removeModule of the securityToken`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully remove the general transfer manager module from the securityToken", async() => {
            let key = await takeSnapshot();
            let tx = await I_SecurityToken.removeModule(transferManagerKey, 0, { from : token_owner });
            assert.equal(tx.logs[0].args._type, transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            await revertToSnapshot(key);
        });

        it("Should verify the revertion of snapshot works properly", async() => {
            let moduleData = await I_SecurityToken.getModule.call(transferManagerKey, 0);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
            assert.isFalse(moduleData[2]);
        });

        it("Should change the budget of the module", async() => {
           let tx = await I_SecurityToken.changeModuleBudget(stoKey, 0, (100 * Math.pow(10, 18)),{ from : token_owner});
           assert.equal(tx.logs[1].args._moduleType, stoKey);
           assert.equal(tx.logs[1].args._module, I_CappedSTO.address);
           assert.equal(tx.logs[1].args._budget.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });
    });

    describe("General Transfer manager Related test cases", async () => {

            it("Should Buy the tokens", async() => {
                balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
                // Add the Investor in to the whitelist

                fromTime = latestTime();
                toTime = fromTime + duration.days(100);
                expiryTime = toTime + duration.days(100);

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    fromTime,
                    toTime,
                    expiryTime,
                    {
                        from: token_owner,
                        gas: 5000000
                    });
                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
                // Jump time
                await increaseTime(5000);
                // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

                assert.equal(
                    (await I_CappedSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1
                );

                assert.equal(await I_CappedSTO.getNumberInvestors.call(), 1);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );
            });

            it("Should Fail in transferring the token from one whitelist investor 1 to non whitelist investor 2", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.transfer(account_investor2, (10 *  Math.pow(10, 18)), { from : account_investor1});
                } catch(error) {
                    console.log(`Test case pass. Tx failed because investor 2 is not in the whitelist`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to provide the permission to the delegate to change the transfer bools", async () => {
                let errorThrown = false;
                // Add permission to the deletgate (A regesteration process)
                await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, false, {from: token_owner});
                let moduleData = await I_SecurityToken.modules(permissionManagerKey, 0);
                I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData[1]);
                try {
                    await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: account_temp });
                } catch (error) {
                    console.log(`${account_temp} doesn't have permissions to register the delegate`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should provide the permission to the delegate to change the transfer bools", async () => {
                // Add permission to the deletgate (A regesteration process)
                await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: token_owner});
                // Providing the permission to the delegate
                await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm, true, { from: token_owner });

                assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm));
            });


            it("Should fail to activate the bool allowAllTransfer", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_GeneralTransferManager.changeAllowAllTransfers(true, { from : account_temp });
                } catch (error) {
                    console.log(`${account_temp} doesn't have permissions to activate the bool allowAllTransfer`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should activate the bool allowAllTransfer", async() => {
                ID_snap = await takeSnapshot();
                let tx = await I_GeneralTransferManager.changeAllowAllTransfers(true, { from : account_delegate });

                assert.isTrue(tx.logs[0].args._allowAllTransfers, "AllowTransfer variable is not successfully updated");
            });


            it("Should fail to send tokens with the wrong granularity", async() => {
                let errorThrown = false;
                try {
                  await I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from : account_investor1});
                } catch (error) {
                    console.log('Failed due to incorrect token granularity - expected');
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should adjust granularity", async() => {
                let errorThrown = false;
                await I_SecurityToken.changeGranularity(Math.pow(10, 17), {from: token_owner });
                await I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from : account_investor1, gas: 2500000 });
                await I_SecurityToken.transfer(account_investor1, Math.pow(10, 17), { from : accounts[7], gas: 2500000});
            });

            it("Should transfer from whitelist investor to non-whitelist investor in first tx and in 2nd tx non-whitelist to non-whitelist transfer", async() => {
                await I_SecurityToken.transfer(accounts[7], (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});

                assert.equal(
                    (await I_SecurityToken.balanceOf(accounts[7]))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    10,
                    "Transfer doesn't take place properly"
                );

                await I_SecurityToken.transfer(account_temp, (5 *  Math.pow(10, 18)), { from : accounts[7], gas: 2500000});

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_temp))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    5,
                    "Transfer doesn't take place properly"
                );
                await revertToSnapshot(ID_snap);
            });

            it("Should bool allowAllTransfer value is false", async() => {
                assert.isFalse(await I_GeneralTransferManager.allowAllTransfers.call(), "reverting of snapshot doesn't works properly");
            });

            it("Should change the bool allowAllWhitelistTransfers to true", async () => {
                ID_snap = await takeSnapshot();
                let tx = await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, { from : account_delegate });

                assert.isTrue(tx.logs[0].args._allowAllWhitelistTransfers, "allowAllWhitelistTransfers variable is not successfully updated");
            });

            it("Should transfer from whitelist investor1 to whitelist investor 2", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

                await I_SecurityToken.transfer(account_investor2, (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});
                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    10,
                    "Transfer doesn't take place properly"
                );
            });

            it("Should transfer from whitelist investor1 to whitelist investor 2 -- value = 0", async() => {
                let tx = await I_SecurityToken.transfer(account_investor2, 0, { from : account_investor1, gas: 2500000});
                assert.equal((tx.logs[0].args.value).toNumber(),0);
            });

            it("Should transferFrom from one investor to other", async() => {
                await I_SecurityToken.approve(account_investor1, (2 *  Math.pow(10, 18)),{from: account_investor2});
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor3,
                    fromTime,
                    toTime,
                    expiryTime,
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");
                let log = await I_SecurityToken.transferFrom(account_investor2, account_investor3, (2 *  Math.pow(10, 18)), {from: account_investor1});
                assert.equal((log.logs[0].args.value).toNumber(), (2 *  Math.pow(10, 18)));
            });

            it("Should Fail in trasferring from whitelist investor1 to non-whitelist investor", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.transfer(account_temp, (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});
                } catch(error) {
                    console.log(`non-whitelist investor is not allowed`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
                await revertToSnapshot(ID_snap);
            });

            it("Should provide more permissions to the delegate", async() => {
                // Providing the permission to the delegate
                await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist, true, { from: token_owner });

                assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist));
            });

            it("Should add the investor in the whitelist by the delegate", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_temp,
                    fromTime,
                    toTime,
                    expiryTime,
                    {
                        from: account_delegate,
                        gas: 5000000
                    });

                assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");
            });

            it("should account_temp successfully buy the token", async() => {
                 // Fallback transaction
                 await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

                assert.equal(
                    (await I_CappedSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    2
                );

                assert.equal(await I_CappedSTO.getNumberInvestors.call(), 2);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );
            });

            it("Should remove investor from the whitelist by the delegate", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_temp,
                    0,
                    0,
                    0,
                    {
                        from: account_delegate,
                        gas: 5000000
                    });

                assert.equal(tx.logs[0].args._investor, account_temp, "Failed in removing the investor from whitelist");
            });

            it("should account_temp fail in buying the token", async() => {
                let errorThrown = false;
                try {
                    // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

                } catch (error) {
                    console.log(`non-whitelist investor is not allowed`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
           });

           it("Should freeze the transfers", async() => {
               let tx = await I_SecurityToken.freezeTransfers({from: token_owner});
                assert.isTrue(tx.logs[0].args._freeze);
           });

           it("Should fail in buying to tokens", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_temp,
                fromTime,
                toTime,
                expiryTime,
                {
                    from: account_delegate,
                    gas: 5000000
                });

            assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");

            let errorThrown = false;
            try {
                    // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

            } catch (error) {
                    console.log(`Because all transfers get freezed`);
                    errorThrown = true;
                    ensureException(error);
            }
            assert.ok(errorThrown, message);
           });

           it("Should fail in trasfering the tokens from one user to another", async() => {
               await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, {from : token_owner});
               console.log(await I_SecurityToken.balanceOf(account_investor1));
               let errorThrown = false;
               try {
                    await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), {from: account_temp});
               } catch(error) {
                   console.log('failed in trasfer because all transfers are at hold');
                   errorThrown = true;
                   ensureException(error);
               }
               assert.ok(errorThrown, message);
           });

           it("Should un freeze all the transfers", async() => {
                let tx = await I_SecurityToken.unfreezeTransfers({from: token_owner});
                assert.isFalse(tx.logs[0].args._freeze);
           });

           it("Should able to transfers the tokens from one user to another", async() => {
                console.log(await I_SecurityToken.balanceOf(account_investor1));
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), {from: account_temp});
           });

           it("Should fail to call the burn the tokens because token burner contract is not set", async() => {
                // Deploy the token burner contract
                I_TokenBurner = await TokenBurner.new(I_SecurityToken.address, { from: token_owner });

                let errorThrown = false;
                try {
                    await I_SecurityToken.burn(web3.utils.toWei('1', 'ether'),{ from: account_temp });
                } catch(error) {
                   console.log('failed in calling burn function because token burner contract is not set');
                   errorThrown = true;
                   ensureException(error);
               }
               assert.ok(errorThrown, message);
           });

           it("Should burn the tokens", async ()=> {
                // Deploy the token burner contract
                I_TokenBurner = await TokenBurner.new(I_SecurityToken.address, { from: token_owner });

                await I_SecurityToken.setTokenBurner(I_TokenBurner.address, { from: token_owner });
                assert.equal(await I_SecurityToken.tokenBurner.call(), I_TokenBurner.address);

                let tx = await I_SecurityToken.burn(web3.utils.toWei('1', 'ether'),{ from: account_temp });
                assert.equal(tx.logs[0].args._value, web3.utils.toWei('1', 'ether'));
           });
    });

  });
