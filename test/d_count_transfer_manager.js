import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployCountTMAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const CountTransferManagerFactory = artifacts.require("./CountTransferManagerFactory.sol");
const CountTransferManager = artifacts.require("./CountTransferManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("CountTransferManager", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let P_CountTransferManagerFactory;
    let P_CountTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_CountTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_CountTransferManager;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
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

    // CountTransferManager details
    const holderCount = 2; // Maximum number of token holders
    let bytesSTO = encodeModuleCall(["uint256"], [holderCount]);

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];

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
            I_STRProxied
        ] = instances;

        // STEP 2: Deploy the CountTransferManager
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy Paid the CountTransferManager
        [P_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));

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
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[2].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[2].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_CountTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_CountTransferManagerFactory.address,
                bytesSTO,
                web3.utils.toWei("500", "ether"),
                0,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "CountTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManagerFactory module was not added"
            );
            P_CountTransferManager = CountTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the CountTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManager module was not added"
            );
            I_CountTransferManager = CountTransferManager.at(tx.logs[2].args._module);
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("2", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("2", "ether"));
        });

        it("Should able to buy some more tokens (more than 2 hoders) -- because CountTransferManager is paused", async() => {
            await I_CountTransferManager.pause({from: account_issuer });
            let snapId = await takeSnapshot();
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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

            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("3", "ether"), { from: token_owner })
            await revertToSnapshot(snapId);
        })

        it("Should fail to buy some more tokens (more than 2 holders)", async () => {
            await I_CountTransferManager.unpause({from: account_issuer });
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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

            await catchRevert(I_SecurityToken.mint(account_investor3, web3.utils.toWei("3", "ether"), { from: token_owner }));
        });

        it("Should still be able to add to original token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("2", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("4", "ether"));
        });

        it("Should still be able to transfer between existing token holders before count change", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("2", "ether"), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("2", "ether"));
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
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2", "ether"), { from: account_investor1 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("4", "ether"));
        });

        it("Should not be able to transfer to a new token holder", async () => {
            // await I_CountTransferManager.unpause({from: token_owner});
            await catchRevert(I_SecurityToken.transfer(account_investor3, web3.utils.toWei("2", "ether"), { from: account_investor2 }));
        });

        it("Should be able to consolidate balances", async () => {
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("1", "ether"), { from: account_investor1 });
        });

        it("Should get the permission list", async () => {
            let perm = await I_CountTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

        describe("Test cases for the factory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal(await I_CountTransferManagerFactory.getSetupCost.call(), 0);
                assert.equal((await I_CountTransferManagerFactory.getTypes.call())[0], 2);
                assert.equal(
                    web3.utils.toAscii(await I_CountTransferManagerFactory.getName.call()).replace(/\u0000/g, ""),
                    "CountTransferManager",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_CountTransferManagerFactory.description.call(),
                    "Restrict the number of investors",
                    "Wrong Module added"
                );
                assert.equal(await I_CountTransferManagerFactory.title.call(), "Count Transfer Manager", "Wrong Module added");
                assert.equal(
                    await I_CountTransferManagerFactory.getInstructions.call(),
                    "Allows an issuer to restrict the total number of non-zero token holders",
                    "Wrong Module added"
                );
            });

            it("Should get the tags of the factory", async () => {
                let tags = await I_CountTransferManagerFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Count");
            });
        });

        describe("Test cases for the ModuleFactory", async() => {
            it("Should successfully change the SetupCost -- fail beacuse of bad owner", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeFactorySetupFee(web3.utils.toWei("500"), {from: account_investor3})
                );
            });

            it("Should successfully change the setupCost", async() => {
                await I_CountTransferManagerFactory.changeFactorySetupFee(web3.utils.toWei("800"), { from: account_polymath });
                assert.equal(await I_CountTransferManagerFactory.getSetupCost.call(), web3.utils.toWei("800"));
            })

            it("Should successfully change the usage fee -- fail beacuse of bad owner", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeFactoryUsageFee(web3.utils.toWei("500"), {from: account_investor3})
                );
            });

            it("Should successfully change the usage fee", async() => {
                await I_CountTransferManagerFactory.changeFactoryUsageFee(web3.utils.toWei("800"), { from: account_polymath });
                assert.equal(await I_CountTransferManagerFactory.usageCost.call(), web3.utils.toWei("800"));
            });

            it("Should successfully change the subscription fee -- fail beacuse of bad owner", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeFactorySubscriptionFee(web3.utils.toWei("500"), {from: account_investor3})
                );
            });

            it("Should successfully change the subscription fee", async() => {
                await I_CountTransferManagerFactory.changeFactorySubscriptionFee(web3.utils.toWei("800"), { from: account_polymath });
                assert.equal(await I_CountTransferManagerFactory.monthlySubscriptionCost.call(), web3.utils.toWei("800"));
            });

            it("Should successfully change the version of the factory -- failed because of bad owner", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeVersion("5.0.0", {from: account_investor3})
                );
            });

            it("Should successfully change the version of the fatory -- failed because of the 0 string", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeVersion("", {from: account_polymath})
                );
            });

            it("Should successfully change the version of the fatory", async() => {
                await I_CountTransferManagerFactory.changeVersion("5.0.0", {from: account_polymath});
                assert.equal(await I_CountTransferManagerFactory.version.call(), "5.0.0");
            });
        })

        describe("Test case for the changeSTVersionBounds", async() => {
            it("Should successfully change the version bounds -- failed because of the non permitted bound type", async() => {
                await catchRevert(
                    I_CountTransferManagerFactory.changeSTVersionBounds("middleType", [1,2,3], {from: account_polymath})
                );
            })

            it("Should successfully change the version bound --failed because the new version length < 3", async()=> {
                await catchRevert(
                    I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1,2], {from: account_polymath})
                );
            })

            it("Should successfully change the version bound", async()=> {
                await I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1,2,1], {from: account_polymath});
                await I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1,4,9], {from: account_polymath});
                await catchRevert(
                    I_CountTransferManagerFactory.changeSTVersionBounds("lowerBound", [1,0,0], {from: account_polymath})
                );
            })
        })
    });
});
