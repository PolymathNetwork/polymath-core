import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployPercentageTMAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const PercentageTransferManager = artifacts.require("./PercentageTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PercentageTransferManager", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_delegate;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_PercentageTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_PercentageTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_PercentageTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_PercentageTransferManager;
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
    let I_STRGetter;
    let I_PolymathRegistry;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const managerDetails = web3.utils.fromAscii("Hello");
    const delegateDetails = web3.utils.fromAscii("I am delegate");

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    // PercentageTransferManager details
    const holderPercentage = new BN(web3.utils.toWei("0.7")); // Maximum number of token holders

    let bytesSTO = web3.eth.abi.encodeFunctionCall(
        {
            name: "configure",
            type: "function",
            inputs: [
                {
                    type: "uint256",
                    name: "_maxHolderPercentage"
                },
                {
                    type: "bool",
                    name: "_allowPrimaryIssuance"
                }
            ]
        },
        [holderPercentage.toString(), false]
    );

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[5]
        account_delegate = accounts[6];

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);

        // STEP 3(a): Deploy the PercentageTransferManager
        [I_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, 0);

        // STEP 4(b): Deploy the PercentageTransferManager
        [P_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(
            account_polymath,
            I_MRProxied,
            new BN(web3.utils.toWei("500", "ether"))
        );
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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        PercentageTransferManagerFactory:  ${I_PercentageTransferManagerFactory.address}
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
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
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
                    gas: 6000000
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
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should successfully attach the PercentageTransferManager factory with the security token - failed payment", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_PercentageTransferManagerFactory.address, bytesSTO, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the PercentageTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_PercentageTransferManagerFactory.address,
                bytesSTO,
                new BN(web3.utils.toWei("2000", "ether")),
                new BN(0),
                false,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "PercentageTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "PercentageTransferManagerFactory module was not added"
            );
            P_PercentageTransferManager = await PercentageTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the PercentageTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_PercentageTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "PercentageTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "PercentageTransferManager module was not added"
            );
            I_PercentageTransferManager = await PercentageTransferManager.at(tx.logs[2].args._module);
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should pause the tranfers at transferManager level", async () => {
            let tx = await I_PercentageTransferManager.pause({ from: token_owner });
        });

        it("Should still be able to transfer between existing token holders up to limit", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should unpause the tranfers at transferManager level", async () => {
            await I_PercentageTransferManager.unpause({ from: token_owner });
        });

        it("Should not be able to transfer between existing token holders over limit", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("2", "ether")), { from: account_investor1 }));
        });

        it("Should not be able to issue token amount over limit", async () => {
            await catchRevert(I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("100", "ether")), "0x0", { from: token_owner }));
        });

        it("Allow unlimited primary issuance and remint", async () => {
            let snapId = await takeSnapshot();
            await I_PercentageTransferManager.setAllowPrimaryIssuance(true, { from: token_owner });
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("100", "ether")), "0x0", { from: token_owner });
            // trying to call it again with the same value. should fail
            await catchRevert(I_PercentageTransferManager.setAllowPrimaryIssuance(true, { from: token_owner }));
            await revertToSnapshot(snapId);
        });

        it("Should not be able to transfer between existing token holders over limit", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("2", "ether")), { from: account_investor1 }));
        });

        it("Should not be able to modify holder percentage to 100 - Unauthorized msg.sender", async () => {
            await catchRevert(I_PercentageTransferManager.changeHolderPercentage(new BN(10).pow(new BN(18)), { from: account_delegate }));
        });

        it("Should successfully add the delegate", async () => {
            let tx = await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner });
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should provide the permission", async () => {
            let tx = await I_GeneralPermissionManager.changePermission(
                account_delegate,
                I_PercentageTransferManager.address,
                web3.utils.fromAscii("ADMIN"),
                true,
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Modify holder percentage to 100", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_PercentageTransferManager.changeHolderPercentage(new BN(10).pow(new BN(18)), { from: account_delegate });

            assert.equal((await I_PercentageTransferManager.maxHolderPercentage()).toString(), (new BN(10).pow(new BN(18))).toString());
        });

        it("Should be able to transfer between existing token holders up to limit", async () => {
            await I_PercentageTransferManager.modifyWhitelist(account_investor3, false, { from: token_owner });
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("2", "ether")), { from: account_investor1 });
        });

        it("Should whitelist in batch --failed because of mismatch in array lengths", async () => {
            let addressArray = [account_investor3, account_investor4];
            await catchRevert(
                I_PercentageTransferManager.modifyWhitelistMulti(addressArray, [false], { from: token_owner })
            );
        });

        it("Should whitelist in batch", async () => {
            let snapId = await takeSnapshot();
            let addressArray = [];
            addressArray.push(account_investor3);
            addressArray.push(account_investor4);
            await I_PercentageTransferManager.modifyWhitelistMulti(addressArray, [false, true], {
                from: token_owner
            });
            await revertToSnapshot(snapId);
        });

        it("Should be able to whitelist address and then transfer regardless of holders", async () => {
            await I_PercentageTransferManager.changeHolderPercentage(new BN(30).mul(new BN(10).pow(new BN(16))), { from: token_owner });
            await I_PercentageTransferManager.modifyWhitelist(account_investor1, true, { from: token_owner });
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("2", "ether")), { from: account_investor3 });
        });

        it("Should get the permission", async () => {
            let perm = await I_PercentageTransferManager.getPermissions.call();
            assert.equal(perm.length, 2);
        });
    });

    describe("Percentage Transfer Manager Factory test cases", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_PercentageTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_PercentageTransferManagerFactory.getTypes.call())[0], 2);
            assert.equal(
                web3.utils.toAscii(await I_PercentageTransferManagerFactory.name.call()).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_PercentageTransferManagerFactory.description.call(),
                "Restrict the number of investors",
                "Wrong Module added"
            );
            assert.equal(await I_PercentageTransferManagerFactory.title.call(), "Percentage Transfer Manager", "Wrong Module added");
            assert.equal(await I_PercentageTransferManagerFactory.version.call(), "3.0.0");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_PercentageTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Percentage");
        });
    });
});
