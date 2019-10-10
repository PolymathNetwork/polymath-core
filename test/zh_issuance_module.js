import latestTime from "./helpers/latestTime";
import { duration } from "./helpers/utils";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployIssuanceAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const Issuance = artifacts.require("./Issuance.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Issuance", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_delegate;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_SecurityTokenRegistry;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_IssuanceFactory;
    let I_Issuance;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STGetter;
    let I_STRGetter;
    let treasury_wallet;

    // SecurityToken Details for funds raise Type ETH
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";

    // Module key
    const transferManagerKey = 2;
    const mintKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    async function currentTime() {
        return new BN(await latestTime());
    }


    function convertToNumber(value) {
        return web3.utils.fromWei(value.toString());
    }

    before(async () => {
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[4];
        account_investor2 = accounts[3];
        account_investor3 = accounts[5];
        account_delegate = accounts[2];
        treasury_wallet = accounts[6];
        token_owner = account_issuer;

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

        // STEP 5: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, new BN(0));
        // STEP 6: Deploy the IssuanceFactory
        [I_IssuanceFactory] = await deployIssuanceAndVerifyed(account_polymath, I_MRProxied, new BN(0));

        // Printing all the contract addresses
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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_IssuanceFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, treasury_wallet, 0, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            I_STGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await I_STGetter.getTreasuryWallet.call(), treasury_wallet, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await I_STGetter.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Deploy the module and test the functionality", async() => {

        it("Should deploy the issuance the module", async() => {
            await I_SecurityToken.addModule(I_IssuanceFactory.address, '0x0', new BN(0), new BN(0), false, {from: token_owner});
            let moduleData = (await I_STGetter.getModulesByType(mintKey))[0];
            I_Issuance = await Issuance.at(moduleData);
        });

        it("Should whitelist certain addresses to play an investor role", async() => {
            let canSendAfter = new BN(1);
            let canReceiveAfter = new BN(1);
            let expiryTime = (await currentTime()).add(new BN(duration.days(20)));
            await I_GeneralTransferManager.modifyKYCDataMulti(
                [account_investor1, account_investor2, account_investor3],
                [canSendAfter, canSendAfter, canSendAfter],
                [canReceiveAfter, canReceiveAfter, canReceiveAfter],
                [expiryTime, expiryTime, expiryTime],
                {
                    from: token_owner
                }
            );
        });

        it("Should mint successfully by the token owner", async() => {
            let tokenAmount = new BN(web3.utils.toWei("100"));
            await I_Issuance.issueTokens(account_investor1, tokenAmount, "0x0", {from: token_owner});
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor1)), 100);
        });

        it("Should mint successfully to the multiple investor by the token owner", async() => {
            let tokenAmount = new BN(web3.utils.toWei("100"));
            let tx = await I_Issuance.issueTokensMulti(
                [account_investor2, account_investor3], 
                [tokenAmount, tokenAmount],
                {
                    from: token_owner
                }
            );
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor2)), 100);
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor3)), 100);
            assert.equal(tx.logs[0].args._tokenHolders.length, 2);
            assert.equal(tx.logs[0].args._issuedBy, token_owner);
        });

        it("Should fail to mint -- Invalid permission", async() => {
            await catchRevert(
                I_Issuance.issueTokens(
                    account_investor3,
                    new BN(web3.utils.toWei("100")),
                    "0x0",
                    {
                        from: account_delegate
                    }
                ),
                "Invalid permission"
            );
        });

        it("Should successfully attach the GeneralPermissionManager", async() => {
            await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, {from: token_owner});
            let moduleData = (await I_STGetter.getModulesByType(new BN(1)))[0];
            I_GeneralPermissionManager = await GeneralPermissionManager.at(moduleData);
        });

        it("Should provide the permission to the delegate", async() => {
            await I_GeneralPermissionManager.addDelegate(account_delegate, web3.utils.toHex("details"), {from: token_owner});
            await I_GeneralPermissionManager.changePermission(account_delegate, I_Issuance.address, web3.utils.fromAscii("ADMIN"), true, {from: token_owner});
            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_Issuance.address, web3.utils.fromAscii("ADMIN"))
            );
        });

        it("Should mint successfully by the delegate", async() => {
            let tokenAmount = new BN(web3.utils.toWei("1000"));
            await I_Issuance.issueTokens(account_investor1, tokenAmount, "0x0", {from: account_delegate});
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor1)), 1100);
        });
        
        it("Should mint successfully to the multiple investor by the delegate", async() => {
            let tokenAmount = new BN(web3.utils.toWei("200"));
            let tx = await I_Issuance.issueTokensMulti(
                [account_investor2, account_investor3], 
                [tokenAmount, tokenAmount],
                {
                    from: account_delegate
                }
            );
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor2)), 300);
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor3)), 300);
            assert.equal(tx.logs[0].args._tokenHolders.length, 2);
            assert.equal(tx.logs[0].args._issuedBy, account_delegate);
        });

        it("Should get the list of permission", async() => {
            let perm = await I_Issuance.getPermissions.call();
            assert.equal(perm.length, 1);
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
        });

        it("Should get the configure function selector", async() => {
            let initSelector = await I_Issuance.getInitFunction.call();
            assert.equal(initSelector, "0x00000000");
        });
    });

    describe("Test cases for the factory", async() => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_IssuanceFactory.setupCost.call(), 0);
            assert.equal((await I_IssuanceFactory.getTypes.call())[0], 3);
            assert.equal(await I_IssuanceFactory.version.call(), "3.1.0");
            assert.equal(
                web3.utils.toAscii(await I_IssuanceFactory.name.call()).replace(/\u0000/g, ""),
                "Issuance",
                "Wrong Module added"
            );
            assert.equal(
                await I_IssuanceFactory.description.call(),
                "Issue tokens with the help of delegates",
                "Wrong Module added"
            );
            assert.equal(await I_IssuanceFactory.title.call(), "Issuance", "Wrong Module added");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_IssuanceFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "Issuance");
        });
    });

});