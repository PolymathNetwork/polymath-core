import latestTime from "./helpers/latestTime";
import { duration, ensureException, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployCappedSTOAndVerifyed, deployDummySTOAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const STFactory = artifacts.require("./STFactory.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
let toBN = Web3.utils.toBN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port
let ETH = 0;
let POLY = 1;
let DAI = 2;

contract("CappedSTO", async (accounts) => {
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
    let P_fromTime;
    let P_toTime;
    let P_expiryTime;

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
    let I_CappedSTOFactory;
    let I_STFactory;
    let I_SecurityToken_ETH;
    let I_SecurityToken_POLY;
    let I_DummySTO;
    let I_CappedSTO_Array_ETH = [];
    let I_CappedSTO_Array_POLY = [];
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STRGetter;
    let I_STGetter;
    let stGetter_eth;
    let stGetter_poly;
    let pauseTime;
    let treasury_wallet;

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

    // Capped STO details
    let startTime_ETH1;
    let endTime_ETH1;
    let startTime_ETH2;
    let endTime_ETH2;
    const cap = new BN(web3.utils.toWei("10000"));
    const rate = new BN(web3.utils.toWei("1000"));
    const E_fundRaiseType = 0;
    const address_zero = "0x0000000000000000000000000000000000000000";

    let startTime_POLY1;
    let endTime_POLY1;
    let startTime_POLY2;
    let endTime_POLY2;
    let blockNo;
    const P_cap = new BN(web3.utils.toWei("50000"));
    const P_fundRaiseType = 1;
    const P_rate = new BN(web3.utils.toWei("5"));
    const cappedSTOSetupCost = new BN(web3.utils.toWei("20000", "ether"));
    const cappedSTOSetupCostPOLY = new BN(web3.utils.toWei("80000", "ether"));
    const maxCost = cappedSTOSetupCostPOLY;
    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];

    let currentTime;

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[4];
        account_investor2 = accounts[3];
        account_investor3 = accounts[5];
        account_fundsReceiver = accounts[2];
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
        // STEP 6: Deploy the CappedSTOFactory

        [I_CappedSTOFactory] = await deployCappedSTOAndVerifyed(account_polymath, I_MRProxied, cappedSTOSetupCost);

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

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
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
            let t = await I_STRGetter.getSTFactoryAddress.call();
            console.log(t);
            let foo = await STFactory.at(t);
            console.log(await foo.polymathRegistry.call());

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, treasury_wallet, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken_ETH = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter_eth = await STGetter.at(I_SecurityToken_ETH.address);
            assert.equal(await stGetter_eth.getTreasuryWallet.call(), treasury_wallet, "Incorrect wallet set")
            const log = (await I_SecurityToken_ETH.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter_eth.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should mint the tokens before attaching the STO", async () => {
            await catchRevert(I_SecurityToken_ETH.issue(address_zero, new BN(new BN(web3.utils.toWei("1"))), "0x0", { from: token_owner }));
        });

        it("Should fail to launch the STO due to security token doesn't have the sufficient POLY", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            await I_PolyToken.getTokens(cappedSTOSetupCostPOLY, token_owner);

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, new BN(0), [E_fundRaiseType], account_fundsReceiver]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due to rate is 0", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, cappedSTOSetupCostPOLY, { from: token_owner });

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, new BN(0), [E_fundRaiseType], account_fundsReceiver]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due funds reciever account 0x", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, [E_fundRaiseType], address_zero]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due to raise type of 0 length", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, [], account_fundsReceiver]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due to startTime > endTime", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [
                Math.floor(Date.now() / 1000 + 100000),
                Math.floor(Date.now() / 1000 + 1000),
                cap,
                rate,
                [E_fundRaiseType],
                account_fundsReceiver
            ]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due to cap is of 0 securityToken", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, new BN(0), rate, [E_fundRaiseType], account_fundsReceiver]);

            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should fail to launch the STO due to different value incompare to getInitFunction", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(["uint256", "uint256", "uint256"], [startTime, endTime, 0]);
            await catchRevert(I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner }));
        });

        it("Should successfully attach the STO module to the security token", async () => {
            startTime_ETH1 = await latestTime() + duration.days(1);
            endTime_ETH1 = startTime_ETH1 + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [
                startTime_ETH1,
                endTime_ETH1,
                cap,
                rate,
                [E_fundRaiseType],
                account_fundsReceiver
            ]);
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
            I_CappedSTO_Array_ETH.push(await CappedSTO.at(tx.logs[3].args._module));
        });

        it("Should call the configure function -- fail because of the bad owner", async () => {
            await catchRevert(
                I_CappedSTO_Array_ETH[0].configure(startTime_ETH1, endTime_ETH1, cap, rate, [E_fundRaiseType], account_fundsReceiver, {
                    from: account_polymath
                })
            );
        });
    });

    describe("verify the data of STO", async () => {
        it("Should verify the configuration of the STO", async () => {
            assert.equal(await I_CappedSTO_Array_ETH[0].startTime(), startTime_ETH1, "1STO Configuration doesn't set as expected");
            assert.equal(await I_CappedSTO_Array_ETH[0].endTime(), endTime_ETH1, "2STO Configuration doesn't set as expected");
            assert.equal((await I_CappedSTO_Array_ETH[0].cap()).toString(), cap.toString(), "3STO Configuration doesn't set as expected");
            assert.equal((await I_CappedSTO_Array_ETH[0].rate()).toString(), rate.toString(), "4STO Configuration doesn't set as expected");
            assert.equal(
                await I_CappedSTO_Array_ETH[0].fundRaiseTypes.call(E_fundRaiseType),
                true,
                "STO Configuration doesn't set as expected"
            );
        });
    });

    describe("Buy tokens", async () => {
        it("Should buy the tokens -- failed due to startTime is greater than Current time", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[0].buyTokens(account_investor1, { from: account_investor1, value: new BN(web3.utils.toWei("1", "ether")) }));
            await increaseTime(duration.days(1));
        });

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[0].buyTokens(account_investor1, { from: account_investor1, value: new BN(web3.utils.toWei("1", "ether")) }));

            blockNo = await latestBlock();
            fromTime = await latestTime();
            toTime = await latestTime() + duration.days(15);
            expiryTime = toTime + duration.days(100);
            P_fromTime = fromTime + duration.days(1);
            P_toTime = P_fromTime + duration.days(50);
            P_expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor1, fromTime, toTime, expiryTime, {
                from: account_issuer
            });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
        });

        it("Should buy the tokens -- failed due to invested amount is zero", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[0].buyTokens(account_investor1, { from: account_investor1, value: new BN(web3.utils.toWei("0", "ether")) }));
        });

        it("Should Buy the tokens", async () => {

            balanceOfReceiver = new BN(await web3.eth.getBalance(account_fundsReceiver));

            await I_CappedSTO_Array_ETH[0].buyTokens(account_investor1, {
                from: account_investor1,
                value: web3.utils.toWei("1", "ether")
            });

            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).div(new BN(10).pow(new BN(18))).toNumber(), 1);
            assert.equal(await I_CappedSTO_Array_ETH[0].investorCount.call(), 1);
            assert.equal((await I_SecurityToken_ETH.balanceOf(account_investor1)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);
            assert.equal((await I_CappedSTO_Array_ETH[0].getTokensSold.call()).div(new BN(10).pow(new BN(18))).toNumber(), 1000);
        });

        it("Verification of the event Token Purchase", async () => {
            const log = (await I_CappedSTO_Array_ETH[0].getPastEvents('TokenPurchase', {filter: {from: blockNo}}))[0];
            assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
            assert.equal(log.args.amount.div(new BN(10).pow(new BN(18))).toNumber(), 1000, "Wrong No. token get dilivered");
        });

        it("Should fail to buy the tokens -- Because fundRaiseType is ETH not POLY", async () => {
            await I_PolyToken.getTokens(new BN(new BN(web3.utils.toWei("500"))), account_investor1);
            await I_PolyToken.approve(I_CappedSTO_Array_ETH[0].address, new BN(new BN(web3.utils.toWei("500"))), { from: account_investor1 });
            await catchRevert(I_CappedSTO_Array_ETH[0].buyTokensWithPoly(new BN(new BN(web3.utils.toWei("500"))), { from: account_investor1 }));
        });

        it("Should pause the STO -- Failed due to wrong msg.sender", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[0].pause({ from: account_investor1 }));
        });

        it("Should pause the STO", async () => {
            pauseTime = await latestTime();
            let tx = await I_CappedSTO_Array_ETH[0].pause({ from: account_issuer });
            assert.isTrue(await I_CappedSTO_Array_ETH[0].paused.call());
        });

        it("Should fail to buy the tokens after pausing the STO", async () => {
            await catchRevert(
                web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
                    gas: 2100000,
                    value: new BN(web3.utils.toWei("1", "ether"))
                })
            );
        });

        it("Should unpause the STO -- Failed due to wrong msg.sender", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[0].unpause({ from: account_investor1 }));
        });

        it("Should unpause the STO", async () => {
            let tx = await I_CappedSTO_Array_ETH[0].unpause({ from: account_issuer });
            assert.isFalse(await I_CappedSTO_Array_ETH[0].paused.call());
        });

        it("Should buy the granular unit tokens and refund pending amount", async () => {
            await I_SecurityToken_ETH.changeGranularity(new BN(10).pow(new BN(21)), { from: token_owner });
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                fromTime,
                toTime + duration.days(20),
                expiryTime,
                {
                    from: account_issuer
                }
            );
            assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");
            let initBalance = new BN(await web3.eth.getBalance(account_investor2));
            tx = await I_CappedSTO_Array_ETH[0].buyTokens(account_investor2, {
                from: account_investor2,
                value: new BN(web3.utils.toWei("1.5", "ether")),
                gasPrice: 1
            });
            let finalBalance = new BN(await web3.eth.getBalance(account_investor2));
            assert.equal(
                finalBalance
                    .add(new BN(tx.receipt.gasUsed))
                    .add(new BN(web3.utils.toWei("1", "ether")))
                    .toString(),
                initBalance.toString()
            );
            await I_SecurityToken_ETH.changeGranularity(1, { from: token_owner });
            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).div(new BN(10).pow(new BN(18))).toNumber(), 2);

            assert.equal((await I_SecurityToken_ETH.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);
        });

        it("Should restrict to buy tokens after hiting the cap in second tx first tx pass", async () => {
            // Fallback transaction
            await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_CappedSTO_Array_ETH[0].address,
                gas: 2100000,
                value: new BN(web3.utils.toWei("8", "ether"))
            });

            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).div(new BN(10).pow(new BN(18))).toNumber(), 10);

            assert.equal(await I_CappedSTO_Array_ETH[0].investorCount.call(), 2);

            assert.equal((await I_SecurityToken_ETH.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber(), 9000);
            await catchRevert(I_CappedSTO_Array_ETH[0].buyTokens(account_investor2, { value: new BN(web3.utils.toWei("81")) }));
        });

        it("Should fundRaised value equal to the raised value in the funds receiver wallet", async () => {
            const newBalance = await web3.eth.getBalance(account_fundsReceiver);
            //console.log("WWWW",newBalance,await I_CappedSTO.fundsRaised.call(),balanceOfReceiver);
            let op = new BN(newBalance).sub(balanceOfReceiver);
            assert.equal(
                (await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).toString(),
                op.toString(),
                "Somewhere raised money get stolen or sent to wrong wallet"
            );
        });

        it("Should get the raised amount of ether", async () => {
            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).toString(), new BN(web3.utils.toWei("10", "ether")).toString());
        });

        it("Should get the raised amount of poly", async () => {
            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(POLY)).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });
    });

    describe("Reclaim poly sent to STO by mistake", async () => {
        it("Should fail to reclaim POLY because token contract address is 0 address", async () => {
            let value = new BN(web3.utils.toWei("100", "ether"));
            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_CappedSTO_Array_ETH[0].address, value, { from: account_investor1 });

            await catchRevert(I_CappedSTO_Array_ETH[0].reclaimERC20(address_zero, { from: token_owner }));
        });

        it("Should successfully reclaim POLY", async () => {
            let initInvestorBalance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let initOwnerBalance = new BN(await I_PolyToken.balanceOf(token_owner));
            let initContractBalance = new BN(await I_PolyToken.balanceOf(I_CappedSTO_Array_ETH[0].address));
            let value = new BN(web3.utils.toWei("100", "ether"));

            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_CappedSTO_Array_ETH[0].address, value, { from: account_investor1 });
            await I_CappedSTO_Array_ETH[0].reclaimERC20(I_PolyToken.address, { from: token_owner });
            assert.equal(
                (await I_PolyToken.balanceOf(account_investor1)).toString(),
                initInvestorBalance.toString(),
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
                (await I_PolyToken.balanceOf(I_CappedSTO_Array_ETH[0].address)).toString(),
                new BN(0).toString(),
                "tokens are not trandfered out from STO contract"
            );
        });
    });

    describe("Attach second ETH STO module", async () => {
        it("Should successfully attach the second STO module to the security token", async () => {
            startTime_ETH2 = await latestTime() + duration.days(1);
            endTime_ETH2 = startTime_ETH2 + duration.days(30);

            await I_PolyToken.getTokens(cappedSTOSetupCostPOLY, token_owner);
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, cappedSTOSetupCostPOLY, { from: token_owner });
            let bytesSTO = encodeModuleCall(STOParameters, [
                startTime_ETH2,
                endTime_ETH2,
                cap,
                rate,
                [E_fundRaiseType],
                account_fundsReceiver
            ]);
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
            I_CappedSTO_Array_ETH.push(await CappedSTO.at(tx.logs[3].args._module));
        });

        it("Should verify the configuration of the STO", async () => {
            assert.equal(await I_CappedSTO_Array_ETH[1].startTime.call(), startTime_ETH2, "STO Configuration doesn't set as expected");
            assert.equal(await I_CappedSTO_Array_ETH[1].endTime.call(), endTime_ETH2, "STO Configuration doesn't set as expected");
            assert.equal((await I_CappedSTO_Array_ETH[1].cap.call()).toString(), cap.toString(), "STO Configuration doesn't set as expected");
            assert.equal((await I_CappedSTO_Array_ETH[1].rate.call()).toString(), rate.toString(), "STO Configuration doesn't set as expected");
            assert.equal(
                await I_CappedSTO_Array_ETH[1].fundRaiseTypes.call(E_fundRaiseType),
                true,
                "STO Configuration doesn't set as expected"
            );
        });

        it("Should successfully whitelist investor 3", async () => {
            balanceOfReceiver = new BN(await web3.eth.getBalance(account_fundsReceiver));

            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor3, fromTime, toTime, expiryTime, {
                from: account_issuer,
                gas: 500000
            });

            assert.equal(tx.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");

            // Jump time to beyond STO start
            await increaseTime(duration.days(2));
        });

        it("Should invest in second STO - fails due to incorrect beneficiary", async () => {
            // Buying on behalf of another user should fail

            await catchRevert(
                I_CappedSTO_Array_ETH[1].buyTokens(account_investor3, { from: account_issuer, value: new BN(web3.utils.toWei("1", "ether")) })
            );
        });

        it("Should allow non-matching beneficiary", async () => {
            await I_CappedSTO_Array_ETH[1].changeAllowBeneficialInvestments(true, { from: account_issuer });
            let allow = await I_CappedSTO_Array_ETH[1].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");
        });

        it("Should allow non-matching beneficiary -- failed because it is already active", async () => {
            await catchRevert(I_CappedSTO_Array_ETH[1].changeAllowBeneficialInvestments(true, { from: account_issuer }));
        });

        it("Should invest in second STO", async () => {
            await I_CappedSTO_Array_ETH[1].buyTokens(account_investor3, { from: account_issuer, value: new BN(web3.utils.toWei("1", "ether")) });

            assert.equal((await I_CappedSTO_Array_ETH[1].getRaised.call(ETH)).div(new BN(10).pow(new BN(18))).toNumber(), 1);

            assert.equal(await I_CappedSTO_Array_ETH[1].investorCount.call(), 1);

            assert.equal((await I_SecurityToken_ETH.balanceOf(account_investor3)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);
        });
    });

    describe("Test cases for reaching limit number of STO modules", async () => {
        it("Should successfully attach 10 STO modules", async () => {
            const MAX_MODULES = 10;
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            for (var i = 0; i < MAX_MODULES; i++) {
                await I_PolyToken.getTokens(new BN(cappedSTOSetupCostPOLY), token_owner);
            };
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, new BN(cappedSTOSetupCostPOLY.mul(new BN(MAX_MODULES))), { from: token_owner });
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, [E_fundRaiseType], account_fundsReceiver]);

            for (var STOIndex = 2; STOIndex < MAX_MODULES; STOIndex++) {
                const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner });
                assert.equal(tx.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "CappedSTO", `Wrong STO module added at index ${STOIndex}`);
                I_CappedSTO_Array_ETH.push(await CappedSTO.at(tx.logs[3].args._module));
            }
        });

        it("Should successfully invest in all STO modules attached", async () => {
            const MAX_MODULES = 10;
            await increaseTime(duration.days(2));
            for (var STOIndex = 2; STOIndex < MAX_MODULES; STOIndex++) {
                await I_CappedSTO_Array_ETH[STOIndex].buyTokens(account_investor3, {
                    from: account_investor3,
                    value: new BN(web3.utils.toWei("1", "ether"))
                });
                assert.equal(
                    (await I_CappedSTO_Array_ETH[STOIndex].getRaised.call(ETH)).div(new BN(10).pow(new BN(18))).toNumber(),
                    1
                );
                assert.equal(await I_CappedSTO_Array_ETH[STOIndex].investorCount.call(), 1);
            }
        });
    });

    describe("Test Cases for an STO of fundraise type POLY", async () => {
        describe("Launch a new SecurityToken", async () => {
            it("POLY: Should register the ticker before the generation of the security token", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerNewTicker(token_owner, P_symbol, { from: token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._ticker, P_symbol);
            });

            it("Failed to generate the ST - Treasury wallet 0x0 is not allowed", async() => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

                await catchRevert(
                    I_STRProxied.generateNewSecurityToken(P_name, P_symbol, P_tokenDetails, false,  "0x0000000000000000000000000000000000000000", 0, { from: token_owner })
                );
            });

            it("POLY: Should generate the new security token with the same symbol as registered above", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

                let tx = await I_STRProxied.generateNewSecurityToken(P_name, P_symbol, P_tokenDetails, false, treasury_wallet, 0, { from: token_owner });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, P_symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken_POLY = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
                stGetter_poly = await STGetter.at(I_SecurityToken_POLY.address);
                assert.equal(await stGetter_poly.getTreasuryWallet.call(), treasury_wallet, "Incorrect wallet set")

                const log = (await I_SecurityToken_POLY.getPastEvents('ModuleAdded', {filter: {from: blockNo}}))[0];

                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
            });

            it("POLY: Should initialize the auto attached modules", async () => {
                let moduleData = (await stGetter_poly.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
            });

            it("POLY: Should successfully attach the STO module to the security token", async () => {
                startTime_POLY1 = await latestTime() + duration.days(2);
                endTime_POLY1 = startTime_POLY1 + duration.days(30);

                await I_PolyToken.getTokens(cappedSTOSetupCostPOLY, token_owner);
                await I_PolyToken.transfer(I_SecurityToken_POLY.address, cappedSTOSetupCostPOLY, { from: token_owner });

                let bytesSTO = encodeModuleCall(STOParameters, [
                    startTime_POLY1,
                    endTime_POLY1,
                    P_cap,
                    P_rate,
                    [P_fundRaiseType],
                    account_fundsReceiver
                ]);

                const tx = await I_SecurityToken_POLY.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner });

                assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
                I_CappedSTO_Array_POLY.push(await CappedSTO.at(tx.logs[3].args._module));
            });
        });

        describe("verify the data of STO", async () => {
            it("Should verify the configuration of the STO", async () => {
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].startTime.call()).toNumber(),
                    startTime_POLY1,
                    "1STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].endTime.call()).toNumber(),
                    endTime_POLY1,
                    "2STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].cap.call()).div(new BN(10).pow(new BN(18))).toString(),
                    new BN(P_cap).div(new BN(10).pow(new BN(18))),
                    "3STO Configuration doesn't set as expected"
                );
                assert.equal((await I_CappedSTO_Array_POLY[0].rate.call()).toString(), new BN(P_rate).toString(), "STO Configuration doesn't set as expected");
                assert.equal(
                    await I_CappedSTO_Array_POLY[0].fundRaiseTypes.call(P_fundRaiseType),
                    true,
                    "4STO Configuration doesn't set as expected"
                );
            });
        });

        describe("Buy tokens", async () => {
            it("Should Buy the tokens", async () => {
                await I_PolyToken.getTokens(new BN(10).pow(new BN(22)), account_investor1);
                blockNo = await latestBlock();
                assert.equal(
                    (await I_PolyToken.balanceOf(account_investor1)).div(new BN(10).pow(new BN(18))).toNumber(),
                    10500,
                    "Tokens are not transfered properly"
                );
                let tx = await I_GeneralTransferManager.modifyKYCData(account_investor1, P_fromTime, P_toTime, P_expiryTime, {
                    from: account_issuer,
                    gas: 500000
                });
                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
                // Jump time
                await increaseTime(duration.days(17));
                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, new BN(10).pow(new BN(21)), { from: account_investor1 });

                // buyTokensWithPoly transaction
                await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(10).pow(new BN(21)), {
                    from: account_investor1
                });
                assert.equal((await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);

                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(), 1);

                assert.equal(
                    (await I_SecurityToken_POLY.balanceOf(account_investor1)).div(new BN(10).pow(new BN(18))).toNumber(),
                    5000
                );

            });

            it("Verification of the event Token Purchase", async () => {
                const log = (await I_CappedSTO_Array_POLY[0].getPastEvents('TokenPurchase', {filter: {from: blockNo}}))[0];

                assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
                assert.equal(log.args.amount.div(new BN(10).pow(new BN(18))).toNumber(), 5000, "Wrong No. token get dilivered");
            });

            it("Should failed to buy tokens -- because fundraisetype is POLY not ETH", async () => {
                await catchRevert(
                    // Fallback transaction
                    web3.eth.sendTransaction({
                        from: account_investor1,
                        to: I_CappedSTO_Array_POLY[0].address,
                        gas: 2100000,
                        value: new BN(web3.utils.toWei("2", "ether"))
                    })
                );
            });

            it("Should fail in buying tokens because buying is paused", async () => {
                await I_CappedSTO_Array_POLY[0].pause({ from: account_issuer });
                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, new BN(10).pow(new BN(21)), { from: account_investor1 });

                // buyTokensWithPoly transaction
                await catchRevert(
                    I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(10).pow(new BN(21)), {
                        from: account_investor1,
                        gas: 6000000
                    })
                );
                await I_CappedSTO_Array_POLY[0].unpause({ from: account_issuer });
            });

            it("Should buy the granular unit tokens and charge only required POLY", async () => {
                await I_SecurityToken_POLY.changeGranularity(new BN(10).pow(new BN(22)), { from: token_owner });
                let tx = await I_GeneralTransferManager.modifyKYCData(
                    account_investor2,
                    P_fromTime,
                    P_toTime + duration.days(20),
                    P_expiryTime,
                    {
                        from: account_issuer,
                        gas: 500000
                    }
                );
                console.log((await I_SecurityToken_POLY.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber());
                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");
                await I_PolyToken.getTokens(new BN(10).pow(new BN(22)), account_investor2);
                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, new BN(9000).mul(new BN(10).pow(new BN(18))), { from: account_investor2 });
                const initRaised = (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).div(new BN(10).pow(new BN(18))).toNumber();
                tx = await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(3000).mul(new BN(10).pow(new BN(18))), { from: account_investor2 });
                await I_SecurityToken_POLY.changeGranularity(1, { from: token_owner });
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).div(new BN(10).pow(new BN(18))).toNumber(),
                    initRaised + 2000
                ); //2000 this call, 1000 earlier
                assert.equal((await I_PolyToken.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber(), 8000);
                assert.equal(
                    (await I_SecurityToken_POLY.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber(),
                    10000
                );
            });

            it("Should restrict to buy tokens after hiting the cap in second tx first tx pass", async () => {
                // buyTokensWithPoly transaction
                await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(7000).mul(new BN(10).pow(new BN(18))), { from: account_investor2 });

                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).div(new BN(10).pow(new BN(18))).toNumber(),
                    10000
                );

                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(), 2);

                assert.equal(
                    (await I_SecurityToken_POLY.balanceOf(account_investor2)).div(new BN(10).pow(new BN(18))).toNumber(),
                    45000
                );
                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, new BN(1000).mul(new BN(10).pow(new BN(18))), { from: account_investor1 });
                await catchRevert(I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(1000).mul(new BN(10).pow(new BN(18))), { from: account_investor1 }));
            });

            it("Should failed at the time of buying the tokens -- Because STO get expired", async () => {
                await increaseTime(duration.days(31)); // increased beyond the end time of the STO
                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, new BN(1000).mul(new BN(10).pow(new BN(18))), { from: account_investor1 });
                await catchRevert(
                    I_CappedSTO_Array_POLY[0].buyTokensWithPoly(new BN(1000).mul(new BN(10).pow(new BN(18))), { from: account_investor1, gas: 6000000 })
                );
            });

            it("Should fundRaised value equal to the raised value in the funds receiver wallet", async () => {
                const balanceRaised = await I_PolyToken.balanceOf.call(account_fundsReceiver);
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).toString(),
                    balanceRaised.toString(),
                    "Somewhere raised money get stolen or sent to wrong wallet"
                );
            });
        });

        describe("Pricing Test cases for Module Factory", async () => {
            it("Should return correct price when price is in poly", async () => {
                let newFactory = await CappedSTOFactory.new(
                    new BN(1000),
                    I_CappedSTO_Array_POLY[0].address,
                    I_PolymathRegistry.address,
                    true,
                    { from: account_polymath }
                );
                assert.equal((await newFactory.setupCostInPoly.call()).toString(), (new BN(1000)).toString());
                assert.equal((await newFactory.setupCost()).toString(), (new BN(1000)).toString());
            });
        });

        describe("Check that we can reclaim ETH and ERC20 tokens from an STO", async () => {
            //xxx
            it("should attach a dummy STO", async () => {
                let I_DummySTOFactory;
                [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, new BN(0));
                const DummySTOParameters = ["uint256", "uint256", "uint256", "string"];
                let startTime = await latestTime() + duration.days(1);
                let endTime = startTime + duration.days(30);
                const cap = web3.utils.toWei("10000");
                const dummyBytesSig = encodeModuleCall(DummySTOParameters, [startTime, endTime, cap, "Hello"]);
                const tx = await I_SecurityToken_ETH.addModule(I_DummySTOFactory.address, dummyBytesSig, maxCost, new BN(0), false, { from: token_owner });
                console.log(tx.logs[2]);
                assert.equal(tx.logs[2].args._types[0], stoKey, `Wrong module type added`);
                assert.equal(
                    web3.utils.hexToString(tx.logs[2].args._name),
                    "DummySTO",
                    `Wrong STO module added`
                );
                I_DummySTO = await DummySTO.at(tx.logs[2].args._module);
                console.log(I_DummySTO.address);
            });
            it("should send some funds and ERC20 to the DummySTO", async () => {
                let tx = await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: web3.utils.toChecksumAddress(I_DummySTO.address),
                    gas: 2100000,
                    value: web3.utils.toWei("1")
                });
                let dummyETH = await web3.eth.getBalance(I_DummySTO.address);
                assert.equal(dummyETH.toString(), web3.utils.toWei("1"));
                await I_PolyToken.getTokens(web3.utils.toWei("2"), I_DummySTO.address);
                let dummyPOLY = await I_PolyToken.balanceOf(I_DummySTO.address);
                assert.equal(dummyPOLY.toString(), web3.utils.toWei("2"));
            });

            it("should reclaim ETH and ERC20 from STO", async () => {
                let initialIssuerETH = await web3.eth.getBalance(token_owner);
                let initialIssuerPOLY = await I_PolyToken.balanceOf(token_owner);
                await catchRevert(I_DummySTO.reclaimERC20(I_PolyToken.address, {from: account_polymath, gasPrice: 0}));
                await catchRevert(I_DummySTO.reclaimETH( {from: account_polymath, gasPrice: 0}));
                let tx = await I_DummySTO.reclaimERC20(I_PolyToken.address, {from: token_owner, gasPrice: 0});
                let tx2 = await I_DummySTO.reclaimETH({from: token_owner, gasPrice: 0});
                let finalIssuerETH = await web3.eth.getBalance(token_owner);
                let finalIssuerPOLY = await I_PolyToken.balanceOf(token_owner);
                let ethDifference = parseInt(web3.utils.fromWei(finalIssuerETH.toString())) - parseInt(web3.utils.fromWei(initialIssuerETH.toString()));
                let polyDifference = parseInt(web3.utils.fromWei(finalIssuerPOLY.toString())) - parseInt(web3.utils.fromWei(initialIssuerPOLY.toString()));
                assert.equal(ethDifference, 1);
                assert.equal(polyDifference, 2);
                let dummyETH = await web3.eth.getBalance(I_DummySTO.address);
                assert.equal(dummyETH.toString(), 0);
                let dummyPOLY = await I_PolyToken.balanceOf(I_DummySTO.address);
                assert.equal(dummyPOLY.toString(), 0);
            });
        });

        describe("Test cases for the CappedSTOFactory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal((await I_CappedSTOFactory.setupCost.call()).toString(), cappedSTOSetupCost.toString());
                assert.equal((await I_CappedSTOFactory.setupCostInPoly.call()).toString(), cappedSTOSetupCostPOLY.toString());
                assert.equal((await I_CappedSTOFactory.getTypes.call())[0], 3);
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.name.call()), "CappedSTO", "Wrong Module added");
                assert.equal(
                    await I_CappedSTOFactory.description.call(),
                    "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (ETH or POLY), and any security tokens left upon termination of the offering will not be minted.",
                    "Wrong Module added"
                );
                assert.equal(await I_CappedSTOFactory.title.call(), "Capped STO", "Wrong Module added");
                let tags = await I_CappedSTOFactory.getTags.call();
                assert.equal(web3.utils.hexToString(tags[0]), "Capped");
                assert.equal(await I_CappedSTOFactory.version.call(), "3.0.0");
            });

            it("Should fail to change the title -- bad owner", async () => {
                await catchRevert(I_CappedSTOFactory.changeTitle("STO Capped", { from: account_investor1 }));
            });

            it("Should fail to change the title -- zero length", async () => {
                await catchRevert(I_CappedSTOFactory.changeTitle("", { from: account_polymath }));
            });

            it("Should successfully change the title", async () => {
                await I_CappedSTOFactory.changeTitle("STO Capped", { from: account_polymath });
                assert.equal(await I_CappedSTOFactory.title.call(), "STO Capped", "Title doesn't get changed");
            });

            it("Should fail to change the description -- bad owner", async () => {
                await catchRevert(I_CappedSTOFactory.changeDescription("It is only a STO", { from: account_investor1 }));
            });

            it("Should fail to change the description -- zero length", async () => {
                await catchRevert(I_CappedSTOFactory.changeDescription("", { from: account_polymath }));
            });

            it("Should successfully change the description", async () => {
                await I_CappedSTOFactory.changeDescription("It is only a STO", { from: account_polymath });
                assert.equal(await I_CappedSTOFactory.description.call(), "It is only a STO", "Description doesn't get changed");
            });

            it("Should fail to change the name -- bad owner", async () => {
                await catchRevert(I_CappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), { from: account_investor1 }));
            });

            it("Should fail to change the name -- zero length", async () => {
                await catchRevert(I_CappedSTOFactory.changeName(web3.utils.stringToHex(""), { from: account_polymath }));
            });

            it("Should successfully change the name", async () => {
                await I_CappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), { from: account_polymath });
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.name.call()), "STOCapped", "Name doesn't get changed");
            });

            it("Should successfully change the name", async () => {
                await I_CappedSTOFactory.changeName(web3.utils.stringToHex("CappedSTO"), { from: account_polymath });
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.name.call()), "CappedSTO", "Name doesn't get changed");
            });
        });

        describe("Test cases for the get functions of the capped sto", async () => {
            it("Should verify the cap reached or not", async () => {
                assert.isTrue(await I_CappedSTO_Array_POLY[0].capReached.call());
            });

            it("Should get the raised amount of ether", async () => {
                assert.equal((await I_CappedSTO_Array_POLY[0].getRaised.call(ETH)).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            });

            it("Should get the raised amount of poly", async () => {
                assert.equal((await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).toString(), new BN(web3.utils.toWei("10000", "ether")).toString());
            });

            it("Should get the investors", async () => {
                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(), 2);
            });

            it("Should get the listed permissions", async () => {
                let tx = await I_CappedSTO_Array_POLY[0].getPermissions.call();
                assert.equal(tx.length, 1);
            });

            it("Should get the metrics of the STO", async () => {
                let metrics = await I_CappedSTO_Array_POLY[0].getSTODetails.call();
                assert.isTrue(metrics[7]);
            });
        });
    });

    describe("Attach second POLY STO module", async () => {
        it("Should successfully attach a second STO to the security token", async () => {
            startTime_POLY2 = await latestTime() + duration.days(1);
            endTime_POLY2 = startTime_POLY2 + duration.days(30);

            await I_PolyToken.getTokens(cappedSTOSetupCostPOLY, token_owner);
            await I_PolyToken.transfer(I_SecurityToken_POLY.address, cappedSTOSetupCostPOLY, { from: token_owner });

            let bytesSTO = encodeModuleCall(STOParameters, [
                startTime_POLY2,
                endTime_POLY2,
                P_cap,
                P_rate,
                [P_fundRaiseType],
                account_fundsReceiver
            ]);

            const tx = await I_SecurityToken_POLY.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, new BN(0), false, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
            I_CappedSTO_Array_POLY.push(await CappedSTO.at(tx.logs[3].args._module));
        });

        it("Should verify the configuration of the STO", async () => {
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].startTime.call()).toString(),
                startTime_POLY2.toString(),
                "1STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].endTime.call()).toString(),
                endTime_POLY2.toString(),
                "2STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].cap.call()).div(new BN(10).pow(new BN(18))).toString(),
                new BN(P_cap).div(new BN(10).pow(new BN(18))).toString(),
                "3STO Configuration doesn't set as expected"
            );
            assert.equal((await I_CappedSTO_Array_POLY[1].rate.call()).toString(), new BN(P_rate).toString(), "STO Configuration doesn't set as expected");
            assert.equal(
                await I_CappedSTO_Array_POLY[1].fundRaiseTypes.call(P_fundRaiseType),
                true,
                "4STO Configuration doesn't set as expected"
            );
        });

        it("Should successfully invest in second STO", async () => {
            const polyToInvest = new BN(1000);
            const stToReceive = new BN(polyToInvest.mul(new BN(P_rate).div(new BN(10).pow(new BN(18)))));

            await I_PolyToken.getTokens(polyToInvest.mul(new BN(10).pow(new BN(18))), account_investor3);

            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor3, P_fromTime, P_toTime, P_expiryTime, {
                from: account_issuer,
                gas: 500000
            });

            // Jump time to beyond STO start
            await increaseTime(duration.days(2));

            await I_PolyToken.approve(I_CappedSTO_Array_POLY[1].address, polyToInvest.mul(new BN(10).pow(new BN(18))), { from: account_investor3 });

            // buyTokensWithPoly transaction
            await I_CappedSTO_Array_POLY[1].buyTokensWithPoly(polyToInvest.mul(new BN(10).pow(new BN(18))), {
                from: account_investor3,
                gas: 6000000
            });

            assert.equal(
                (await I_CappedSTO_Array_POLY[1].getRaised.call(POLY)).div(new BN(10).pow(new BN(18))).toString(),
                polyToInvest.toString()
            );

            assert.equal(await I_CappedSTO_Array_POLY[1].investorCount.call(), 1);

            assert.equal(
                (await I_SecurityToken_POLY.balanceOf(account_investor3)).div(new BN(10).pow(new BN(18))).toString(),
                stToReceive.toString()
            );
       });
    });
});
