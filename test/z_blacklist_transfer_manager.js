import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployBlacklistTMAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const BlacklistTransferManager = artifacts.require("./BlacklistTransferManager");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require('web3');
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('BlacklistTransferManager', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_BlacklistTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_BlacklistTransferManager;
    let P_BlacklistTransferManagerFactory;
    let P_BlacklistTransferManager;
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

    // BlacklistTransferManager details
    const holderCount = 2;           // Maximum number of token holders
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];
    let bytesSTO = encodeModuleCall(['uint256'], [holderCount]);
    let currentTime;

    async function verifyPartitionBalance(investorAddress, lockedValue, unlockedValue) {
        assert.equal(
            web3.utils.fromWei(
                (
                    await I_BlacklistTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), investorAddress, new BN(0))
                ).toString()
            ),
            lockedValue
        );

        assert.equal(
            web3.utils.fromWei(
                (
                    await I_BlacklistTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), investorAddress, new BN(0))
                ).toString()
            ),
            unlockedValue
        );
    }

    before(async() => {
        currentTime = new BN(await latestTime());
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[5];
        account_investor5 = accounts[6];

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, new BN(0));

        // STEP 3(a): Deploy the PercentageTransferManager
        [I_BlacklistTransferManagerFactory] = await deployBlacklistTMAndVerified(account_polymath, I_MRProxied, new BN(0));

        // STEP 4(b): Deploy the PercentageTransferManager
        [P_BlacklistTransferManagerFactory] = await deployBlacklistTMAndVerified(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500", "ether")));
        // ----------- POLYMATH NETWORK Configuration ------------

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

        BlacklistTransferManagerFactory:   ${I_BlacklistTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should initialize the auto attached modules", async () => {
           let moduleData = (await stGetter.getModulesByType(2))[0];
           I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);

        });

        it("Should successfully attach the BlacklistTransferManager factory with the security token", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("2000", "ether"), token_owner);
            await catchRevert (
                I_SecurityToken.addModule(P_BlacklistTransferManagerFactory.address, bytesSTO, web3.utils.toWei("2000", "ether"), 0, false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the BlacklistTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("2000", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_BlacklistTransferManagerFactory.address, bytesSTO, web3.utils.toWei("2000", "ether"), 0, false, { from: token_owner });
            assert.equal(tx.logs[3].args._types[0].toString(), transferManagerKey, "BlacklistTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "BlacklistTransferManager",
                "BlacklistTransferManagerFactory module was not added"
            );
            P_BlacklistTransferManager = await BlacklistTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the BlacklistTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_BlacklistTransferManagerFactory.address, bytesSTO, 0, 0, false, { from: token_owner });
            console.log(tx);
            assert.equal(tx.logs[2].args._types[0].toString(), transferManagerKey, "BlacklistTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "BlacklistTransferManager",
                "BlacklistTransferManager module was not added"
            );
            I_BlacklistTransferManager = await BlacklistTransferManager.at(tx.logs[2].args._module);
        });

    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(50))),
                {
                    from: account_issuer
                });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.issue(account_investor1, web3.utils.toWei('5', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toString(),
                web3.utils.toWei('5', 'ether')
            );

        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(50))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, web3.utils.toWei('2', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(50))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor3.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_investor3, web3.utils.toWei('2', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toString(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor4,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(50))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor4.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_investor4, web3.utils.toWei('2', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor4)).toString(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor5,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(50))),
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor5.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_investor5, web3.utils.toWei('2', 'ether'), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor5)).toString(),
                web3.utils.toWei('2', 'ether')
            );
        });


        it("Should add the blacklist", async() => {
            //Add the new blacklist
            currentTime = new BN(await latestTime());
            let tx = await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("a_blacklist"), 20, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._blacklistName), "a_blacklist", "Failed in adding the type in blacklist");
        });

        it("Should fail in adding the blacklist as blacklist type already exist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("a_blacklist"), 20, {
                    from: token_owner
                })
            );
        });

        it("Should fail in adding the blacklist as the blacklist name is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii(""), 20, {
                    from: token_owner
                })
            );
        });

        it("Should fail in adding the blacklist as the start date is invalid", async() => {
           await catchRevert(
               I_BlacklistTransferManager.addBlacklistType(0, currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, {
                   from: token_owner
                })
            );
        });

        it("Should fail in adding the blacklist as the dates are invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(4000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, {
                    from: token_owner
                })
            );
        });

        it("Should fail in adding the blacklist because only owner can add the blacklist", async() => {
           await catchRevert(
               I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, {
                   from: account_investor1
                })
            );
        });

        it("Should fail in adding the blacklist because repeat period is less than the difference of start time and end time", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(duration.days(2))), web3.utils.fromAscii("b_blacklist"), 1, {
                    from: token_owner
                 })
             );
         });

        it("Should add the mutiple blacklist", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(2000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(8000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist")];
            let repeatTime = [15,30];
            let tx = await I_BlacklistTransferManager.addBlacklistTypeMulti(startTime, endTime, name, repeatTime, { from: token_owner });

            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let blacklistName = event_data[i].args._blacklistName;
                assert.equal(web3.utils.hexToUtf8(blacklistName), web3.utils.hexToUtf8(name[i]), "Failed in adding the blacklist");
            }
        });

        it("Should fail in adding the mutiple blacklist because only owner can add it", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(2000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(8000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist")];
            let repeatTime = [15,30];
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistTypeMulti(startTime, endTime, name, repeatTime, {
                    from: account_investor1
                })
            );
        });

        it("Should fail in adding the mutiple blacklist because array lenth are different", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(2000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(8000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist"),web3.utils.fromAscii("w_blacklist")];
            let repeatTime = [15,30];
            await catchRevert(
                I_BlacklistTransferManager.addBlacklistTypeMulti(startTime, endTime, name, repeatTime, {
                    from: token_owner
                })
            );
        });

        it("Should modify the blacklist", async() => {
            //Modify the existing blacklist
            let tx = await I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(2000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("a_blacklist"), 20, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._blacklistName), "a_blacklist", "Failed in modifying the startdate of blacklist");

        });

        it("Should fail in modifying the blacklist as the name is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(2000)), currentTime.add(new BN(3000)), web3.utils.fromAscii(""), 20, {
                    from: token_owner
                })
            );
        });

        it("Should fail in modifying the blacklist as the dates are invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(4000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, {
                    from: token_owner
                })
            );
        });

        it("Should fail in modifying the blacklist as the repeat in days is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(2000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 0, {
                    from: token_owner
                })
            );
        });


        it("Should fail in modifying the blacklist as only owner can modify the blacklist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("a_blacklist"), 20, {
                    from: account_investor1
                })
            );
        });

        it("Should fail in modifying the blacklist as blacklist type doesnot exist", async() => {
           await catchRevert(
               I_BlacklistTransferManager.modifyBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, {
                   from: token_owner
                })
            );
        });

        it("Should modify the mutiple blacklist", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(3000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(7000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist")];
            let repeatTime = [15,30];
            let tx = await I_BlacklistTransferManager.modifyBlacklistTypeMulti(startTime, endTime, name, repeatTime, { from: token_owner });

            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let blacklistName = event_data[i].args._blacklistName;
                assert.equal(web3.utils.hexToUtf8(blacklistName), web3.utils.hexToUtf8(name[i]), "Failed in adding the blacklist");
            }
        });

        it("Should fail in modifying the mutiple blacklist because only owner can add it", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(3000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(7000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist")];
            let repeatTime = [15,30];
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistTypeMulti(startTime, endTime, name, repeatTime, {
                    from: account_investor1
                })
            );
        });

        it("Should fail in modifying the mutiple blacklist because array length are different", async() => {
            //Add the new blacklist
            let startTime = [currentTime.add(new BN(3000)),currentTime.add(new BN(3000))];
            let endTime = [currentTime.add(new BN(5000)),currentTime.add(new BN(7000))];
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist"),web3.utils.fromAscii("w_blacklist")];
            let repeatTime = [15,30];
            await catchRevert(
                I_BlacklistTransferManager.modifyBlacklistTypeMulti(startTime, endTime, name, repeatTime, {
                    from: token_owner
                })
            );
        });

        it("Should add investor to the blacklist", async() => {
            //Add investor to the existing blacklist
            let tx = await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, web3.utils.fromAscii("a_blacklist"), { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor to the blacklist");

        });

        it("Should fail in adding the investor to the blacklist because only owner can add the investor", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("a_blacklist"), {
                    from: account_investor1
                })
            );
        });

        it("Should fail in adding the investor to the blacklist as investor address is invalid", async() => {
           await catchRevert(
               I_BlacklistTransferManager.addInvestorToBlacklist("0x0000000000000000000000000000000000000000", web3.utils.fromAscii("a_blacklist"), {
                   from: token_owner
                })
            );
        });


        it("Should fail in adding the investor to the non existing blacklist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("b_blacklist"), {
                    from: token_owner
                })
            );
        });

        it("Should get the list of investors associated to blacklist", async() => {
            let perm = await I_BlacklistTransferManager.getListOfAddresses.call(web3.utils.fromAscii("a_blacklist"));
            assert.equal(perm.length, 1);
        });

        it("Should fail in getting the list of investors from the non existing blacklist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.getListOfAddresses.call(web3.utils.fromAscii("b_blacklist"))
            );
        });

        it("Should investor be able to transfer token because current time is less than the blacklist start time", async() => {
            //Trasfer tokens
            await verifyPartitionBalance(account_investor1, 0, 5);
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('3', 'ether')
            );
        });

        it("Should investor be able to transfer token as it is not in blacklist time period", async() => {
            // Jump time
            await increaseTime(duration.seconds(4000));
            await verifyPartitionBalance(account_investor1, 0, 4);
            //Trasfer tokens
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('4', 'ether')
            );
        });

        it("Should fail in transfer the tokens as the investor in blacklist", async() => {
            // Jump time
            await increaseTime(duration.days(20) - 1500);
            await verifyPartitionBalance(account_investor1, 3, 0);
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), {
                    from: account_investor1
                })
            );
        });

        it("Should investor is able transfer the tokens- because BlacklistTransferManager is paused", async() => {
            await I_BlacklistTransferManager.pause({from:token_owner});
            await verifyPartitionBalance(account_investor1, 0, 3);
            //Trasfer tokens
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                web3.utils.toWei('5', 'ether')
            );
            await verifyPartitionBalance(account_investor1, 0, 2);
        });

        it("Should investor fail in transfer token as it is in blacklist time period", async() => {

            await I_BlacklistTransferManager.unpause({from:token_owner});
            await verifyPartitionBalance(account_investor1, 2, 0);
            currentTime = new BN(await latestTime());
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(500)), currentTime.add(new BN(4000)), web3.utils.fromAscii("k_blacklist"), 8, { from: token_owner });

            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("k_blacklist"), { from: token_owner });
            // Jump time
            await increaseTime(3500);

            //Trasfer tokens
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), {
                    from: account_investor2
                })
            )
        });

        it("Should investor be able to transfer token as it is not in blacklist time period", async() => {
            // Jump time
            await increaseTime(1000);

            //Trasfer tokens
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toString(),
                web3.utils.toWei('3', 'ether')
            );
        });

        it("Should investor fail in transfer token as it is in blacklist time period", async() => {

            // Jump time
            await increaseTime(duration.days(8) - 1000);
            //Trasfer tokens
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), {
                    from: account_investor2
                })
            );
        });

        it("Should investor fail in transfer token as it is in blacklist time period", async() => {
            currentTime = new BN(await latestTime());
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(5000)), currentTime.add(new BN(8000)), web3.utils.fromAscii("l_blacklist"), 5, { from: token_owner });

            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor3, web3.utils.fromAscii("l_blacklist"), { from: token_owner });
            // Jump time
            await increaseTime(5500);

            //Trasfer tokens
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei('1', 'ether'), {
                    from: account_investor3
                })
            );
        });

        it("Should investor be able to transfer token as it is not in blacklist time period", async() => {
            // Jump time
            await increaseTime(3000);

            //Trasfer tokens
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei('1', 'ether'), { from: account_investor3 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor4)).toString(),
                web3.utils.toWei('3', 'ether')
            );
        });

        it("Should investor fail in transfer token as it is in blacklist time period", async() => {

            // Jump time
            await increaseTime(duration.days(5) - 3000);
            //Trasfer tokens
            await catchRevert(
                 I_SecurityToken.transfer(account_investor4, web3.utils.toWei('1', 'ether'), {
                    from: account_investor3
                })
            );
        });


        it("Should delete the blacklist type", async() => {
            currentTime = new BN(await latestTime());
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteBlacklistType(web3.utils.fromAscii("b_blacklist"), { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._blacklistName), "b_blacklist", "Failed in deleting the blacklist");

        });

        it("Only owner have the permission to delete the blacklist type", async() => {
            currentTime = new BN(await latestTime());
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("b_blacklist"), 20, { from: token_owner });
            await catchRevert(
                I_BlacklistTransferManager.deleteBlacklistType(web3.utils.fromAscii("b_blacklist"), {
                    from: account_investor1
                })
            );
        });

        it("Should fail in deleting the blacklist type as the blacklist has associated addresses", async() => {
          await catchRevert(
                I_BlacklistTransferManager.deleteBlacklistType(web3.utils.fromAscii("a_blacklist"), {
                  from: token_owner
                })
            );
        });

        it("Should fail in deleting the blacklist type as the blacklist doesnot exist", async() => {
           await catchRevert(
               I_BlacklistTransferManager.deleteBlacklistType(web3.utils.fromAscii("c_blacklist"), {
                   from: token_owner
                })
            );
        });

        it("Should delete the mutiple blacklist type", async() => {
            let name = [web3.utils.fromAscii("y_blacklist"),web3.utils.fromAscii("z_blacklist")];
            let tx = await I_BlacklistTransferManager.deleteBlacklistTypeMulti(name, { from: token_owner });

            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let blacklistName = event_data[i].args._blacklistName;
                assert.equal(web3.utils.hexToUtf8(blacklistName), web3.utils.hexToUtf8(name[i]), "Failed in deleting the blacklist");
            }

        });

        it("Should fail in deleting multiple blacklist type because only owner can do it.", async() => {
            let name = [web3.utils.fromAscii("b_blacklist"),web3.utils.fromAscii("a_blacklist")];
            await catchRevert(
                I_BlacklistTransferManager.deleteBlacklistTypeMulti(name, {
                    from: account_investor1
                })
            );
        });

        it("Should delete the investor from all the associated blacklist", async() => {
            currentTime = new BN(await latestTime());
            let data = await I_BlacklistTransferManager.getBlacklistNamesToUser.call(account_investor1);
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("g_blacklist"), 20, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor1, { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in deleting the investor from the blacklist");
        });

        it("Only owner has the permission to delete the investor from all the blacklist type", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1,web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor1, {
                    from: account_investor2
                })
            )
        });

        it("Should fail in deleting the investor from all the associated blacklist as th address is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromAllBlacklist("0x0000000000000000000000000000000000000000", {
                    from: token_owner
                })
            );
        });

        it("Should fail in deleting the investor because investor is not associated to any blacklist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor5, {
                    from: token_owner
                })
            );
        });

        it("Should delete the mutiple investor from all the associated blacklist", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor5, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            let investor = [account_investor5,account_investor2];
            let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklistMulti(investor, { from: token_owner });
            let event_data = tx.logs;
            assert.equal(event_data[0].args._investor, investor[0], "Failed in deleting the blacklist");
            assert.equal(event_data[1].args._investor, investor[1], "Failed in deleting the blacklist");
            assert.equal(event_data[2].args._investor, investor[1], "Failed in deleting the blacklist");
        });

        it("Should fail in deleting the mutiple investor from all the associated blacklist because only owner can do it.", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor5, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            let investor = [account_investor5,account_investor2];
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromAllBlacklistMulti(investor, {
                    from: account_investor1
                })
            );
        });

        it("Should delete the mutiple investor from particular associated blacklists", async() => {
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("s_blacklist"), 20, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor5, web3.utils.fromAscii("s_blacklist"), { from: token_owner });
            // await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, "g_blacklist", { from: token_owner });
            let investor = [account_investor5,account_investor2];
            let blacklistName = [web3.utils.fromAscii("s_blacklist"),web3.utils.fromAscii("g_blacklist")];
            let tx = await I_BlacklistTransferManager.deleteMultiInvestorsFromBlacklistMulti(investor,blacklistName, { from: token_owner });
            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let investorName = event_data[i].args._investor;
                assert.equal(investorName.toLowerCase(), investor[i].toLowerCase(), "Failed in deleting the blacklist");
            }
        });

        it("Should fail in deleting the mutiple investor from particular associated blacklist because only owner can do it.", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor5, web3.utils.fromAscii("s_blacklist"), { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, web3.utils.fromAscii("g_blacklist"), { from: token_owner });
            let investor = [account_investor5,account_investor2];
            let blacklistName = [web3.utils.fromAscii("s_blacklist"),web3.utils.fromAscii("g_blacklist")];
            await catchRevert(
                I_BlacklistTransferManager.deleteMultiInvestorsFromBlacklistMulti(investor,blacklistName, {
                    from: account_investor1
                })
            );
        });

        it("Should fail in deleting the mutiple investor from particular associated blacklist because array length is incorrect.", async() => {
            let investor = [account_investor5];
            let blacklistName = [web3.utils.fromAscii("s_blacklist"),web3.utils.fromAscii("g_blacklist")];
            await catchRevert(
                I_BlacklistTransferManager.deleteMultiInvestorsFromBlacklistMulti(investor,blacklistName, {
                    from: token_owner
                })
            );
        });

        it("Should delete the investor from the blacklist type", async() => {
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("f_blacklist"), 20, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor5, web3.utils.fromAscii("f_blacklist"), { from: token_owner });
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(500)), currentTime.add(new BN(8000)),  web3.utils.fromAscii("q_blacklist"), 10, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1,  web3.utils.fromAscii("q_blacklist"), { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in deleting the investor from the blacklist");

        });

        it("Only owner can delete the investor from the blacklist type", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), { from: token_owner });
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), {
                    from: account_investor2
                })
            );
        });

        it("Should fail in deleting the investor because the investor address is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromBlacklist("0x0000000000000000000000000000000000000000", web3.utils.fromAscii("f_blacklist"), {
                    from: token_owner
                })
            );
        });

        it("Should fail in deleting the investor because the investor is not associated to blacklist", async() => {
            await I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), { from: token_owner });
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, web3.utils.fromAscii("f_blacklist"), {
                    from: token_owner
                })
            );
        });

        it("Should fail in deleting the investor because the blacklist name is invalid", async() => {
            await catchRevert(
                I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, web3.utils.fromAscii(""), {
                    from: token_owner
                })
            );
        });

        it("Should add investor and new blacklist type", async() => {
            let tx = await I_BlacklistTransferManager.addInvestorToNewBlacklist(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("c_blacklist"), 20, account_investor3, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._blacklistName), "c_blacklist", "Failed in adding the blacklist");
            assert.equal(tx.logs[1].args._investor, account_investor3, "Failed in adding the investor to blacklist");

        });

        it("Should fail in adding the investor and new blacklist type", async() => {
          await catchRevert(
              I_BlacklistTransferManager.addInvestorToNewBlacklist(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("c_blacklist"), 20, account_investor3, {
                  from: account_investor2
                })
            );
        });

        it("Should add mutiple investor to blacklist", async() => {
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("d_blacklist"), 20, { from: token_owner });
            let investor = [account_investor4,account_investor5];
            let tx = await I_BlacklistTransferManager.addInvestorToBlacklistMulti([account_investor4,account_investor5], web3.utils.fromAscii("d_blacklist"), { from: token_owner });

            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let user = event_data[i].args._investor;
                assert.equal(user, investor[i], "Failed in adding the investor to blacklist");
            }

        });

        it("Should fail in adding the mutiple investor to the blacklist", async() => {
            await catchRevert(
                I_BlacklistTransferManager.addInvestorToBlacklistMulti([account_investor4,account_investor5], web3.utils.fromAscii("b_blacklist"), {
                    from: account_investor1
                })
            );
        });

        it("Should add mutiple investor to the mutiple blacklist", async() => {
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("m_blacklist"), 20, { from: token_owner });
            await I_BlacklistTransferManager.addBlacklistType(currentTime.add(new BN(1000)), currentTime.add(new BN(3000)), web3.utils.fromAscii("n_blacklist"), 20, { from: token_owner });
            let investor = [account_investor4,account_investor5];
            let blacklistName =[web3.utils.fromAscii("m_blacklist"),web3.utils.fromAscii("n_blacklist")];
            let tx = await I_BlacklistTransferManager.addMultiInvestorToBlacklistMulti(investor, blacklistName, { from: token_owner });

            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let user = event_data[i].args._investor;
                let blacklist = event_data[i].args._blacklistName;
                assert.equal(user, investor[i], "Failed in adding the investor to blacklist");
                assert.equal(web3.utils.hexToUtf8(blacklist), web3.utils.hexToUtf8(blacklistName[i]), "Failed in adding the investor to blacklist");
            }

        });

        it("Should fail in adding the mutiple investor to the mutiple blacklist because only owner can do it.", async() => {
            let investor = [account_investor4,account_investor5];
            let blacklistName = [ web3.utils.fromAscii("m_blacklist"), web3.utils.fromAscii("n_blacklist")];
            await I_BlacklistTransferManager.deleteMultiInvestorsFromBlacklistMulti(investor,blacklistName, { from: token_owner });
            await catchRevert(
                I_BlacklistTransferManager.addMultiInvestorToBlacklistMulti(investor, blacklistName, {
                    from: account_investor1
                })
            );
        });

        it("Should fail in adding mutiple investor to the mutiple blacklist because array length is not same", async() => {
            let investor = [account_investor4,account_investor5];
            let blacklistName =[web3.utils.fromAscii("m_blacklist")];
            await catchRevert(
                I_BlacklistTransferManager.addMultiInvestorToBlacklistMulti(investor, blacklistName, {
                    from: token_owner
                })
            );
        });

        it("Should get the init function", async() => {
            let byte = await I_BlacklistTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ''), 0);
        });

        it("Should get the permission", async() => {
            let perm = await I_BlacklistTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });
    });

    describe("Test cases for blacklist with repeat period 0 (Never repeat)", async() => {
        it("Should add a new blacklist with no repeat time", async() => {
            let curTime = await latestTime();
            await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor3, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToNewBlacklist(
                new BN(curTime).add(new BN(100)),
                new BN(curTime).add(new BN(1000)),
                web3.utils.fromAscii("anewbl"),
                0,
                account_investor3,
                { from: token_owner}
            );
            await increaseTime(200);
            await catchRevert(I_SecurityToken.transfer(account_investor4, web3.utils.toWei('1', 'ether'), { from: account_investor3 }));
        });

        it("Should allow transfer after blacklist end time", async() => {
            await increaseTime(2000);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei('1', 'ether'), { from: account_investor3 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor4)).toString(),
                web3.utils.toWei('4', 'ether')
            );
        });
    });

    describe("Test cases for the factory", async() => {
        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_BlacklistTransferManagerFactory.setupCost.call(),0);
            assert.equal((await I_BlacklistTransferManagerFactory.getTypes.call())[0],2);
            assert.equal(web3.utils.toAscii(await I_BlacklistTransferManagerFactory.name.call())
                        .replace(/\u0000/g, ''),
                        "BlacklistTransferManager",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.description.call(),
                        "Automate blacklist to restrict selling",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.title.call(),
                        "Blacklist Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.version.call(),
                        "3.0.0",
                        "Wrong Module added");

        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_BlacklistTransferManagerFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Blacklist");
            });
    });

});
