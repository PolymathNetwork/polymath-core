import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployPresaleSTOAndVerified } from "./helpers/createInstances"

const PreSaleSTOFactory = artifacts.require("./PreSaleSTOFactory.sol");
const PreSaleSTO = artifacts.require("./PreSaleSTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PreSaleSTO", accounts => {
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
    const initRegFee = web3.utils.toWei("250");
    let endTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const STOParameters = ["uint256"];

    before(async () => {
        // Accounts setup
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
            I_STRProxied
        ] = instances;

        // STEP 4: Deploy the PreSaleSTOFactory
        [I_PreSaleSTOFactory] = await deployPresaleSTOAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 5: Deploy the paid PresaleSTOFactory
        [P_PreSaleSTOFactory] = await deployPresaleSTOAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should fail to launch the STO due to endTime is 0", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [0]);

            await catchRevert(I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner }));
        });

        it("Should successfully attach the Paid STO factory with the security token", async () => {
            let snap_id = await takeSnapshot();
            endTime = latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);
            await I_PolyToken.getTokens(web3.utils.toWei("500"), I_SecurityToken.address);
            const tx = await I_SecurityToken.addModule(P_PreSaleSTOFactory.address, bytesSTO, web3.utils.toWei("500"), 0, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = PreSaleSTO.at(tx.logs[2].args._module);
            await revertToSnapshot(snap_id);
        });

        it("Should successfully attach the STO factory with the security token -- fail because signature is different", async () => {
            endTime = latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(["string"], ["hey"]);
            await catchRevert(
                I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner })
            );
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            endTime = latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);

            const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = PreSaleSTO.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            endTime = latestTime() + duration.days(30); // Start time will be 5000 seconds more than the latest time
            let bytesSTO = encodeModuleCall(STOParameters, [endTime]);

            const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0], stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = PreSaleSTO.at(tx.logs[2].args._module);
        });
    });

    describe("verify the data of STO", async () => {
        it("Should verify the configuration of the STO", async () => {
            assert.equal((await I_PreSaleSTO.endTime.call()).toNumber(), endTime, "STO Configuration doesn't set as expected");
        });

        it("Should get the permissions", async () => {
            let perm = await I_PreSaleSTO.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "PRE_SALE_ADMIN");
        });
    });

    describe("Buy tokens", async () => {
        it("Should allocate the tokens -- failed due to investor not on whitelist", async () => {
            await catchRevert(I_PreSaleSTO.allocateTokens(account_investor1, 1000, web3.utils.toWei("1", "ether"), 0));
        });

        it("Should Buy the tokens", async () => {
            fromTime = latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_investor1, fromTime, toTime, expiryTime, true, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(duration.days(1));
            await I_PreSaleSTO.allocateTokens(account_investor1, web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether"), 0, {
                from: account_issuer
            });

            assert.equal((await I_PreSaleSTO.getRaised.call(0)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);
            console.log(await I_PreSaleSTO.getNumberInvestors.call());
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 1);
            // assert.isTrue(false);
        });

        it("Should allocate the tokens --failed because of amount is 0", async() => {
            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, 0, web3.utils.toWei("1", "ether"), 0, {
                    from: account_issuer
                })
            );
        })

        it("Should allocate the tokens -- failed due to msg.sender is not pre sale admin", async () => {
            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether"), 0, {
                    from: account_fundsReceiver
                })
            );
        });

        it("Should allocate tokens to multiple investors", async () => {
            fromTime = latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx1 = await I_GeneralTransferManager.modifyWhitelist(account_investor2, fromTime, toTime, expiryTime, true, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx1.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

            // Add the Investor in to the whitelist
            let tx2 = await I_GeneralTransferManager.modifyWhitelist(account_investor3, fromTime, toTime, expiryTime, true, {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(tx2.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");

            await I_PreSaleSTO.allocateTokensMulti(
                [account_investor2, account_investor3],
                [web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether")],
                [0, 0],
                [web3.utils.toWei("1000", "ether"), web3.utils.toWei("1000", "ether")],
                { from: account_issuer }
            );

            assert.equal((await I_PreSaleSTO.getRaised.call(1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 2000);
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 3);
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async() => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2],
                    [web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether")],
                    [0, 0],
                    [web3.utils.toWei("1000", "ether"), web3.utils.toWei("1000", "ether")],
                    { from: account_issuer }
                )
            );
        })

        it("Should successfully mint multiple tokens -- failed because array mismatch", async() => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether")],
                    [0],
                    [web3.utils.toWei("1000", "ether"), web3.utils.toWei("1000", "ether")],
                    { from: account_issuer }
                )
            );
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async() => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether")],
                    [0,0],
                    [web3.utils.toWei("1000", "ether")],
                    { from: account_issuer }
                )
            );
        });

        it("Should successfully mint multiple tokens -- failed because array mismatch", async() => {
            await catchRevert(
                I_PreSaleSTO.allocateTokensMulti(
                    [account_investor2, account_investor3],
                    [web3.utils.toWei("1", "ether"), web3.utils.toWei("1", "ether")],
                    [0],
                    [web3.utils.toWei("1000", "ether"), web3.utils.toWei("1000", "ether")],
                    { from: account_issuer }
                )
            );
        });

        it("Should buy some more tokens to previous investor", async() => {
            await I_PreSaleSTO.allocateTokens(account_investor1, web3.utils.toWei("1000", "ether"), web3.utils.toWei("1", "ether"), 0, { from: account_issuer });
            // No change in the investor count
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 3);
        })

        it("Should failed at the time of buying the tokens -- Because STO has ended", async () => {
            await increaseTime(duration.days(100)); // increased beyond the end time of the STO

            await catchRevert(
                I_PreSaleSTO.allocateTokens(account_investor1, 1000, web3.utils.toWei("1", "ether"), 0, { from: account_issuer })
            );
        });
    });

    describe("Reclaim poly sent to STO by mistake", async () => {
        it("Should fail to reclaim POLY because token contract address is 0 address", async () => {
            let value = web3.utils.toWei("100", "ether");
            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });

            await catchRevert(I_PreSaleSTO.reclaimERC20(address_zero, { from: token_owner }));
        });

        it("Should successfully reclaim POLY", async () => {
            let value = web3.utils.toWei("100", "ether");
            await I_PolyToken.getTokens(value, account_investor1);
            let initInvestorBalance = await I_PolyToken.balanceOf(account_investor1);
            let initOwnerBalance = await I_PolyToken.balanceOf(token_owner);
            let initContractBalance = await I_PolyToken.balanceOf(I_PreSaleSTO.address);

            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });
            await I_PreSaleSTO.reclaimERC20(I_PolyToken.address, { from: token_owner });
            assert.equal(
                (await I_PolyToken.balanceOf(account_investor1)).toNumber(),
                initInvestorBalance.sub(value).toNumber(),
                "tokens are not transferred out from investor account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(token_owner)).toNumber(),
                initOwnerBalance
                    .add(value)
                    .add(initContractBalance)
                    .toNumber(),
                "tokens are not added to the owner account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(I_PreSaleSTO.address)).toNumber(),
                0,
                "tokens are not trandfered out from STO contract"
            );
        });

        it("Should get the the tokens sold", async() => {
            let _tokensSold = await I_PreSaleSTO.getTokensSold.call();
            console.log(_tokensSold);
        })
    });

    describe("Test cases for the PresaleSTOFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_PreSaleSTOFactory.getSetupCost.call(), 0);
            assert.equal((await I_PreSaleSTOFactory.getTypes.call())[0], 3);
            assert.equal(
                web3.utils.toAscii(await I_PreSaleSTOFactory.getName.call()).replace(/\u0000/g, ""),
                "PreSaleSTO",
                "Wrong Module added"
            );
            assert.equal(
                await I_PreSaleSTOFactory.description.call(),
                "Allows Issuer to configure pre-sale token allocations",
                "Wrong Module added"
            );
            assert.equal(await I_PreSaleSTOFactory.title.call(), "PreSale STO", "Wrong Module added");
            assert.equal(
                await I_PreSaleSTOFactory.getInstructions.call(),
                "Configure and track pre-sale token allocations",
                "Wrong Module added"
            );
            let tags = await I_PreSaleSTOFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Presale");
        });
    });
});
