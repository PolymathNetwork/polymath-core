import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployPresaleSTOAndVerified } from "./helpers/createInstances";

const PreSaleSTOFactory = artifacts.require("./PreSaleSTOFactory.sol");
const PreSaleSTO = artifacts.require("./PreSaleSTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PreSaleSTO", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_fundsReceiver;

    let balanceOfReceiver;
    let message = "Transaction Should Fail!";
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_PreSaleSTOFactory;
    let P_PreSaleSTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
    let I_PreSaleSTO;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details for funds raise Type ETH
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // SecurityToken Details for funds raise Type POLY
    const P_name = "Team Poly";
    const P_symbol = "PAS";
    const P_tokenDetails = "This is equity type of issuance";
    const P_decimals = 18;

    // Module key
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));
    let endTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";
    const STOParameters = ["uint256"];

    let currentTime;

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[4];
        account_investor2 = accounts[3];
        account_investor3 = accounts[5];
        account_fundsReceiver = accounts[2];
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

        // STEP 4: Deploy the PreSaleSTOFactory
        [I_PreSaleSTOFactory] = await deployPresaleSTOAndVerified(account_polymath, I_MRProxied, 0);
        // STEP 5: Deploy the paid PresaleSTOFactory
        [P_PreSaleSTOFactory] = await deployPresaleSTOAndVerified(account_polymath, I_MRProxied, 0);

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

        PreSaleSTOFactory:                 ${I_PreSaleSTOFactory.address}
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

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should fail to launch the STO due to endTime is 0", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [0]);

            await catchRevert(I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner }));
        });

        it("Should successfully attach the Paid STO factory (archived) with the security token", async () => {
            let snap_id = await takeSnapshot();
            endTime = await latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("500")), I_SecurityToken.address);
            const tx = await I_SecurityToken.addModule(P_PreSaleSTOFactory.address, bytesSTO, new BN(web3.utils.toWei("500")), new BN(0), false, {
                from: token_owner
            });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = await PreSaleSTO.at(tx.logs[2].args._module);
            await revertToSnapshot(snap_id);
        });

        it("Should successfully attach the STO factory with the security token -- fail because signature is different", async () => {
            endTime = await latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(["string"], ["hey"]);
            await catchRevert(I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner }));
        });

        it("Should successfully attach the STO factory (archived) with the security token", async () => {
            endTime = await latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);

            const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, new BN(0), new BN(0), true, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = await PreSaleSTO.at(tx.logs[2].args._module);
            let info = await stGetter.getModule.call(I_PreSaleSTO.address);
            assert.equal(info[3], true);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            endTime = await latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);

            const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, new BN(0), new BN(0), true, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = await PreSaleSTO.at(tx.logs[2].args._module);
            let info = await stGetter.getModule.call(I_PreSaleSTO.address);
            assert.equal(info[3], true);

        });
    });

    describe("verify the data of STO", async () => {
        it("Should verify the configuration of the STO", async () => {
            assert.equal((await I_PreSaleSTO.endTime.call()).toNumber(), endTime, "STO Configuration doesn't set as expected");
        });

        it("Should get the permissions", async () => {
            let perm = await I_PreSaleSTO.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
        });
    });

    describe("Buy tokens", async () => {

        it("Should Buy the tokens", async () => {
            fromTime = await latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor1, fromTime, toTime, expiryTime, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(duration.days(1));
            // Fail as module is archived
            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether")), new BN(0), {
                    from: account_issuer
                })
            );
            await I_SecurityToken.unarchiveModule(I_PreSaleSTO.address, {from: token_owner});
            let info = await stGetter.getModule.call(I_PreSaleSTO.address);
            assert.equal(info[3], false);

            //Fail as investor is not on whitelist
            await catchRevert(I_PreSaleSTO.allocateTokens(account_investor2, 1000, new BN(web3.utils.toWei("1", "ether")), 0));
            await I_PreSaleSTO.allocateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether")), new BN(0), {
                from: account_issuer
            });
            assert.equal((await I_PreSaleSTO.getRaised.call(0)).div(new BN(10).pow(new BN(18))).toNumber(), 1);
            console.log(await I_PreSaleSTO.getNumberInvestors.call());
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 1);
        });

        it("Should allocate the tokens --failed because of amount is 0", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, new BN(0), new BN(web3.utils.toWei("1", "ether")), new BN(0), {
                    from: account_issuer
                })
            );
        });

        it("Should allocate the tokens -- failed due to msg.sender is not pre sale admin", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether")), new BN(0), {
                    from: account_fundsReceiver
                })
            );
        });

        it("Should allocate tokens to multiple investors", async () => {
            fromTime = await latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx1 = await I_GeneralTransferManager.modifyKYCData(account_investor2, fromTime, toTime, expiryTime, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx1.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

            // Add the Investor in to the whitelist
            let tx2 = await I_GeneralTransferManager.modifyKYCData(account_investor3, fromTime, toTime, expiryTime, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx2.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");

            await I_PreSaleSTO.allocateTokensMulti(
                [account_investor2, account_investor3],
                [new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether"))],
                [0, 0],
                [new BN(web3.utils.toWei("1000", "ether")), new BN(web3.utils.toWei("1000", "ether"))],
                { from: account_issuer }
            );

            assert.equal((await I_PreSaleSTO.getRaised.call(1)).div(new BN(10).pow(new BN(18))).toNumber(), 2000);
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 3);
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2],
                    [new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether"))],
                    [0, 0],
                    [new BN(web3.utils.toWei("1000", "ether")), new BN(web3.utils.toWei("1000", "ether"))],
                    { from: account_issuer }
                )
            );
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether"))],
                    [0],
                    [new BN(web3.utils.toWei("1000", "ether")), new BN(web3.utils.toWei("1000", "ether"))],
                    { from: account_issuer }
                )
            );
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether"))],
                    [0, 0],
                    [new BN(web3.utils.toWei("1000", "ether"))],
                    { from: account_issuer }
                )
            );
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [new BN(web3.utils.toWei("1", "ether")), new BN(web3.utils.toWei("1", "ether"))],
                    [0],
                    [new BN(web3.utils.toWei("1000", "ether")), new BN(web3.utils.toWei("1000", "ether"))],
                    { from: account_issuer }
                )
            );
        });

        it("Should buy some more tokens to previous investor", async () => {
            await I_PreSaleSTO.allocateTokens(account_investor1, new BN(web3.utils.toWei("1000", "ether")), new BN(web3.utils.toWei("1", "ether")), new BN(0), {
                from: account_issuer
            });
            // No change in the investor count
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 3);
        });

        it("Should failed at the time of buying the tokens -- Because STO has ended", async () => {
            await increaseTime(duration.days(100)); // increased beyond the end time of the STO

            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, 1000, new BN(web3.utils.toWei("1", "ether")), new BN(0), { from: account_issuer })
            );
        });
    });

    describe("Reclaim poly sent to STO by mistake", async () => {
        it("Should fail to reclaim POLY because token contract address is 0 address", async () => {
            let value = new BN(web3.utils.toWei("100", "ether"));
            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });

            await catchRevert(I_PreSaleSTO.reclaimERC20(address_zero, { from: token_owner }));
        });

        it("Should successfully reclaim POLY", async () => {
            let value = new BN(web3.utils.toWei("100", "ether"));
            await I_PolyToken.getTokens(value, account_investor1);
            let initInvestorBalance = await I_PolyToken.balanceOf(account_investor1);
            let initOwnerBalance = await I_PolyToken.balanceOf(token_owner);
            let initContractBalance = await I_PolyToken.balanceOf(I_PreSaleSTO.address);

            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });
            await I_PreSaleSTO.reclaimERC20(I_PolyToken.address, { from: token_owner });
            assert.equal(
                (await I_PolyToken.balanceOf(account_investor1)).toString(),
                initInvestorBalance.sub(value).toString(),
                "tokens are not transferred out from investor account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(token_owner)).toString(),
                initOwnerBalance
                    .add(value)
                    .add(initContractBalance)
                    .toString(),
                "tokens are not added to the owner account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(I_PreSaleSTO.address)).toNumber(),
                new BN(0).toNumber(),
                "tokens are not trandfered out from STO contract"
            );
        });

        it("Should get the the tokens sold", async () => {
            let _tokensSold = await I_PreSaleSTO.getTokensSold.call();
            console.log(_tokensSold);
        });
    });

    describe("Test cases for the PresaleSTOFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_PreSaleSTOFactory.setupCost.call(), 0);
            assert.equal((await I_PreSaleSTOFactory.getTypes.call())[0], 3);
            assert.equal(
                web3.utils.toAscii(await I_PreSaleSTOFactory.name.call()).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "Wrong Module added"
            );
            assert.equal(
                await I_PreSaleSTOFactory.description.call(),
                "Allows Issuer to configure pre-sale token allocations",
                "Wrong Module added"
            );
            assert.equal(await I_PreSaleSTOFactory.title.call(), "PreSale STO", "Wrong Module added");
            let tags = await I_PreSaleSTOFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "PreSale");
        });
    });
});
