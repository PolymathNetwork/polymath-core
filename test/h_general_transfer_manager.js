import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { getSignGTMData, getSignGTMTransferData, getMultiSignGTMData } from "./helpers/signData";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { pk } from "./helpers/testprivateKey";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployDummySTOAndVerifyed, deployGTMAndVerifyed } from "./helpers/createInstances";

const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("GeneralTransferManager", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let token_owner_pk;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_delegate;
    let account_affiliates1;
    let account_affiliates2;

    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let message = "Transaction Should Fail!";

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
    let P_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;
    let P_GeneralTransferManagerFactory;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

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
    const initRegFee = new BN(web3.utils.toWei("1000"));

    // Dummy STO details
    let startTime;
    let endTime;
    const cap = new BN(web3.utils.toWei("10", "ether"));
    const someString = "A string which is not used";
    const STOParameters = ["uint256", "uint256", "uint256", "string"];

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";
    let signer;
    let snapid;

    before(async () => {
        currentTime = new BN(await latestTime());
        fromTime = await latestTime();
        toTime = await latestTime();
        expiryTime = toTime + duration.days(15);
        startTime = await latestTime() + duration.seconds(5000); // Start time will be 5000 seconds more than the latest time
        endTime = startTime + duration.days(80); // Add 80 days more

        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_delegate = accounts[7];
        account_investor3 = accounts[5];
        account_investor4 = accounts[6];

        account_affiliates1 = accounts[3];
        account_affiliates2 = accounts[4];

        let oneeth = new BN(web3.utils.toWei("1", "ether"));
        signer = web3.eth.accounts.create();
        await web3.eth.personal.importRawKey(signer.privateKey, "");
        await web3.eth.personal.unlockAccount(signer.address, "", 6000);
        await web3.eth.sendTransaction({ from: token_owner, to: signer.address, value: oneeth });

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

        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);
        [P_GeneralTransferManagerFactory] = await deployGTMAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));
        [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, 0);
        [P_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

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

        DummySTOFactory:                   ${I_DummySTOFactory.address}
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
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should attach the paid GTM -- failed because of no tokens", async () => {
            await catchRevert(
                I_SecurityToken.addModule(P_GeneralTransferManagerFactory.address, "0x0", new BN(web3.utils.toWei("2000")), new BN(0), false, { from: account_issuer })
            );
        });

        it("Should attach the paid GTM", async () => {
            let snap_id = await takeSnapshot();
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), I_SecurityToken.address);
            await I_SecurityToken.addModule(P_GeneralTransferManagerFactory.address, "0x0", new BN(web3.utils.toWei("2000")), new BN(0), false, {
                from: account_issuer
            });
            await revertToSnapshot(snap_id);
        });

        it("Should add investor flags", async () => {
            let snap_id = await takeSnapshot();
            await I_GeneralTransferManager.modifyInvestorFlagMulti([account_investor1, account_investor1, account_investor2], [0, 1, 1], [true, true, true], { from: account_issuer });
            let investors = await I_GeneralTransferManager.getInvestors(0, 1);
            assert.equal(investors[0], account_investor1);
            assert.equal(investors[1], account_investor2);
            let investorCount = await stGetter.getInvestorCount();
            assert.equal(investorCount.toNumber(), 2);
            let allInvestorFlags = await I_GeneralTransferManager.getAllInvestorFlags();
            assert.deepEqual(investors, allInvestorFlags[0]);
            assert.equal(allInvestorFlags[1][0].toNumber(), 3)//0x000....00011
            assert.equal(allInvestorFlags[1][1].toNumber(), 2)//0x000....00010
            let investorFlags = await I_GeneralTransferManager.getInvestorFlags(allInvestorFlags[0][0]);
            assert.equal(investorFlags, 3)//0x000....00011
            await revertToSnapshot(snap_id);
        });

        it("Should whitelist the affiliates before the STO attached", async () => {
            console.log(`Estimate gas of one Whitelist:
                ${await I_GeneralTransferManager.modifyKYCData.estimateGas(
                    account_affiliates1,
                    currentTime + currentTime.add(new BN(duration.days(30))),
                    currentTime + currentTime.add(new BN(duration.days(90))),
                    currentTime + currentTime.add(new BN(duration.days(965))),
                    {
                        from: account_issuer
                    }
                )}`
            );
            let fromTime1 = currentTime + currentTime.add(new BN(duration.days(30)));
            let fromTime2 = currentTime.add(new BN(duration.days(30)));
            let toTime1 =  currentTime + currentTime.add(new BN(duration.days(90)));
            let toTime2 = currentTime.add(new BN(duration.days(90)));
            let expiryTime1 = currentTime + currentTime.add(new BN(duration.days(965)));
            let expiryTime2 = currentTime.add(new BN(duration.days(365)));

            let tx = await I_GeneralTransferManager.modifyKYCDataMulti(
                [account_affiliates1, account_affiliates2],
                [fromTime1, fromTime2],
                [toTime1, toTime2],
                [expiryTime1, expiryTime2],
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );
            await I_GeneralTransferManager.modifyInvestorFlagMulti([account_affiliates1, account_affiliates2], [1, 1], [true, true], { from: account_issuer });
            assert.equal(tx.logs[0].args._investor, account_affiliates1);
            assert.equal(tx.logs[1].args._investor, account_affiliates2);
            assert.deepEqual(await I_GeneralTransferManager.getAllInvestors.call(), [account_affiliates1, account_affiliates2]);
            console.log(await I_GeneralTransferManager.getAllKYCData.call());
            let data = await I_GeneralTransferManager.getKYCData.call([account_affiliates1, account_affiliates2]);
            assert.equal(data[0][0].toString(), fromTime1);
            assert.equal(data[0][1].toString(), fromTime2);
            assert.equal(data[1][0].toString(), toTime1);
            assert.equal(data[1][1].toString(), toTime2);
            assert.equal(data[2][0].toString(), expiryTime1);
            assert.equal(data[2][1].toString(), expiryTime2);
            assert.equal(await I_GeneralTransferManager.getInvestorFlag(account_affiliates1, 1), true);
            assert.equal(await I_GeneralTransferManager.getInvestorFlag(account_affiliates2, 1), true);
        });

        it("Should whitelist lots of addresses and check gas", async () => {
            let mockInvestors = [];
            for (let i = 0; i < 50; i++) {
                mockInvestors.push("0x1000000000000000000000000000000000000000".substring(0, 42 - i.toString().length) + i.toString());
            }

            let times = range1(50);
            let bools = rangeB(50);
            let tx = await I_GeneralTransferManager.modifyKYCDataMulti(mockInvestors, times, times, times, {
                from: account_issuer
            });
            console.log("Multi Whitelist x 50: " + tx.receipt.gasUsed);
            assert.deepEqual(
                await I_GeneralTransferManager.getAllInvestors.call(),
                [account_affiliates1, account_affiliates2].concat(mockInvestors)
            );
        });

        it("Should mint the tokens to the affiliates", async () => {
            console.log(`
                Estimate gas cost for minting the tokens: ${await I_SecurityToken.issueMulti.estimateGas([account_affiliates1, account_affiliates2], [new BN(100).mul(new BN(10).pow(new BN(18))), new BN(10).pow(new BN(20))], {
                    from: account_issuer
                })}
            `)
            await I_SecurityToken.issueMulti([account_affiliates1, account_affiliates2], [new BN(100).mul(new BN(10).pow(new BN(18))), new BN(10).pow(new BN(20))], {
                from: account_issuer,
                gas: 6000000
            });
            assert.equal((await I_SecurityToken.balanceOf.call(account_affiliates1)).div(new BN(10).pow(new BN(18))).toNumber(), 100);
            assert.equal((await I_SecurityToken.balanceOf.call(account_affiliates2)).div(new BN(10).pow(new BN(18))).toNumber(), 100);
        });

        it("Should successfully attach the STO factory with the security token -- failed because of no tokens", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [
                await latestTime() + duration.seconds(1000),
                await latestTime() + duration.days(40),
                cap,
                someString
            ]);
            await catchRevert(
                I_SecurityToken.addModule(P_DummySTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), false, { from: token_owner })
            );
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            let snap_id = await takeSnapshot();
            let bytesSTO = encodeModuleCall(STOParameters, [
                await latestTime() + duration.seconds(1000),
                await latestTime() + duration.days(40),
                cap,
                someString
            ]);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), I_SecurityToken.address);
            const tx = await I_SecurityToken.addModule(P_DummySTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), false, {
                from: token_owner
            });
            assert.equal(tx.logs[3].args._types[0].toNumber(), stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "DummySTO",
                "DummySTOFactory module was not added"
            );
            I_DummySTO = await DummySTO.at(tx.logs[3].args._module);
            await revertToSnapshot(snap_id);
        });

        it("Should successfully attach the STO factory with the security token - invalid data", async () => {
            let bytesSTO = encodeModuleCall(["uint256", "string"], [await latestTime() + duration.seconds(1000), someString]);
            await catchRevert(I_SecurityToken.addModule(P_DummySTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner }));
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [
                await latestTime() + duration.seconds(1000),
                await latestTime() + duration.days(40),
                cap,
                someString
            ]);
            const tx = await I_SecurityToken.addModule(I_DummySTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "DummySTO",
                "DummySTOFactory module was not added"
            );
            I_DummySTO = await DummySTO.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "GeneralPermissionManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManager module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("should have transfer requirements initialized", async () => {
            let transferRestrions = await I_GeneralTransferManager.transferRequirements(0);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], true);
            assert.equal(transferRestrions[3], true);
            transferRestrions = await I_GeneralTransferManager.transferRequirements(1);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
            transferRestrions = await I_GeneralTransferManager.transferRequirements(2);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], false);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
        });

        it("should not allow unauthorized people to change transfer requirements", async () => {
            await catchRevert(
                I_GeneralTransferManager.modifyTransferRequirementsMulti(
                    [0, 1, 2],
                    [true, false, true],
                    [true, true, false],
                    [false, false, false],
                    [false, false, false],
                    { from: account_investor1 }
                )
            );
            await catchRevert(I_GeneralTransferManager.modifyTransferRequirements(0, false, false, false, false, { from: account_investor1 }));
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            await catchRevert(I_DummySTO.generateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner }));
        });

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
            console.log(
                `Gas usage of minting of tokens: ${await I_DummySTO.generateTokens.estimateGas(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner })}`
            )
            await I_DummySTO.generateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should fail in buying the token from the STO", async () => {
            await catchRevert(I_DummySTO.generateTokens(account_affiliates1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner }));
        });

        it("Should fail in buying the tokens from the STO -- because amount is 0", async () => {
            await catchRevert(I_DummySTO.generateTokens(account_investor1, new BN(0), { from: token_owner }));
        });

        it("Should fail in buying the tokens from the STO -- because STO is paused", async () => {
            await I_DummySTO.pause({ from: account_issuer });
            await catchRevert(I_DummySTO.generateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner }));
            // Reverting the changes releated to pause
            await I_DummySTO.unpause({ from: account_issuer });
        });

        it("Should buy more tokens from the STO to investor1", async () => {
            await I_DummySTO.generateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should fail in investing the money in STO -- expiry limit reached", async () => {
            await increaseTime(duration.days(10));

            await catchRevert(I_DummySTO.generateTokens(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner }));
        });
    });

    describe("Buy tokens using on-chain whitelist and defaults", async () => {
        // let snap_id;

        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist
            // snap_id = await takeSnapshot();
            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor1, new BN(0), new BN(0), currentTime.add(new BN(duration.days(20))), {
                from: account_issuer,
                gas: 6000000
            });

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(20))),
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

            // Jump time
            await increaseTime(5000);

            // Can transfer tokens
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Add a from default and check transfers are disabled then enabled in the future", async () => {
            let tx = await I_GeneralTransferManager.changeDefaults(currentTime.add(new BN(duration.days(12))), new BN(0), { from: token_owner });
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 });
            await catchRevert(I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));
            await increaseTime(duration.days(5));
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
        });

        it("Add a to default and check transfers are disabled then enabled in the future", async () => {
            let tx = await I_GeneralTransferManager.changeDefaults(0, currentTime.add(new BN(duration.days(16))), { from: token_owner });
            await catchRevert(I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 }));
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            await increaseTime(duration.days(2));
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("2", "ether")), { from: account_investor2 });
            // revert changes
            await I_GeneralTransferManager.modifyKYCData(account_investor2, new BN(0), new BN(0), new BN(0), {
                from: account_issuer,
                gas: 6000000
            });
            await I_GeneralTransferManager.changeDefaults(0, new BN(0), { from: token_owner });
        });
    });

    describe("Buy tokens using off-chain whitelist", async () => {
        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            await catchRevert(I_DummySTO.generateTokens(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: token_owner }));
        });

        it("Should provide the permission and change the signing address", async () => {

            let log2 = await I_GeneralPermissionManager.addDelegate(signer.address, web3.utils.fromAscii("My details"), { from: token_owner });
            assert.equal(log2.logs[0].args._delegate, signer.address);

            await I_GeneralPermissionManager.changePermission(signer.address, I_GeneralTransferManager.address, web3.utils.fromAscii("OPERATOR"), true, {
                from: token_owner
            });

            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(signer.address, I_GeneralTransferManager.address, web3.utils.fromAscii("OPERATOR"))
            );
        });

        it("Should buy the tokens -- Failed due to incorrect signature input", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;
            const sig = getSignGTMData(
                account_investor2,
                account_investor2,
                fromTime,
                toTime,
                expiryTime,
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSigned(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    validFrom,
                    validTo,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should buy the tokens -- Failed due to incorrect signature timing", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime() - 100;
            let validTo = await latestTime() - 1;
            let nonce = 5;
            const sig = getSignGTMData(
                I_GeneralTransferManager.address,
                account_investor2,
                fromTime,
                toTime,
                expiryTime,
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSigned(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    validFrom,
                    validTo,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should buy the tokens -- Failed due to incorrect signature signer", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + 60 * 60;
            let nonce = 5;
            const sig = getSignGTMData(
                I_GeneralTransferManager.address,
                account_investor2,
                fromTime,
                toTime,
                expiryTime,
                validFrom,
                validTo,
                nonce,
                "2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200"
            );

            const sig2 = getMultiSignGTMData(
                I_GeneralTransferManager.address,
                [account_investor2],
                [fromTime],
                [toTime],
                [expiryTime],
                validFrom,
                validTo,
                nonce,
                "2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200"
            );

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSigned(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    validFrom,
                    validTo,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSignedMulti(
                    [account_investor2],
                    [fromTime],
                    [toTime],
                    [expiryTime],
                    validFrom,
                    validTo,
                    nonce,
                    sig2,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should Not Transfer with expired Signed KYC data", async () => {
            let nonce = 5;
            const sig = getSignGTMTransferData(
                I_GeneralTransferManager.address,
                [account_investor2],
                [currentTime.toNumber()],
                [currentTime.toNumber()],
                [expiryTime + duration.days(200)],
                1,
                1,
                nonce,
                signer.privateKey
            );

            // Jump time
            await increaseTime(10000);
            await catchRevert(I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), {from: account_investor1}));
            await catchRevert(I_SecurityToken.transferWithData(account_investor2, new BN(web3.utils.toWei("1", "ether")), sig, {from: account_investor1}));
        });

        it("Should Transfer with Signed KYC data", async () => {
            let snap_id = await takeSnapshot();
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;
            const sig = getSignGTMTransferData(
                I_GeneralTransferManager.address,
                [account_investor2],
                [currentTime.toNumber()],
                [currentTime.toNumber()],
                [expiryTime + duration.days(200)],
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            // Jump time
            await increaseTime(10000);
            await catchRevert(I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), {from: account_investor1}));
            await I_SecurityToken.transferWithData(account_investor2, new BN(web3.utils.toWei("1", "ether")), sig, {from: account_investor1});
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            //Should transfer even with invalid sig data when kyc not required
            await I_SecurityToken.transferWithData(account_investor1, new BN(web3.utils.toWei("1", "ether")), sig, {from: account_investor2});
            await revertToSnapshot(snap_id);
        });

        it("Should not do multiple signed whitelist if sig has expired", async () => {
            snapid = await takeSnapshot();
            await I_GeneralTransferManager.modifyKYCDataMulti(
                [account_investor1, account_investor2],
                [currentTime, currentTime],
                [currentTime, currentTime],
                [1, 1],
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            let kycData = await I_GeneralTransferManager.getKYCData([account_investor1, account_investor2]);

            assert.equal(new BN(kycData[2][0]).toNumber(), 1, "KYC data not modified correctly");
            assert.equal(new BN(kycData[2][1]).toNumber(), 1, "KYC data not modified correctly");

            let nonce = 5;

            let newExpiryTime =  new BN(expiryTime).add(new BN(duration.days(200)));
            const sig = getMultiSignGTMData(
                I_GeneralTransferManager.address,
                [account_investor1, account_investor2],
                [fromTime, fromTime],
                [toTime, toTime],
                [newExpiryTime, newExpiryTime],
                1,
                1,
                nonce,
                signer.privateKey
            );

            await increaseTime(10000);


            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSignedMulti(
                    [account_investor1, account_investor2],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [newExpiryTime, newExpiryTime],
                    1,
                    1,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );

            kycData = await I_GeneralTransferManager.getKYCData([account_investor1, account_investor2]);

            assert.equal(new BN(kycData[2][0]).toNumber(), 1, "KYC data modified incorrectly");
            assert.equal(new BN(kycData[2][1]).toNumber(), 1, "KYC data modified incorrectly");
        });

        it("Should not do multiple signed whitelist if array length mismatch", async () => {
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;

            let newExpiryTime =  new BN(expiryTime).add(new BN(duration.days(200)));
            const sig = getMultiSignGTMData(
                I_GeneralTransferManager.address,
                [account_investor1, account_investor2],
                [fromTime, fromTime],
                [toTime, toTime],
                [newExpiryTime],
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            await increaseTime(10000);


            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSignedMulti(
                    [account_investor1, account_investor2],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [newExpiryTime],
                    validFrom,
                    validTo,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );

            let kycData = await I_GeneralTransferManager.getKYCData([account_investor1, account_investor2]);

            assert.equal(new BN(kycData[2][0]).toNumber(), 1, "KYC data modified incorrectly");
            assert.equal(new BN(kycData[2][1]).toNumber(), 1, "KYC data modified incorrectly");
        });

        it("Should do multiple signed whitelist in a signle transaction", async () => {
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;

            let newExpiryTime =  new BN(expiryTime).add(new BN(duration.days(200)));
            const sig = getMultiSignGTMData(
                I_GeneralTransferManager.address,
                [account_investor1, account_investor2],
                [fromTime, fromTime],
                [toTime, toTime],
                [newExpiryTime, newExpiryTime],
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            await increaseTime(10000);

            await I_GeneralTransferManager.modifyKYCDataSignedMulti(
                [account_investor1, account_investor2],
                [fromTime, fromTime],
                [toTime, toTime],
                [newExpiryTime, newExpiryTime],
                validFrom,
                validTo,
                nonce,
                sig,
                {
                    from: account_investor2,
                    gas: 6000000
                }
            );

            let kycData = await I_GeneralTransferManager.getKYCData([account_investor1, account_investor2]);

            assert.equal(new BN(kycData[2][0]).toString(), newExpiryTime.toString(), "KYC data not modified correctly");
            assert.equal(new BN(kycData[2][1]).toString(), newExpiryTime.toString(), "KYC data not modified correctly");

            await revertToSnapshot(snapid);
        });

        it("Should Buy the tokens with signers signature", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;
            const sig = getSignGTMData(
                I_GeneralTransferManager.address,
                account_investor2,
                currentTime.toNumber(),
                currentTime.add(new BN(duration.days(100))).toNumber(),
                expiryTime + duration.days(200),
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            let tx = await I_GeneralTransferManager.modifyKYCDataSigned(
                account_investor2,
                currentTime.toNumber(),
                currentTime.add(new BN(duration.days(100))).toNumber(),
                expiryTime + duration.days(200),
                validFrom,
                validTo,
                nonce,
                sig,
                {
                    from: account_investor2,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(10000);
            // Mint some tokens

            await I_DummySTO.generateTokens(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should fail if the txn is generated with same nonce", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 5;
            const sig = getSignGTMData(
                I_GeneralTransferManager.address,
                account_investor2,
                currentTime.toNumber(),
                currentTime.add(new BN(duration.days(100))).toNumber(),
                expiryTime + duration.days(200),
                validFrom,
                validTo,
                nonce,
                signer.privateKey
            );

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataSigned(
                    account_investor2,
                    currentTime.toNumber(),
                    currentTime.add(new BN(duration.days(100))).toNumber(),
                    expiryTime + duration.days(200),
                    validFrom,
                    validTo,
                    nonce,
                    sig,
                    {
                        from: account_investor2,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should sign with token owner key", async () => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = await latestTime();
            let validTo = await latestTime() + duration.days(5);
            let nonce = 6;
            const sig = getSignGTMData(
                I_GeneralTransferManager.address,
                account_investor2,
                currentTime.toNumber(),
                currentTime.add(new BN(duration.days(100))).toNumber(),
                expiryTime + duration.days(200),
                validFrom,
                validTo,
                nonce,
                "0x" + token_owner_pk
            );

            await I_GeneralTransferManager.modifyKYCDataSigned(
                account_investor2,
                currentTime.toNumber(),
                currentTime.add(new BN(duration.days(100))).toNumber(),
                expiryTime + duration.days(200),
                validFrom,
                validTo,
                nonce,
                sig,
                {
                    from: account_investor2,
                    gas: 6000000
                }
            )

        });

        it("Should get the permission", async () => {
            let perm = await I_GeneralTransferManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
        });

        it("Should set a budget for the GeneralTransferManager", async () => {
            await I_SecurityToken.changeModuleBudget(I_GeneralTransferManager.address, new BN(10).pow(new BN(19)), true, { from: token_owner });
            await I_PolyToken.getTokens(new BN(10).pow(new BN(19)), token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(10).pow(new BN(19)), { from: token_owner });
        });

        it("should allow authorized people to modify transfer requirements", async () => {
            await I_GeneralTransferManager.modifyTransferRequirements(0, false, true, false, false, { from: token_owner });
            let transferRestrions = await I_GeneralTransferManager.transferRequirements(0);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
        });

        it("should failed in trasfering the tokens", async () => {
            await I_GeneralTransferManager.modifyTransferRequirementsMulti(
                [0, 1, 2],
                [true, false, true],
                [true, true, false],
                [false, false, false],
                [false, false, false],
                { from: token_owner }
            );
            await I_GeneralTransferManager.pause({ from: token_owner });
            await catchRevert(I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("2", "ether")), { from: account_investor2 }));
        });

        it("Should change the Issuance address", async () => {
            let log = await I_GeneralPermissionManager.addDelegate(account_delegate, web3.utils.fromAscii("My details"), { from: token_owner });
            assert.equal(log.logs[0].args._delegate, account_delegate);

            await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"), true, {
                from: token_owner
            });
            let tx = await I_GeneralTransferManager.changeIssuanceAddress(account_investor2, { from: account_delegate });
            assert.equal(tx.logs[0].args._issuanceAddress, account_investor2);
        });

        it("Should unpause the transfers", async () => {
            await I_GeneralTransferManager.unpause({ from: token_owner });

            assert.isFalse(await I_GeneralTransferManager.paused.call());
        });

        it("Should get the init function", async () => {
            let byte = await I_GeneralTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ""), 0);
        });
    });

    describe("WhiteList that addresses", async () => {
        it("Should fail in adding the investors in whitelist", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [expiryTime, expiryTime],
                    {
                        from: account_investor1,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor3, account_investor4],
                    [fromTime],
                    [toTime, toTime],
                    [expiryTime, expiryTime],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime],
                    [expiryTime, expiryTime],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);

            await catchRevert(
                I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [expiryTime],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                )
            );
        });

        it("Should successfully add the investors in whitelist", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);

            let tx = await I_GeneralTransferManager.modifyKYCDataMulti(
                [account_investor3, account_investor4],
                [fromTime, fromTime],
                [toTime, toTime],
                [expiryTime, expiryTime],
                {
                    from: token_owner,
                    gas: 6000000
                }
            );
            assert.equal(tx.logs[1].args._investor, account_investor4);
        });
    });

    describe("Test cases for the getTokensByPartition", async() => {

        it("Should change the transfer requirements", async() => {
            await I_GeneralTransferManager.modifyTransferRequirementsMulti(
                [0, 1, 2],
                [true, false, true],
                [true, true, false],
                [true, false, false],
                [true, false, false],
                { from: token_owner }
            );
        })

        it("Should check the partition balance before changing the canSendAfter & canReceiveAfter", async() => {
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SecurityToken.balanceOf.call(account_investor2)
                ).toString()
                ),
                1
            );
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                0
            );
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                1
            );
        });

        it("Should change the canSendAfter and canRecieveAfter of the investor2", async() => {
            let canSendAfter = await latestTime() + duration.days(10);
            let canRecieveAfter = await latestTime() + duration.days(10);
            let expiryTime = await latestTime() + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                canSendAfter,
                canRecieveAfter,
                expiryTime,
                {
                    from: token_owner,
                    gas: 6000000
                }
            );
            assert.equal(tx.logs[0].args._investor, account_investor2);
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                1
            );

            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                0
            );
        });

        it("Should check the values of partition balance after the GTM pause", async() => {
            await I_GeneralTransferManager.pause({from: token_owner});
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                0
            );

            assert.equal(
                web3.utils.fromWei(
                (
                    await I_GeneralTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), account_investor2, new BN(0))
                ).toString()
                ),
                1
            );
            await I_GeneralTransferManager.unpause({from: token_owner});
        })
    });

    describe("General Transfer Manager Factory test cases", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_GeneralTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_GeneralTransferManagerFactory.getTypes.call())[0], 2);
            assert.equal(
                web3.utils.toAscii(await I_GeneralTransferManagerFactory.name.call()).replace(/\u0000/g, ""),
                "GeneralTransferManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_GeneralTransferManagerFactory.description.call(),
                "Manage transfers using a time based whitelist",
                "Wrong Module added"
            );
            assert.equal(await I_GeneralTransferManagerFactory.title.call(), "General Transfer Manager", "Wrong Module added");
            assert.equal(await I_GeneralTransferManagerFactory.version.call(), "3.0.0");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_GeneralTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "General");
        });
    });

    describe("Dummy STO Factory test cases", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_DummySTOFactory.setupCost.call(), 0);
            assert.equal((await I_DummySTOFactory.getTypes.call())[0], 3);
            assert.equal(
                web3.utils.toAscii(await I_DummySTOFactory.name.call()).replace(/\u0000/g, ""),
                "DummySTO",
                "Wrong Module added"
            );
            assert.equal(await I_DummySTOFactory.description.call(), "Dummy STO", "Wrong Module added");
            assert.equal(await I_DummySTOFactory.title.call(), "Dummy STO", "Wrong Module added");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_DummySTOFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Dummy");
        });

    });

    describe("Test cases for the get functions of the dummy sto", async () => {
        it("Should get the raised amount of ether", async () => {
            assert.equal((await I_DummySTO.getRaised.call(0)).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("Should get the raised amount of poly", async () => {
            assert.equal((await I_DummySTO.getRaised.call(1)).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("Should get the investors", async () => {
            assert.equal((await I_DummySTO.getNumberInvestors.call()).toNumber(), 2);
        });

        it("Should get the listed permissions", async () => {
            let tx = await I_DummySTO.getPermissions.call();
            assert.equal(web3.utils.toAscii(tx[0]).replace(/\u0000/g, ""), "ADMIN");
        });

        it("Should get the amount of tokens sold", async () => {
            assert.equal(await I_DummySTO.getTokensSold.call(), 0);
        });
    });
});

function range1(i) {
    return i ? range1(i - 1).concat(i) : [];
}
function rangeB(i) {
    return i ? rangeB(i - 1).concat(0) : [];
}

function range1(i) {return i?range1(i-1).concat(i):[]}
function rangeB(i) {return i?rangeB(i-1).concat(0):[]}
