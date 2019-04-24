import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployRestrictedPartialSaleTMAndVerifyed, deployDummySTOAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const RestrictedPartialSaleTMFactory = artifacts.require("./RestrictedPartialSaleTMFactory.sol");
const RestrictedPartialSaleTM = artifacts.require("./RestrictedPartialSaleTM");
const DummySTO = artifacts.require("DummySTO.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("RestrictedPartialSaleTM", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_treasury;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_RestrictedPartialSaleTM;
    let I_RestrictedPartialSaleTMFactory;
    let P_RestrictedPartialSaleTMFactory
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_DummySTO;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("1000");
    let bytesSale;
    
    async function currentTime() {
        return new BN(await latestTime());
    }

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        account_treasury = accounts[5];
        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[6];

        bytesSale = encodeModuleCall(["address"], [account_treasury]);

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

        // STEP 2: Deploy the RestrictedPartialSaleTM
        [I_RestrictedPartialSaleTMFactory] = await deployRestrictedPartialSaleTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy Paid the RestrictedPartialSaleTM
        [P_RestrictedPartialSaleTMFactory] = await deployRestrictedPartialSaleTMAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));

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
        RestrictedPartialSaleTM:           ${I_RestrictedPartialSaleTMFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("50000", "ether")), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, new BN(initRegFee), { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should fali to attach the RestrictedPartialSaleTM factory with the security token -- Insufficent balance", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("500", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_RestrictedPartialSaleTMFactory.address, bytesSale, new BN(web3.utils.toWei("500", "ether")), new BN(0), {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the paid version of RestrictedPartialSaleTM factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("5000", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_RestrictedPartialSaleTMFactory.address,
                bytesSale,
                new BN(web3.utils.toWei("5000", "ether")),
                new BN(0),
                false,
                { 
                    from: token_owner 
                }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "RestrictedPartialSaleTM factory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "RestrictedPartialSaleTM",
                "RestrictedPartialSaleTM module was not added"
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the RestrictedPartialSaleTM with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_RestrictedPartialSaleTMFactory.address, bytesSale, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "RestrictedPartialSaleTMFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "RestrictedPartialSaleTM",
                "RestrictedPartialSaleTM module was not added"
            );
            I_RestrictedPartialSaleTM = await RestrictedPartialSaleTM.at(tx.logs[2].args._module);
        });
    });

    describe("Whitelist the addresses", async () => {

        it("Should whitelist the investor 1 & buy the tokens", async () => {
            // Add the Investor in to the whitelist
            let latestTime = await currentTime();
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                latestTime,
                latestTime,
                latestTime + duration.days(10),
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
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf.call(account_investor1)).toString(), web3.utils.toWei("1", "ether"));
        });

        it("Should whitelist the investor 2 & buy the tokens", async () => {
            // Add the Investor in to the whitelist
            let latestTime = await currentTime();
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                latestTime,
                latestTime,
                latestTime + duration.days(10),
                {
                    from: account_issuer
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, web3.utils.toWei("2", "ether"), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf.call(account_investor2)).toString(), web3.utils.toWei("2", "ether"));
        });

        it("Should successfully add the STO with the ST to check the issuance", async() => {
            let latestTime = await currentTime();
            let bytesSTO = encodeModuleCall(
                ["uint256", "uint256", "uint256", "string"],
                [latestTime, latestTime + duration.days(20), web3.utils.toWei("1000000"), "This is dummy sto"]
            );
            let I_DummySTOFactory;
            [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, new BN(0));
            let tx = await I_SecurityToken.addModule(
                        I_DummySTOFactory.address,
                        bytesSTO,
                        new BN(web3.utils.toWei("80000", "ether")),
                        new BN(0),
                        false,
                        {
                            from: token_owner
                        }
                    );
            assert.equal(tx.logs[2].args._types[0].toNumber(), stoKey, "DummySTOFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "DummySTO",
                "DummySTO module was not added"
            );
            I_DummySTO = await DummySTO.at(tx.logs[2].args._module);
        });

        it("Should whitelist the investor 3 and invest some ETH in STO to buy some tokens", async() => {
            let latestTime = await currentTime();
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                latestTime,
                latestTime,
                latestTime + duration.days(100),
                {
                    from: account_issuer
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            await I_DummySTO.generateTokens(account_investor3, new BN(web3.utils.toWei("1000")), {from: token_owner});

            assert.equal((await I_SecurityToken.balanceOf.call(account_investor3)).toString(), web3.utils.toWei("1000"));
        });

        it("Should failed to transafer the partial token balance", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("10")), {from: account_investor3})
            );
        });

        it("Should pause the RestrictedPartialSaleTM and sale partial balance", async() => {
            await I_RestrictedPartialSaleTM.pause({from: token_owner});
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("10")), {from: account_investor3});
            assert.equal((await I_SecurityToken.balanceOf.call(account_investor2)).toString(), web3.utils.toWei("12"));
            await I_RestrictedPartialSaleTM.unpause({from: token_owner});
        });

        it("Should whitelist the treasury wallet address", async() => {
            let latestTime = await currentTime();
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_treasury,
                latestTime,
                latestTime,
                latestTime + duration.days(100),
                {
                    from: account_issuer
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_treasury.toLowerCase(),
                "Failed in adding the account_treasury in whitelist"
            );

            // Mint some tokens to treasury wallet
            await I_SecurityToken.issue(account_treasury, new BN(web3.utils.toWei("1000000")), "0x0", { from: token_owner });

        });

        it("Should send partial balance successfully", async() => {
            let exemptedAddress = await I_RestrictedPartialSaleTM.getExemptAddresses.call();
            assert.equal(exemptedAddress[0], account_treasury);
            let earlierBalance = web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString());
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("500")), {from: account_treasury});
            assert.equal(
                web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString()),
                parseInt(earlierBalance) + 500
            );
        });
    });

    describe("Test for the exemption list", async() => {

        it("Should fail to add investor in the exemption list -- wallet is zero address", async() => {
            await catchRevert(
                I_RestrictedPartialSaleTM.changeExemptWalletList("0x0000000000000000000000000000000000000000", true, {from: token_owner})
            );
        });

        it("Should fail to add investor in the exemption list -- invalid msg.sender", async() => {
            await catchRevert(
                I_RestrictedPartialSaleTM.changeExemptWalletList(account_investor2, true, {from: account_polymath})
            );
        });

        it("Should add the investor address in the exemption list", async() => {
            await I_RestrictedPartialSaleTM.changeExemptWalletList(account_investor2, true, {from: token_owner});
            let exemptedAddress = await I_RestrictedPartialSaleTM.getExemptAddresses.call();
            assert.equal(exemptedAddress[0], account_treasury);
            assert.equal(exemptedAddress[1], account_investor2);
        });

        it("Should fail to add investor in the exemption list again", async() => {
            await catchRevert(
                I_RestrictedPartialSaleTM.changeExemptWalletList(account_investor2, true, {from: token_owner})
            );
        });

        it("Should sale the tokens freely", async() => {
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("5")), {from: account_investor2});
            assert.equal(
                (await I_SecurityToken.balanceOf.call(account_investor2)).toString(),
                web3.utils.toWei("7")
            );
        });

        it("Should add multiple addresses in the exemption list -- length mismatch", async() => {
            await catchRevert( 
                I_RestrictedPartialSaleTM.changeExemptWalletListMulti([account_investor3], [true, true], {from: token_owner})
            );
        });

        it("Should add multiple addresses in the exemption list", async() => {
            await I_RestrictedPartialSaleTM.changeExemptWalletListMulti([account_investor1, account_investor3], [true, true], {from: token_owner});
            let exemptedAddress = await I_RestrictedPartialSaleTM.getExemptAddresses.call();
            assert.equal(exemptedAddress.length, 4);
            assert.equal(exemptedAddress[0], account_treasury);
            assert.equal(exemptedAddress[1], account_investor2);
            assert.equal(exemptedAddress[2], account_investor1);
            assert.equal(exemptedAddress[3], account_investor3);
        });

        it("Should sale tokens freely", async() => {
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1")), {from: account_investor2});
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("1")), {from: account_investor2});
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1")), {from: account_investor1});
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("1")), {from: account_investor1});
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1")), {from: account_investor3});
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1")), {from: account_investor3});
        });

        it("Should change the exemption list", async() => {
            await I_RestrictedPartialSaleTM.changeExemptWalletList(account_investor2, false, {from: token_owner});
            let exemptedAddress = await I_RestrictedPartialSaleTM.getExemptAddresses.call();
            assert.equal(exemptedAddress.length, 3);
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1")), {from: account_investor2})
            );
        });

        it("Should change the exemption list multi", async() => {
            await I_RestrictedPartialSaleTM.changeExemptWalletListMulti([account_investor3, account_investor1], [false, false], {from: token_owner});
            let exemptedAddress = await I_RestrictedPartialSaleTM.getExemptAddresses.call();
            assert.equal(exemptedAddress.length, 1);
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1")), {from: account_investor3})
            );
        });

        it("Should fail to sale partial balance", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3})
            );
        });
    });

    describe("Test cases for the RestrictedPartialSaleTMFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal((await I_RestrictedPartialSaleTMFactory.setupCost.call()).toNumber(), 0);
            assert.equal((await I_RestrictedPartialSaleTMFactory.types.call())[0], 2);
            assert.equal(await I_RestrictedPartialSaleTMFactory.version.call(), "3.0.0");
            assert.equal(
                web3.utils.toAscii(await I_RestrictedPartialSaleTMFactory.name.call()).replace(/\u0000/g, ""),
                "RestrictedPartialSaleTM",
                "Wrong Module added"
            );
            assert.equal(
                await I_RestrictedPartialSaleTMFactory.description.call(),
                "TM will not allow investors to transact partial balance of the investors",
                "Wrong Module added"
            );
            assert.equal(await I_RestrictedPartialSaleTMFactory.title.call(), "Restricted Partial Sale Transfer Manager", "Wrong Module added");
            let tags = await I_RestrictedPartialSaleTMFactory.tags.call();
            assert.equal(tags.length, 3);
        });
    });

});
