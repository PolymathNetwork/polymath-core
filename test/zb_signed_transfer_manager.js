import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { getSignSTMData } from "./helpers/signData";
import { pk } from "./helpers/testprivateKey";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deploySignedTMAndVerifyed} from "./helpers/createInstances";

const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const SignedTransferManager = artifacts.require("./SignedTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("SignedTransferManager", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let token_owner_pk;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_SignedTransferManagerFactory;
    let P_SignedTransferManagerFactory;
    let I_SignedTransferManager;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const address_zero = "0x0000000000000000000000000000000000000000";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("1000");

    let currentTime;
    let validFrom = new BN(0);

    before(async () => {
        // Accounts setup
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_investor3 = accounts[6];
        account_investor4 = accounts[7];

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
            I_STGetter
        ] = instances;

        // STEP 2: Deploy the GeneralPermissionManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, new BN(0));
        // STEP 3: Deploy the SignedTransferManagerFactory
        [I_SignedTransferManagerFactory] = await deploySignedTMAndVerifyed(account_polymath, I_MRProxied, new BN(0));
        // STEP 4: Deploy the Paid SignedTransferManagerFactory
        [P_SignedTransferManagerFactory] = await deploySignedTMAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        ManualApprovalTransferManagerFactory: ${I_SignedTransferManagerFactory.address}


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
    });


    describe("signed transfer manager tests", async () => {

        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: account_issuer
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
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("2", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });


        it("Should successfully attach the SignedTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_SignedTransferManagerFactory.address, "0x0",new BN(0),new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "SignedTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "SignedTransferManager",
                "SignedTransferManager module was not added"
            );
            I_SignedTransferManager = await SignedTransferManager.at(tx.logs[2].args._module);
        });

        it("should fail to transfer because transaction is not verified yet.", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor2, web3.utils.toWei("1", "ether"), { from: account_investor1 }));
        });

        it("Should successfully attach the permission manager factory with the security token", async () => {
            console.log((await I_GeneralPermissionManagerFactory.setupCostInPoly.call()).toString());
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "GeneralPermissionManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManager module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("should allow to invalidate siganture if sender is the signer and is in the signer list", async () => {
            let oneeth = new BN(web3.utils.toWei("1", "ether"));
            let signer = web3.eth.accounts.create();
            await web3.eth.personal.importRawKey(signer.privateKey, "");
            await web3.eth.personal.unlockAccount(signer.address, "", 6000);
            await web3.eth.sendTransaction({ from: token_owner, to: signer.address, value: oneeth });

            let log = await I_GeneralPermissionManager.addDelegate(signer.address, web3.utils.fromAscii("My details"), { from: token_owner });
            assert.equal(log.logs[0].args._delegate, signer.address);
            await I_GeneralPermissionManager.changePermission(signer.address, I_SignedTransferManager.address, web3.utils.fromAscii("OPERATOR"), true, {
                from: token_owner
            });

            let nonce = new BN(10);
            let expiry = new BN(currentTime.add(new BN(duration.days(100))));
            let data = await getSignSTMData(
                I_SignedTransferManager.address,
                nonce,
                validFrom,
                expiry,
                account_investor1,
                account_investor2,
                oneeth,
                signer.privateKey
            );

            assert.equal(await I_SignedTransferManager.checkSignatureValidity(data), true);
            await I_SignedTransferManager.invalidateSignature(account_investor1, account_investor2, oneeth, data, {from: signer.address});
            assert.equal(await I_SignedTransferManager.checkSignatureValidity(data), false);
        });

        it("should allow transfer with valid sig", async () => {
            let signer = web3.eth.accounts.create();
            let log = await I_GeneralPermissionManager.addDelegate(signer.address, web3.utils.fromAscii("My details"), { from: token_owner });
            assert.equal(log.logs[0].args._delegate, signer.address);
            await I_GeneralPermissionManager.changePermission(signer.address, I_SignedTransferManager.address, web3.utils.fromAscii("OPERATOR"), true, {
                from: token_owner
            });
            let oneeth = new BN(web3.utils.toWei("1", "ether"));
            let nonce = new BN(10);
            let expiry = new BN(currentTime.add(new BN(duration.days(100))));
            let data = await getSignSTMData(
                I_SignedTransferManager.address,
                nonce,
                validFrom,
                expiry,
                account_investor1,
                account_investor2,
                oneeth,
                signer.privateKey
            );

            let balance11 = await I_SecurityToken.balanceOf(account_investor1);
            let balance21 = await I_SecurityToken.balanceOf(account_investor2);

            assert.equal(await I_SignedTransferManager.checkSignatureValidity(data), true);

            await I_SecurityToken.transferWithData(account_investor2, oneeth, data, {from: account_investor1});

            assert.equal(await I_SignedTransferManager.checkSignatureValidity(data), false);
            await catchRevert(I_SecurityToken.transferWithData(account_investor2, oneeth, data, {from: account_investor1}));

            assert.equal(balance11.sub(oneeth).toString(), (await I_SecurityToken.balanceOf(account_investor1)).toString());
            assert.equal(balance21.add(oneeth).toString(), (await I_SecurityToken.balanceOf(account_investor2)).toString());


        });

        it("should not allow transfer if the signer is not on the signer list", async () => {
            let signer = web3.eth.accounts.create();
            let oneeth = new BN(web3.utils.toWei("1", "ether"));
            let nonce = new BN(10);
            let expiry = new BN(currentTime.add(new BN(duration.days(100))));
            let data = await getSignSTMData(
                I_SignedTransferManager.address,
                nonce,
                validFrom,
                expiry,
                account_investor1,
                account_investor2,
                oneeth,
                signer.privateKey
            );

            await catchRevert(I_SecurityToken.transferWithData(account_investor2, oneeth, data, {from: account_investor1}));
        });
    });
});
