import latestTime from './helpers/latestTime';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall } from './helpers/encodeCall';
import { setUpPolymathNetwork, deployLockUpTMAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const LockUpTransferManager = artifacts.require('./LockUpTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require('web3');
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('LockUpTransferManager', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let P_LockUpTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_LockUpTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_LockUpTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_LockUpTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_SecurityToken_div;
    let I_GeneralTransferManager_div;
    let I_LockUpVolumeRestrictionTM_div;
    let I_STGetter;
    let stGetter;
    let stGetter_div;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const address_zero = "0x0000000000000000000000000000000000000000";

    const name2 = "Core";
    const symbol2 = "Core";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    let temp;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));
    let currentTime;

    before(async() => {
        currentTime = new BN(await latestTime());
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];

        let instances = await setUpPolymathNetwork(account_polymath, token_owner);

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
            I_STGetter
        ] = instances;

        // STEP 4(c): Deploy the LockUpVolumeRestrictionTMFactory
        [I_LockUpTransferManagerFactory] = await deployLockUpTMAndVerified(account_polymath, I_MRProxied, 0);
        // STEP 4(d): Deploy the LockUpVolumeRestrictionTMFactory
        [P_LockUpTransferManagerFactory] = await deployLockUpTMAndVerified(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}

        LockupVolumeRestrictionTransferManagerFactory:
                                           ${I_LockUpTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should initialize the auto attached modules", async () => {
          let moduleData = (await stGetter.getModulesByType(2))[0];
          I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
        it("Should register another ticker before the generation of new security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol2, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol2.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateNewSecurityToken(name2, symbol2, tokenDetails, true, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol2.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken_div = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter_div = await STGetter.at(I_SecurityToken_div.address);
            assert.equal(await stGetter_div.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken_div.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should initialize the auto attached modules", async () => {
          let moduleData = (await stGetter_div.getModulesByType(2))[0];
          I_GeneralTransferManager_div = GeneralTransferManager.at(moduleData);
        });


    });

    describe("Buy tokens using on-chain whitelist and test locking them up and attempting to transfer", async() => {

        it("Should Buy the tokens from non-divisible", async() => {
            // Add the Investor in to the whitelist
            console.log(account_investor1);
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei('2', 'ether')), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toString(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should Buy some more tokens from non-divisible tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, web3.utils.toWei('10', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should unsuccessfully attach the LockUpTransferManager factory with the security token -- failed because Token is not paid", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("2000", "ether"), token_owner);
            await catchRevert(
                 I_SecurityToken.addModule(P_LockUpTransferManagerFactory.address, "0x", new BN(web3.utils.toWei("2000", "ether")), 0, false, { from: token_owner })
            )
        });

        it("Should successfully attach the LockUpTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), {from: token_owner});
            console.log((await P_LockUpTransferManagerFactory.setupCost.call()).toString());
            const tx = await I_SecurityToken.addModule(P_LockUpTransferManagerFactory.address, "0x", new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[3].args._types[0].toString(), transferManagerKey, "LockUpVolumeRestrictionTMFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "LockUpTransferManager",
                "LockUpTransferManager module was not added"
            );
            P_LockUpTransferManager = await LockUpTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the LockUpVolumeRestrictionTMFactory with the non-divisible security token", async () => {
            const tx = await I_SecurityToken.addModule(I_LockUpTransferManagerFactory.address, "0x", 0, 0, false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), transferManagerKey, "LockUpVolumeRestrictionTMFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "LockUpTransferManager",
                "LockUpTransferManager module was not added"
            );
            I_LockUpTransferManager = await LockUpTransferManager.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the LockUpVolumeRestrictionTMFactory with the divisible security token", async () => {
            const tx = await I_SecurityToken_div.addModule(I_LockUpTransferManagerFactory.address, "0x", 0, 0, false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), transferManagerKey, "LockUpVolumeRestrictionTMFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "LockUpTransferManager",
                "LockUpTransferManager module was not added"
            );
            I_LockUpVolumeRestrictionTM_div = await LockUpTransferManager.at(tx.logs[2].args._module);
        });

        it("Add a new token holder", async() => {

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor3.toLowerCase(), "Failed in adding the investor in whitelist");

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.issue(account_investor3, web3.utils.toWei('10', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toString(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should pause the tranfers at transferManager level", async() => {
            let tx = await I_LockUpTransferManager.pause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders up to limit", async() => {
            // Transfer Some tokens between the investor
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toString(),
                web3.utils.toWei('3', 'ether')
            );
        });

        it("Should unpause the tranfers at transferManager level", async() => {
            await I_LockUpTransferManager.unpause({from: token_owner});
        });

        it("Should prevent the creation of a lockup with bad parameters where the lockupAmount is zero", async() => {
            // create a lockup
            // this will generate an exception because the lockupAmount is zero
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUser(
                    account_investor2,
                    0,
                    currentTime.add(new BN(duration.seconds(1))),
                    new BN(duration.seconds(400000)),
                    new BN(duration.seconds(100000)),
                    web3.utils.fromAscii("a_lockup"),
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should prevent the creation of a lockup with bad parameters where the releaseFrequencySeconds is zero", async() => {
            // create a lockup
            // this will generate an exception because the releaseFrequencySeconds is zero
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUser(
                    account_investor2,
                    new BN(web3.utils.toWei('1', 'ether')),
                    currentTime.add(new BN(duration.seconds(1))),
                    new BN(duration.seconds(400000)),
                    0,
                    web3.utils.fromAscii("a_lockup"),
                    {
                         from: token_owner
                    }
                )
            );
        });

        it("Should prevent the creation of a lockup with bad parameters where the lockUpPeriodSeconds is zero", async() => {
            // create a lockup
            // this will generate an exception because the lockUpPeriodSeconds is zero
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUser(
                    account_investor2,
                    new BN(web3.utils.toWei('1', 'ether')),
                    currentTime.add(new BN(duration.seconds(1))),
                    0,
                    new BN(duration.seconds(100000)),
                    web3.utils.fromAscii("a_lockup"),
                    {
                         from: token_owner
                    }
                )
            );
        });

        it("Should add the lockup type -- fail because of bad owner", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpType(
                    new BN(web3.utils.toWei('12', 'ether')),
                    currentTime.add(new BN(duration.days(1))),
                    60,
                    20,
                    web3.utils.fromAscii("a_lockup"),
                    {
                        from: account_investor1
                    }
                )
            );
        })

        it("Should add the new lockup type", async() => {
            let tx = await I_LockUpTransferManager.addNewLockUpType(
                    new BN(web3.utils.toWei('12', 'ether')),
                    currentTime.add(new BN(duration.days(1))),
                    60,
                    20,
                    web3.utils.fromAscii("a_lockup"),
                    {
                        from: token_owner
                    }
            );
            assert.equal((tx.logs[0].args._lockupAmount).toString(), web3.utils.toWei('12', 'ether'));
        });

        it("Should fail to add the creation of the lockup where lockupName is already exists", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUser(
                    account_investor1,
                    web3.utils.toWei('5', 'ether'),
                    currentTime.add(new BN(duration.seconds(1))),
                    new BN(duration.seconds(400000)),
                    new BN(duration.seconds(100000)),
                    web3.utils.fromAscii("a_lockup"),
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should allow the creation of a lockup where the lockup amount is divisible" , async() => {
            // create a lockup
            currentTime = new BN(await latestTime());
            let tx = await I_LockUpVolumeRestrictionTM_div.addNewLockUpToUser(
                    account_investor1,
                    web3.utils.toWei('0.5', 'ether'),
                    currentTime.add(new BN(duration.seconds(1))),
                    new BN(duration.seconds(400000)),
                    new BN(duration.seconds(100000)),
                    web3.utils.fromAscii("a_lockup2"),
                    {
                        from: token_owner
                    }
            );
            assert.equal(tx.logs[1].args._userAddress, account_investor1);
            assert.equal((tx.logs[0].args._lockupAmount).toString(), web3.utils.toWei('0.5', 'ether'));
        });

        it("Should allow the creation of a lockup where the lockup amount is prime no", async() => {
            // create a lockup
            let tx = await I_LockUpVolumeRestrictionTM_div.addNewLockUpToUser(
                    account_investor1,
                    new BN(web3.utils.toWei('64951', 'ether')),
                    currentTime.add(new BN(duration.seconds(1))),
                    new BN(duration.seconds(400000)),
                    new BN(duration.seconds(100000)),
                    web3.utils.fromAscii("b_lockup"),
                    {
                        from: token_owner
                    }
            );
            assert.equal(tx.logs[1].args._userAddress, account_investor1);
            assert.equal((tx.logs[0].args._lockupAmount).toString(), web3.utils.toWei('64951', 'ether'));
        });

        it("Should prevent the transfer of tokens in a lockup", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor2)
            console.log("balance", balance.div(new BN(1).mul(new BN(10).pow(new BN(18)))).toString());
            // create a lockup for their entire balance
            // over 12 seconds total, with 3 periods of 20 seconds each.
            await I_LockUpTransferManager.addNewLockUpToUser(
                account_investor2,
                balance,
                currentTime.add(new BN(duration.seconds(1))),
                60,
                20,
                web3.utils.fromAscii("b_lockup"),
                {
                    from: token_owner
                }
            );
            await increaseTime(2);
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("b_lockup"));
            console.log("Amount get unlocked:", (tx[4].toString()));
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 })
            );
        });

        it("Should prevent the transfer of tokens if the amount is larger than the amount allowed by lockups", async() => {
            // wait 20 seconds
            await increaseTime(duration.seconds(20));
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("b_lockup"));
            console.log("Amount get unlocked:", (tx[4].toString()));
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, web3.utils.toWei('4', 'ether'), { from: account_investor2 })
            );
        });

        it("Should allow the transfer of tokens in a lockup if a period has passed", async() => {
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("b_lockup"));
            console.log("Amount get unlocked:", (tx[4].toString()));
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
        });

        it("Should again transfer of tokens in a lockup if a period has passed", async() => {
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("b_lockup"));
            console.log("Amount get unlocked:", (tx[4].toString()));
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
        });

        it("Should allow the transfer of more tokens in a lockup if another period has passed", async() => {

            // wait 20 more seconds + 1 to get rid of same block time
            await increaseTime(duration.seconds(21));
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("b_lockup"));
            console.log("Amount get unlocked:", (tx[4].toString()));
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor2 });
        });

        it("Buy more tokens from secondary market to investor2", async() => {
             // Mint some tokens
             await I_SecurityToken.issue(account_investor2, web3.utils.toWei('5', 'ether'), "0x0", { from: token_owner });

             assert.equal(
                 (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                 web3.utils.toWei('10', 'ether')
             );
        })

        it("Should allow transfer for the tokens that comes from secondary market + unlocked tokens", async() => {

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('4', 'ether'), { from: account_investor2 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('6', 'ether')
            );
        });

        it("Should allow the transfer of all tokens in a lockup if the entire lockup has passed", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor2)

            // wait 20 more seconds + 1 to get rid of same block time
            await increaseTime(duration.seconds(21));
            console.log((await I_LockUpTransferManager.getLockedTokenToUser.call(account_investor2)).toString());
            await I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('0', 'ether')
            );
        });

        it("Should fail to add the multiple lockups -- because array length mismatch", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUserMulti(
                    [account_investor3],
                    [web3.utils.toWei("6", "ether"), web3.utils.toWei("3", "ether")],
                    [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                    [60, 45],
                    [20, 15],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the multiple lockups -- because array length mismatch", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUserMulti(
                    [account_investor3, account_investor3],
                    [],
                    [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                    [60, 45],
                    [20, 15],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the multiple lockups -- because array length mismatch", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUserMulti(
                    [account_investor3, account_investor3],
                    [web3.utils.toWei("6", "ether"), web3.utils.toWei("3", "ether")],
                    [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                    [60, 45, 50],
                    [20, 15],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the multiple lockups -- because array length mismatch", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUserMulti(
                    [account_investor3, account_investor3],
                    [web3.utils.toWei("6", "ether"), web3.utils.toWei("3", "ether")],
                    [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                    [60, 45, 50],
                    [20, 15, 10],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the multiple lockups -- because array length mismatch", async() => {
            await catchRevert(
                I_LockUpTransferManager.addNewLockUpToUserMulti(
                    [account_investor3, account_investor3],
                    [web3.utils.toWei("6", "ether"), web3.utils.toWei("3", "ether")],
                    [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                    [60, 45],
                    [20, 15],
                    [web3.utils.fromAscii("c_lockup")],
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the multiple lockup to a address", async() => {
            currentTime = new BN(await latestTime());
            await I_LockUpTransferManager.addNewLockUpToUserMulti(
                [account_investor3, account_investor3],
                [web3.utils.toWei("6", "ether"), web3.utils.toWei("3", "ether")],
                [currentTime.add(new BN(duration.seconds(1))), currentTime.add(new BN(duration.seconds(21)))],
                [60, 45],
                [20, 15],
                [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                {
                    from: token_owner
                }
            );

            await increaseTime(1);
            let tx = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("c_lockup"));
            let tx2 = await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("d_lockup"));
            console.log("Total Amount get unlocked:", (tx[4].toString()) + (tx2[4].toString()));
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei('2', 'ether'), { from: account_investor3 })
            );

        });

        it("Should transfer the tokens after period get passed", async() => {
            // increase 20 sec that makes 1 period passed
            // 2 from a period and 1 is already unlocked
            await increaseTime(21);
            console.log(`\t Total balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())}`);
            console.log(`\t Locked balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3)).toString())}`);
            console.log(`\t Unlocked balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`UNLOCKED`), account_investor3)).toString())}`);
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('3'), { from: account_investor3 })
        })

        it("Should check the balance of the locked tokens", async() => {
            console.log(`\t Total balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())}`);
            console.log(`\t Locked balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3)).toString())}`);
            console.log(`\t Unlocked balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`UNLOCKED`), account_investor3)).toString())}`);
            assert.equal(
                web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()),
                web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3)).toString())
            );
            console.log(`\t Wrong partition: ${web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.toHex(`OCKED`), account_investor3)).toString())}`);
            assert.equal(
                web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.toHex(`OCKED`), account_investor3)).toString()),
                0
            );
        });

        it("Should transfer the tokens after passing another period of the lockup", async() => {
            // increase the 15 sec that makes first period of another lockup get passed
            // allow 1 token to transfer
            await increaseTime(15);
            // first fail because 3 tokens are not in unlocked state
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, web3.utils.toWei('3'), { from: account_investor3 })
            )
            let lockedBalance = web3.utils.fromWei((await I_LockUpTransferManager.getTokensByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3, new BN(0))).toString());
            let unlockedBalance = web3.utils.fromWei((await I_LockUpTransferManager.getTokensByPartition.call(web3.utils.utf8ToHex(`UNLOCKED`), account_investor3, new BN(0))).toString());
            console.log(`\t Total balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())}`);
            console.log(`\t Locked balance of the investor by the lockup: ${web3.utils.fromWei((await I_LockUpTransferManager.getLockedTokenToUser.call(account_investor3)).toString())}`);
            console.log(`Paused status: ${await I_LockUpTransferManager.paused.call()}`);
            console.log(`\t Locked balance: ${lockedBalance}`);
            console.log(`\t Unlocked Balance: ${unlockedBalance}`);
            assert.equal(
                web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()),
                parseInt(lockedBalance) + parseInt(unlockedBalance)
            );
            // second txn will pass because 1 token is in unlocked state
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1'), { from: account_investor3 })
        });

        it("Should transfer the tokens from both the lockup simultaneously", async() => {
            // Increase the 20 sec (+ 1 to mitigate the block time) that unlocked another 2 tokens from the lockup 1 and simultaneously unlocked 1
            // more token from the lockup 2
            await increaseTime(21);

            let lockedBalance = web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3)).toString());
            let unlockedBalance = web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`UNLOCKED`), account_investor3)).toString());
            console.log(`\t Total balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())}`);
            console.log(`\t Locked balance: ${lockedBalance}`);
            console.log(` \t Unlocked Amount for lockup 1: ${web3.utils.fromWei(((await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("c_lockup")))[4]).toString())}`)
            console.log(` \t Unlocked Amount for lockup 2: ${web3.utils.fromWei(((await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("d_lockup")))[4]).toString())}`)
            console.log(`\t Unlocked Balance: ${unlockedBalance}`);

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('3'), { from: account_investor3 })
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toString(),
                web3.utils.toWei('3', 'ether')
            );
            console.log("After transaction");
            lockedBalance = web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`LOCKED`), account_investor3)).toString());
            unlockedBalance = web3.utils.fromWei((await I_SecurityToken.balanceOfByPartition.call(web3.utils.utf8ToHex(`UNLOCKED`), account_investor3)).toString());
            console.log(`\t Total balance: ${web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())}`);
            console.log(`\t Locked balance: ${lockedBalance}`);
            console.log(` \t Unlocked Amount for lockup 1: ${web3.utils.fromWei(((await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("c_lockup")))[4]).toString())}`)
            console.log(` \t Unlocked Amount for lockup 2: ${web3.utils.fromWei(((await I_LockUpTransferManager.getLockUp.call(web3.utils.fromAscii("d_lockup")))[4]).toString())}`)
            console.log(`\t Unlocked Balance: ${unlockedBalance}`);
        });

        it("Should remove multiple lockup --failed because of bad owner", async() => {
            await catchRevert(
                I_LockUpTransferManager.removeLockUpFromUserMulti(
                    [account_investor3, account_investor3],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("d_lockup")],
                    {
                        from: account_polymath
                    }
                )
            );
        });

        it("Should remove the multiple lockup -- failed because of invalid lockupname", async() => {
            await catchRevert(
                I_LockUpTransferManager.removeLockUpFromUserMulti(
                    [account_investor3, account_investor3],
                    [web3.utils.fromAscii("c_lockup"), web3.utils.fromAscii("e_lockup")],
                    {
                        from: account_polymath
                    }
                )
            );
        })

        it("Should remove the multiple lockup", async() => {
            await I_LockUpTransferManager.removeLockUpFromUserMulti(
                [account_investor3, account_investor3],
                [web3.utils.fromAscii("d_lockup"), web3.utils.fromAscii("c_lockup")],
                {
                    from: token_owner
                }
            )
            // do the free transaction now
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('3'), { from: account_investor3 })
        });

        it("Should fail to modify the lockup -- because of bad owner", async() => {
            await I_SecurityToken.issue(account_investor3, web3.utils.toWei("9"), "0x0", {from: token_owner});

            let tx = await I_LockUpTransferManager.addNewLockUpToUser(
                account_investor3,
                web3.utils.toWei("9"),
                currentTime.add(new BN(duration.minutes(5))),
                60,
                20,
                web3.utils.fromAscii("z_lockup"),
                {
                    from: token_owner
                }
            );

            await catchRevert(
                 // edit the lockup
                I_LockUpTransferManager.modifyLockUpType(
                    web3.utils.toWei("9"),
                    currentTime.add(new BN(duration.seconds(1))),
                    60,
                    20,
                    web3.utils.fromAscii("z_lockup"),
                    {
                        from: account_polymath
                    }
                )
            )
        })

        it("Modify the lockup when startTime is in past -- failed because startTime is in the past", async() => {
            await catchRevert(
                // edit the lockup
               I_LockUpTransferManager.modifyLockUpType(
                   web3.utils.toWei("9"),
                   currentTime.add(new BN(duration.seconds(50))),
                   60,
                   20,
                   web3.utils.fromAscii("z_lockup"),
                   {
                       from: token_owner
                   }
               )
           )
        })

        it("Modify the lockup when startTime is in past -- failed because of invalid index", async() => {
            await catchRevert(
                // edit the lockup
               I_LockUpTransferManager.modifyLockUpType(
                   web3.utils.toWei("9"),
                   currentTime.add(new BN(duration.seconds(50))),
                   60,
                   20,
                   web3.utils.fromAscii("m_lockup"),
                   {
                       from: token_owner
                   }
               )
           )
        })

        it("should successfully modify the lockup", async() => {
                // edit the lockup
            currentTime = new BN(await latestTime());
            await I_LockUpTransferManager.modifyLockUpType(
                   web3.utils.toWei("9"),
                   currentTime.add(new BN(duration.seconds(50))),
                   60,
                   20,
                   web3.utils.fromAscii("z_lockup"),
                   {
                       from: token_owner
                   }
            );
        })

        it("Should prevent the transfer of tokens in an edited lockup", async() => {

            // balance here should be 12000000000000000000 (12e18 or 12 eth)
            let balance = await I_SecurityToken.balanceOf(account_investor1)

            console.log("balance", balance.div(new BN(1).mul(new BN(10).pow(new BN(18)))).toString());

            // create a lockup for their entire balance
            // over 16 seconds total, with 4 periods of 4 seconds each.
            await I_LockUpTransferManager.addNewLockUpToUser(
                account_investor1,
                balance,
                currentTime.add(new BN(duration.minutes(5))),
                60,
                20,
                web3.utils.fromAscii("f_lockup"),
                {
                    from: token_owner
                }
            );

            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 })
            );

            let lockUp = await I_LockUpTransferManager.getLockUp(web3.utils.fromAscii("f_lockup"));
            console.log(lockUp);
            // elements in lockup array are uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount
            assert.equal(
                lockUp[0].div(new BN(1).mul(new BN(10).pow(new BN(18)))).toString(),
                balance.div(new BN(1).mul(new BN(10).pow(new BN(18)))).toString()
            );
            assert.equal(lockUp[2].toString(), 60);
            assert.equal(lockUp[3].toString(), 20);
            assert.equal(lockUp[4].toString(), 0);

            // edit the lockup
            temp = currentTime.add(new BN(duration.seconds(1)));
            await I_LockUpTransferManager.modifyLockUpType(
                balance,
                temp,
                60,
                20,
                web3.utils.fromAscii("f_lockup"),
                {
                    from: token_owner
                }
            );

            // attempt a transfer
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei('6', 'ether'), { from: account_investor1 })
            );

            // wait 20 seconds
            await increaseTime(21);

            // transfer should succeed
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('6', 'ether'), { from: account_investor1 });

        });

        it("Modify the lockup during the lockup periods", async() => {
            let balance = await I_SecurityToken.balanceOf(account_investor1)
            let lockUp = await I_LockUpTransferManager.getLockUp(web3.utils.fromAscii("f_lockup"));
            console.log(lockUp[4].div(new BN(1).mul(new BN(10).pow(new BN(18)))).toString());
            // edit the lockup
            await I_LockUpTransferManager.modifyLockUpType(
                    balance,
                    currentTime.add(new BN(duration.days(10))),
                    90,
                    30,
                    web3.utils.fromAscii("f_lockup"),
                    {
                        from: token_owner
                    }
            );
        });

        it("Should remove the lockup multi", async() => {
            await I_LockUpTransferManager.addNewLockUpTypeMulti(
                [web3.utils.toWei("10"), web3.utils.toWei("16")],
                [currentTime.add(new BN(duration.days(1))), currentTime.add(new BN(duration.days(1)))],
                [50000, 50000],
                [10000, 10000],
                [web3.utils.fromAscii("k_lockup"), web3.utils.fromAscii("l_lockup")],
                {
                    from: token_owner
                }
            );

            // removing the lockup type
            let tx = await I_LockUpTransferManager.removeLockupType(web3.utils.fromAscii("k_lockup"), {from: token_owner});
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._lockupName), "k_lockup");

            // attaching the lockup to a user

            await I_LockUpTransferManager.addLockUpByName(account_investor2, web3.utils.fromAscii("l_lockup"), {from: token_owner});

            //Should not allow to add a user to a lockup multiple times
            await catchRevert(I_LockUpTransferManager.addLockUpByName(account_investor2, web3.utils.fromAscii("l_lockup"), {from: token_owner}));

            // try to delete the lockup but fail

            await catchRevert(
                I_LockUpTransferManager.removeLockupType(web3.utils.fromAscii("l_lockup"), {from: token_owner})
            );
        })

        it("Should get the data of all lockups", async() => {
            console.log(await I_LockUpTransferManager.getAllLockupData.call());
        });

        it("Should succesfully get the non existed lockup value, it will give everything 0", async() => {
            let data = await I_LockUpTransferManager.getLockUp(web3.utils.fromAscii("foo"));
            assert.equal(data[0], 0);
        })

        it("Should get configuration function signature", async() => {
            let sig = await I_LockUpTransferManager.getInitFunction.call();
            assert.equal(web3.utils.hexToNumber(sig), 0);
        });

        it("Should get the all lockups added by the issuer till now", async() => {
            let tx = await I_LockUpTransferManager.getAllLockups.call();
            for (let i = 0; i < tx.length; i++) {
                console.log(web3.utils.toUtf8(tx[i]));
            }
        })

        it("Should get the permission", async() => {
            let perm = await I_LockUpTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ''), "ADMIN")
        });

    });

    describe("LockUpTransferManager Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_LockUpTransferManagerFactory.setupCost.call(),0);
            assert.equal((await I_LockUpTransferManagerFactory.getTypes.call())[0],2);
            assert.equal(web3.utils.toAscii(await I_LockUpTransferManagerFactory.name.call())
                        .replace(/\u0000/g, ''),
                        "LockUpTransferManager",
                        "Wrong Module added");
            assert.equal(await I_LockUpTransferManagerFactory.description.call(),
                        "Manage transfers using lock ups over time",
                        "Wrong Module added");
            assert.equal(await I_LockUpTransferManagerFactory.title.call(),
                        "LockUp Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_LockUpTransferManagerFactory.version.call(), "3.0.0");
        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_LockUpTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "LockUp");
        });
    });

});
