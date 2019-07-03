import latestTime from "./helpers/latestTime";
import {duration, promisifyLogWatch} from "./helpers/utils";
import { takeSnapshot,increaseTime, revertToSnapshot} from "./helpers/time";
import {catchRevert} from "./helpers/exceptions";
import {deployRedemptionAndVerifyed, setUpPolymathNetwork} from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const TrackedRedemption = artifacts.require("./TrackedRedemption");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("TrackedRedemption", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_temp;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_TrackedRedemptionFactory;
    let I_GeneralPermissionManager;
    let I_TrackedRedemption;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_MRProxied;
    let I_PolymathRegistry;
    let P_TrackedRedemptionFactory;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const burnKey = 5;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];

        // ----------- POLYMATH NETWORK Configuration ------------

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


        // STEP 4: Deploy the TrackedRedemption
        [I_TrackedRedemptionFactory] = await deployRedemptionAndVerifyed(account_polymath, I_MRProxied, 0);
        [P_TrackedRedemptionFactory] = await deployRedemptionAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

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

        TrackedRedemptionFactory:          ${I_TrackedRedemptionFactory.address}
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

        it("Should successfully attach the paid TrackedRedemption with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), I_SecurityToken.address);
            const tx = await I_SecurityToken.addModule(P_TrackedRedemptionFactory.address, "0x0", new BN(web3.utils.toWei("2000")), new BN(0), false, {
                from: token_owner
            });
            assert.equal(tx.logs[3].args._types[0].toNumber(), burnKey, "TrackedRedemption doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "TrackedRedemption",
                "TrackedRedemption module was not added"
            );
            I_TrackedRedemption = await TrackedRedemption.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the TrackedRedemption with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_TrackedRedemptionFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), burnKey, "TrackedRedemption doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "TrackedRedemption",
                "TrackedRedemption module was not added"
            );
            I_TrackedRedemption = await TrackedRedemption.at(tx.logs[2].args._module);
        });
    });

    describe("Make Redemptions", async () => {
        it("Buy some tokens for account_investor1 (1 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
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

            // issue some tokens
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Buy some tokens for account_investor2 (2 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
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

            // issue some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("2", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Redeem some tokens - fail insufficient allowance", async () => {
            await I_GeneralTransferManager.modifyTransferRequirementsMulti(
                [0, 1, 2],
                [true, false, false],
                [true, true, false],
                [false, false, false],
                [false, false, false],
                { from: token_owner }
            );

            await catchRevert(I_TrackedRedemption.redeemTokens(new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));
        });

        it("Redeem some tokens", async () => {
            await I_SecurityToken.approve(I_TrackedRedemption.address, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            let tx = await I_TrackedRedemption.redeemTokens(new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            console.log(JSON.stringify(tx.logs));
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Mismatch address");
            assert.equal(web3.utils.fromWei(web3.utils.toBN(tx.logs[0].args._value)), 1, "Wrong value");
        });

        it("Get the init data", async () => {
            let tx = await I_TrackedRedemption.getInitFunction.call();
            assert.equal(web3.utils.toAscii(tx).replace(/\u0000/g, ""), 0);
        });

        it("Should get the listed permissions", async () => {
            let tx = await I_TrackedRedemption.getPermissions.call();
            assert.equal(tx.length, 0);
        });

        describe("Test cases for the TrackedRedemptionFactory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal((await I_TrackedRedemptionFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_TrackedRedemptionFactory.getTypes.call())[0], 5);
                assert.equal(await I_TrackedRedemptionFactory.version.call(), "3.0.0");
                assert.equal(
                    web3.utils.toAscii(await I_TrackedRedemptionFactory.name.call()).replace(/\u0000/g, ""),
                    "TrackedRedemption",
                    "Wrong Module added"
                );
                assert.equal(await I_TrackedRedemptionFactory.description.call(), "Track token redemptions", "Wrong Module added");
                assert.equal(await I_TrackedRedemptionFactory.title.call(), "Tracked Redemption", "Wrong Module added");
                let tags = await I_TrackedRedemptionFactory.getTags.call();
                assert.equal(tags.length, 2);
            });
        });
    });
});
