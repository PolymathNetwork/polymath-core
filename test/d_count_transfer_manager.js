import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeModuleCall, encodeProxyCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployCountTMAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const CountTransferManagerFactory = artifacts.require("./CountTransferManagerFactory.sol");
const CountTransferManager = artifacts.require("./CountTransferManager");
const MockCountTransferManager = artifacts.require("./MockCountTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("CountTransferManager", async (accounts) => {
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
    let I_SecurityTokenRegistryProxy;
    let P_CountTransferManagerFactory;
    let P_CountTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_CountTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_CountTransferManager;
    let I_CountTransferManager2;
    let I_CountTransferManager3;
    let I_GeneralTransferManager;
    let I_GeneralTransferManager2;
    let I_GeneralTransferManager3;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STFactory;
    let I_SecurityToken;
    let I_SecurityToken2;
    let I_SecurityToken3;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let I_MockCountTransferManagerLogic;
    let stGetter;
    let stGetter2;
    let stGetter3;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const symbol2 = "sapp";
    const symbol3 = "sapp3"
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    // CountTransferManager details
    const holderCount = 2; // Maximum number of token holders
    let bytesSTO = encodeModuleCall(["uint256"], [holderCount]);

    let currentTime;

    before(async () => {
        currentTime = new BN(await latestTime());
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[6];

        // Step 1: Deploy the genral PM ecosystem
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
            I_STRGetter,
            I_STGetter
        ] = instances;

        // STEP 2: Deploy the CountTransferManager
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy Paid the CountTransferManager
        [P_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500", "ether")));

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
        CountTransferManagerFactory:       ${I_CountTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_CountTransferManagerFactory.address, bytesSTO, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_CountTransferManagerFactory.address,
                bytesSTO,
                new BN(web3.utils.toWei("2000", "ether")),
                new BN(0),
                false,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "CountTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManagerFactory module was not added"
            );
            P_CountTransferManager = await CountTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the CountTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManager module was not added"
            );
            I_CountTransferManager = await CountTransferManager.at(tx.logs[2].args._module);
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("2", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should able to buy some more tokens (more than 2 hoders) -- because CountTransferManager is paused", async () => {
            await I_CountTransferManager.pause({ from: account_issuer });
            let snapId = await takeSnapshot();
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("3", "ether")), "0x0", { from: token_owner });
            await revertToSnapshot(snapId);
        });

        it("Should fail to buy some more tokens (more than 2 holders)", async () => {
            await I_CountTransferManager.unpause({ from: account_issuer });
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            await catchRevert(I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("3", "ether")), "0x0", { from: token_owner }));
            await catchRevert(I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 }));
            let canTransfer = await I_SecurityToken.canTransfer(account_investor3, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: account_investor2 });
            assert.equal(canTransfer[0], "0x50"); //Transfer failure.
        });

        it("Should still be able to add to original token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("2", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("4", "ether")).toString());
        });

        it("Should still be able to transfer between existing token holders before count change", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("2", "ether")), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should fail in modifying the holder count", async () => {
            await catchRevert(I_CountTransferManager.changeHolderCount(1, { from: account_investor1 }));
        });

        it("Modify holder count to 1", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_CountTransferManager.changeHolderCount(1, { from: token_owner });

            assert.equal((await I_CountTransferManager.maxHolderCount()).toNumber(), 1);
        });

        it("Should still be able to transfer between existing token holders after count change", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2", "ether")), { from: account_investor1 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("4", "ether")).toString());
        });

        it("Should not be able to transfer to a new token holder", async () => {
            // await I_CountTransferManager.unpause({from: token_owner});
            await catchRevert(I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("2", "ether")), { from: account_investor2 }));
        });

        it("Should be able to consolidate balances", async () => {
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
        });

        it("Should get the permission list", async () => {
            let perm = await I_CountTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

        describe("Test cases for adding and removing acc holder at the same time", async () => {
            it("deploy a new token & auto attach modules", async () => {
                //register ticker and deploy token
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerNewTicker(token_owner, symbol2, { from: token_owner });

                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

                let tx2 = await I_STRProxied.generateNewSecurityToken(name, symbol2, tokenDetails, false, token_owner, 0, { from: token_owner });

                I_SecurityToken2 = await SecurityToken.at(tx2.logs[1].args._securityTokenAddress);
                stGetter2 = await STGetter.at(I_SecurityToken2.address);
                let moduleData = (await stGetter2.getModulesByType(2))[0];
                I_GeneralTransferManager2 = await GeneralTransferManager.at(moduleData);
            });

            it("deploy another new token & auto attach modules", async () => {
                //register ticker and deploy token
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerTicker(token_owner, symbol3, contact, { from: token_owner });

                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

                let tx2 = await I_STRProxied.generateNewSecurityToken(name, symbol3, tokenDetails, false, token_owner, 0, { from: token_owner });

                I_SecurityToken3 = await SecurityToken.at(tx2.logs[1].args._securityTokenAddress);
                stGetter3 = await STGetter.at(I_SecurityToken3.address);
                let moduleData = (await stGetter3.getModulesByType(2))[0];
                I_GeneralTransferManager3 = await GeneralTransferManager.at(moduleData);
            });

            it("add 3 holders to the token", async () => {
                await I_GeneralTransferManager2.modifyKYCData(
                    account_investor1,
                    currentTime,
                    currentTime,
                    currentTime.add(new BN(duration.days(10))),
                    {
                        from: account_issuer,
                        gas: 500000
                    }
                );

                await I_GeneralTransferManager2.modifyKYCData(
                    account_investor2,
                    currentTime,
                    currentTime,
                    currentTime.add(new BN(duration.days(10))),
                    {
                        from: account_issuer,
                        gas: 500000
                    }
                );

                await I_GeneralTransferManager2.modifyKYCData(
                    account_investor3,
                    currentTime,
                    currentTime,
                    currentTime.add(new BN(duration.days(10))),
                    {
                        from: account_issuer,
                        gas: 500000
                    }
                );

                await I_GeneralTransferManager2.modifyKYCData(
                    account_investor4,
                    currentTime,
                    currentTime,
                    currentTime.add(new BN(duration.days(10))),
                    {
                        from: account_issuer,
                        gas: 500000
                    }
                );

                // Jump time
                await increaseTime(5000);

                // Add 3 holders to the token
                await I_SecurityToken2.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
                await I_SecurityToken2.issue(account_investor2, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
                await I_SecurityToken2.issue(account_investor3, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
                assert.equal((await I_SecurityToken2.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            });

            it("Should initialize the auto attached modules", async () => {
                let moduleData = (await stGetter2.getModulesByType(2))[0];
                I_GeneralTransferManager2 = await GeneralTransferManager.at(moduleData);
            });

            it("Should successfully attach the CountTransferManager factory with the security token", async () => {
                await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
                await catchRevert(
                    I_SecurityToken2.addModule(P_CountTransferManagerFactory.address, bytesSTO, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                        from: token_owner
                    })
                );
            });

            it("Should successfully attach the CountTransferManager with the security token and set max holder to 2", async () => {
                const tx = await I_SecurityToken2.addModule(I_CountTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
                assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                    "CountTransferManager",
                    "CountTransferManager module was not added"
                );
                I_CountTransferManager2 = await CountTransferManager.at(tx.logs[2].args._module);
                await I_CountTransferManager2.changeHolderCount(2, { from: token_owner });
                console.log("current max holder number is " + (await I_CountTransferManager2.maxHolderCount({ from: token_owner })));
            });

            it("Should successfully attach the CountTransferManager with the third security token and set max holder to 2", async () => {
                const tx = await I_SecurityToken3.addModule(I_CountTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
                assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                    "CountTransferManager",
                    "CountTransferManager module was not added"
                );
                I_CountTransferManager3 = await CountTransferManager.at(tx.logs[2].args._module);
                await I_CountTransferManager3.changeHolderCount(2, { from: token_owner });
                console.log("current max holder number is " + (await I_CountTransferManager3.maxHolderCount({ from: token_owner })));
            });

            it("Should upgrade the CTM", async () => {
                I_MockCountTransferManagerLogic = await MockCountTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });
                let bytesCM = encodeProxyCall(["uint256"], [11]);
                await catchRevert(
                    // Fails as no upgrade available
                    I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner })
                );
                await catchRevert(
                    // Fails due to the same version being used
                    I_CountTransferManagerFactory.setLogicContract("3.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath })
                );
                await catchRevert(
                    // Fails due to the wrong contract being used
                    I_CountTransferManagerFactory.setLogicContract("4.0.0", "0x0000000000000000000000000000000000000000", bytesCM, { from: account_polymath })
                );
                await catchRevert(
                    // Fails due to the wrong owner being used
                    I_CountTransferManagerFactory.setLogicContract("4.0.0", "0x0000000000000000000000000000000000000000", bytesCM, { from: token_owner })
                );
                await I_CountTransferManagerFactory.setLogicContract("4.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath });
                await catchRevert(
                    // Fails as upgraded module has been unverified
                    I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner })
                );
                let tx = await I_MRProxied.verifyModule(I_CountTransferManagerFactory.address, { from: account_polymath });
                await I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner });
                let I_MockCountTransferManager = await MockCountTransferManager.at(I_CountTransferManager2.address);
                let newValue = await I_MockCountTransferManager.someValue.call();
                assert(newValue.toNumber(), 11);
                await I_MockCountTransferManager.newFunction();
            });

            it("Should modify the upgrade data and upgrade", async () => {
                let bytesCM = encodeProxyCall(["uint256"], [12]);
                await catchRevert(
                    // Fails due to the same version being used
                    I_CountTransferManagerFactory.updateLogicContract(1, "3.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath })
                );
                await catchRevert(
                    // Fails due to the wrong contract being used
                    I_CountTransferManagerFactory.updateLogicContract(1, "4.0.0", "0x0000000000000000000000000000000000000000", bytesCM, { from: account_polymath })
                );
                await catchRevert(
                    // Fails due to the wrong owner being used
                    I_CountTransferManagerFactory.updateLogicContract(1, "4.0.0", "0x0000000000000000000000000000000000000000", bytesCM, { from: token_owner })
                );
                await I_CountTransferManagerFactory.updateLogicContract(1, "4.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath });
                await catchRevert(
                    // Fails as upgraded module has been unverified
                    I_SecurityToken3.upgradeModule(I_CountTransferManager3.address, { from: token_owner })
                );
                let tx = await I_MRProxied.verifyModule(I_CountTransferManagerFactory.address, { from: account_polymath });
                await I_SecurityToken3.upgradeModule(I_CountTransferManager3.address, { from: token_owner });
                let I_MockCountTransferManager = await MockCountTransferManager.at(I_CountTransferManager3.address);
                let newValue = await I_MockCountTransferManager.someValue.call();
                assert(newValue.toNumber(), 12);
                await I_MockCountTransferManager.newFunction();

            });

            it("Should upgrade the CTM again", async () => {
                let I_MockCountTransferManagerLogic = await MockCountTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });
                let bytesCM = encodeProxyCall(["uint256"], [11]);
                await catchRevert(
                    // Fails as no upgrade available
                    I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner })
                );
                await catchRevert(
                    // Fails due to the same version being used
                    I_CountTransferManagerFactory.setLogicContract("4.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath })
                );
                await I_CountTransferManagerFactory.setLogicContract("5.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath });
                await catchRevert(
                    // Fails due to the same contract being used
                    I_CountTransferManagerFactory.setLogicContract("6.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath })
                );
                I_MockCountTransferManagerLogic = await MockCountTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });
                await I_CountTransferManagerFactory.setLogicContract("6.0.0", I_MockCountTransferManagerLogic.address, bytesCM, { from: account_polymath });
                await I_MRProxied.verifyModule(I_CountTransferManagerFactory.address, { from: account_polymath });
                await I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner });
                await I_SecurityToken2.upgradeModule(I_CountTransferManager2.address, { from: token_owner });
            });

            it("Should allow add a new token holder while transfer all the tokens at one go", async () => {
                let amount = await I_SecurityToken2.balanceOf(account_investor2);
                let investorCount = await stGetter2.holderCount({ from: account_investor2 });
                console.log("current investor count is " + investorCount);
                await I_SecurityToken2.transfer(account_investor4, amount, { from: account_investor2 });
                assert((await I_SecurityToken2.balanceOf(account_investor4)).toString(), amount.toString(), { from: account_investor2 });
                assert(await stGetter2.holderCount({ from: account_investor2 }), investorCount);
            });
        });

        describe("Test cases for the factory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal(await I_CountTransferManagerFactory.setupCost.call(), 0);
                assert.equal((await I_CountTransferManagerFactory.getTypes.call())[0], 2);
                assert.equal(
                    web3.utils.toAscii(await I_CountTransferManagerFactory.name.call()).replace(/\u0000/g, ""),
                    "CountTransferManager",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_CountTransferManagerFactory.description.call(),
                    "Restrict the number of investors",
                    "Wrong Module added"
                );
                assert.equal(await I_CountTransferManagerFactory.title.call(), "Count Transfer Manager", "Wrong Module added");
            });

            it("Should get the tags of the factory", async () => {
                let tags = await I_CountTransferManagerFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Count");
            });
        });

        describe("Test cases for the ModuleFactory", async () => {
            it("Should successfully change the SetupCost -- fail beacuse of bad owner", async () => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeSetupCost(new BN(web3.utils.toWei("500")), { from: account_investor3 })
                );
            });

            it("Should successfully change the setupCost", async () => {
                await I_CountTransferManagerFactory.changeSetupCost(new BN(web3.utils.toWei("800")), { from: account_polymath });
                assert.equal((await I_CountTransferManagerFactory.setupCost.call()).toString(), new BN(web3.utils.toWei("800")).toString());
            });

            it("Should successfully change the cost type -- fail beacuse of bad owner", async () => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeCostAndType(new BN(web3.utils.toWei("500")), true, { from: account_investor3 })
                );
            });

            it("Should successfully change the cost type", async () => {
                let snapId = await takeSnapshot();
                let tx = await I_CountTransferManagerFactory.changeCostAndType(new BN(web3.utils.toWei("500")), true, { from: account_polymath });
                assert.equal(tx.logs[0].args[1].toString(), new BN(web3.utils.toWei("500")).toString(), "wrong setup fee in event");
                assert.equal(tx.logs[1].args[1], true, "wrong fee type in event");
                assert.equal((await I_CountTransferManagerFactory.setupCost.call()).toString(), new BN(web3.utils.toWei("500")).toString());
                assert.equal((await I_CountTransferManagerFactory.setupCost.call()).toString(), (await I_CountTransferManagerFactory.setupCostInPoly.call()).toString());
                await revertToSnapshot(snapId);
            });

        });

        describe("Test case for the changeSTVersionBounds", async () => {
            it("Should successfully change the version bounds -- failed because of the non permitted bound type", async () => {
                await catchRevert(I_CountTransferManagerFactory.changeSTVersionBounds("middleType", [1, 2, 3], { from: account_polymath }));
            });

            it("Should successfully change the version bound --failed because the new version length < 3", async () => {
                await catchRevert(I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1, 2], { from: account_polymath }));
            });

            it("Should successfully change the version bound", async () => {
                await I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1, 2, 1], { from: account_polymath });
                await I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1, 0, 9], { from: account_polymath });
                await catchRevert(I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1, 1, 0], { from: account_polymath }));
            });
        });
    });
});
