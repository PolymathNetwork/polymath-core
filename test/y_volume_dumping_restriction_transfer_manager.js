import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { setUpPolymathNetwork, deployVolumeDumpingRTMAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const VolumeRestrictionTransferManager = artifacts.require('./VolumeDumpingRestrictionTM');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VolumeDumpingRestrictionTransferManager', accounts => {

     // Accounts Variable declaration
     let account_polymath;
     let account_issuer;
     let token_owner;
     let token_owner_pk;
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
    // let P_PercentageTransferManagerFactory;
    let P_VolumeRestrictionTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    // let P_PercentageTransferManager;
    let P_VolumeRestrictionTransferManager;
    let I_GeneralTransferManagerFactory;
    // let I_PercentageTransferManagerFactory;
    let I_VolumeRestrictionTransferManagerFactory;
    let I_GeneralPermissionManager;
    // let I_PercentageTransferManager;
    let I_VolumeRestrictionTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_ModuleRegistryProxy

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
    const initRegFee = web3.utils.toWei("250");

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";
    const STOParameters = ['uint256', 'uint256', 'uint256', 'string'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    let bytesSTO = encodeModuleCall(STOParameters, [latestTime() + duration.seconds(1000), latestTime() + duration.days(40), cap, someString]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[3]

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

        // STEP 4(c): Deploy the VolumeRestrictionTransferManager
        [I_VolumeRestrictionTransferManagerFactory] = await deployVolumeDumpingRTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 4(d): Deploy the VolumeRestrictionTransferManager
        [P_VolumeRestrictionTransferManagerFactory] = await deployVolumeDumpingRTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

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
        VolumeDumpingRestrictionTransferManagerFactory:  ${I_VolumeRestrictionTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
          let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
          I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

    });

    describe("Buy tokens using on-chain whitelist and test dumping them and attempting to transfer", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(1000),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(1000),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('10', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should unsuccessfully attach the VolumeRestrictionTransferManager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner })
            )
        });

        it("Should successfully attach the VolumeRestrictionTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "VolumeRestrictionTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "VolumeDumpingTransferManager",
                "VolumeDumpingTransferManagerFactory module was not added"
            );
            P_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the VolumeRestrictionTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_VolumeRestrictionTransferManagerFactory.address, 0, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "VolumeRestrictionTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "VolumeDumpingTransferManager",
                "VolumeDumpingTransferManagerFactory module was not added"
            );
            I_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[2].args._module);
        });

        it("Should pause the tranfers at transferManager level", async() => {
            let tx = await I_VolumeRestrictionTransferManager.pause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders up to limit", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should unpause the tranfers at transferManager level", async() => {
            await I_VolumeRestrictionTransferManager.unpause({from: token_owner});
        })

        let percent = 10 * Math.pow(10, 16)
        let startTime = 0
        let endTime = latestTime() + duration.years(2);  
        let endTimeFn = (n=1) => latestTime() + duration.years(n);
        let rollingPeriod = 1000

        it("Should prevent creation of a dump restriction where rolling period is zero", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTime, 0, { from: token_owner })
            );
        })

        it("Should prevent creation of a dump restriction where end time is zero", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, 0, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent creation of a dump restriction where user address is empty", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(null, percent, startTime, endTime, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent creation of a dump restriction where percent is zero", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, 0, startTime, endTime, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent creation of a dump restriction where percent is greater than 100", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, (120 * Math.pow(10, 16)), startTime, endTime, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent creation of a dump restriction where the endtime is less than startime", async() => {
            let endTimeNegative = (await web3.eth.getBlock('latest')).timestamp - 10000

            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTimeNegative, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent creation of a dump restriction where the starttime is in the past", async() => {
            let startTimeNegative = (await web3.eth.getBlock('latest')).timestamp - 10000
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTimeNegative, endTime, rollingPeriod, { from: token_owner })

            )
        })

        it("Should prevent creation of a dump restriction where the rolling period is greater than endtime", async() => {
            let rollingPeriod = endTime + 10
            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner })
            )
        })

        it("Should create a dumping restriction", async() => {
            const tx = await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, 0, endTime, rollingPeriod, { from: token_owner });
            const logs = tx.logs[0]
            const startTime = (await web3.eth.getBlock('latest')).timestamp
            // check the add new dumping restriction event emitted
            assert.equal("AddNewVolumeDumping", logs['event'], "Invalid percent");
            assert.equal(endTime, logs['args']['endTime'], "Invalid end time");
            assert.equal(startTime, logs['args']['startTime'], "Invalid start time");
            assert.equal(rollingPeriod, logs['args']['rollingPeriod'], "Invalid rolling period");
        })

        it("Should verify transfer of multiple break up of tokens up to limit in a dumping restriction period", async() => {
            // a readonly transaction
            const result = await I_VolumeRestrictionTransferManager.verifyTransfer.call(account_investor2, 0, web3.utils.toWei('0.9', 'ether'), "", false);
            // enum Result {INVALID, NA, VALID, FORCE_VALID} and we want VALID so it should be 2
            assert.equal(result.toString(), '2')
        })

        it("Should not verify transfer of multiple break up of tokens more than the limit in a dumping restriction period", async() => {
            // a readonly transaction
            const result = await I_VolumeRestrictionTransferManager.verifyTransfer.call(account_investor2, 0, web3.utils.toWei('1', 'ether'), "", false);
            // enum Result {INVALID, NA, VALID, FORCE_VALID} and we want VALID so it should be 2
            assert.equal(result.toString(), '0')
        })

        it("Should allow transfer of multiple break up of tokens up to limit in a dumping restriction period", async() => {
            /**
             * Allows transfers up to 0.9 ether 
             * where user balance is 9 ether
             */
            await I_SecurityToken.changeGranularity(Math.pow(10, 15), {from: token_owner });

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.2', 'ether'), { from: account_investor2 });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.3', 'ether'), { from: account_investor2 });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.4', 'ether'), { from: account_investor2 });
        })



        it("Should get volume restriction details", async() => {
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner })
            assert.equal(percent, result[0].toNumber(), "Failed to modify the percent");
            assert.equal(endTime, result[2].toNumber(), "Failed to modify end time");
            assert.equal(rollingPeriod, result[3].toNumber(), "Failed to modify rolling period");
        })

        it("Should modify volume dumping restriction", async() => {
            let percent = 20
            let startTime = 0
            let endTime = latestTime() + duration.seconds(30);
            let rollingPeriod = 30

            await I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner });
            
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner });

            assert.equal(percent, result[0].toNumber(), "Failed to modify the percent");
            assert.equal(endTime, result[2].toNumber(), "Failed to modify end time");
            assert.equal(rollingPeriod, result[3].toNumber(), "Failed to modify rolling period");
        })

        it("Should prevent exceeding transfer of tokens in dumping restriction period", async () => {
            let balance = (await I_SecurityToken.balanceOf(account_investor1)).toString()
            await catchRevert(
                I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 })
            )
        })

        it("Should be possible to remove a dumping restriction", async() => {
            const tx = await I_VolumeRestrictionTransferManager.removeRestriction(account_investor2,  { from: token_owner });
            const log = tx.logs[0]
            assert.equal(log['event'], "RemoveVolumeDumping", "Failed to remove volume dumping restriction");
            
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner });

            assert.equal(0, result[0].toNumber(), "Failed to remove the dumping restriction");
            assert.equal(0, result[1].toNumber(), "Failed to remove the dumping restriction");
        });


        it("Should prevent modifying of a dump restriction where end time is in past", async() => {
            let percent = 20
            let startTime = 0
            let endTime = latestTime() + duration.years(5);
            let rollingPeriod = 30

            // increase evm time to 30 seconds
            await increaseTime(30)
            await catchRevert(
                I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner })
            )
        })

        it("Should prevent removing of a dump restriction where end time is in past", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.removeRestriction(account_investor2,  { from: token_owner })
            )
        })

        it("Should allow the transfer of all tokens in a dumping restriction if the end time has exceeded", async() => {
            let balance = (await I_SecurityToken.balanceOf(account_investor2)).toString()
            let endTime = latestTime() + duration.seconds(2);

            // transfering the remaning balance
            const result = await I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 });
            assert.equal(result.logs[0].event, "Transfer", message);
            assert.equal(result.logs[0].args['from'], account_investor2, message);
            assert.equal(result.logs[0].args['to'], account_investor1, message);
        })

        it("Should be possible to create multiple volume dumping restrictions at once", async() => {
            const accounts = [account_investor3, account_investor4]
            const percents = [ 10, 20 ]
            const startTimes = [0, 0]
            const endTimes = [endTimeFn(1), endTimeFn(2)]
            const rollingPeriods = [10, 10]

            let result = await I_VolumeRestrictionTransferManager.addDumpingRestrictionMulti(accounts, percents, startTimes, endTimes, rollingPeriods, { from: token_owner });

            for (let account in accounts) {
                result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(accounts[account], { from: token_owner });

                assert.equal(percents[account], result[0].toNumber(), "Failed to create the percent");
                assert.equal(endTimes[account], result[2].toNumber(), "Failed to create end time");
                assert.equal(rollingPeriods[account], result[3].toNumber(), "Failed to create rolling period");
            }
        })

        it("Should revert if the parameters are bad when modifying multiple volume dumping restrictions", async() => {
            const accounts = [account_investor3, account_investor4]
            const percents = [10]
            const startTimes = [(await web3.eth.getBlock('latest')).timestamp+10, 0]
            const endTimes = [endTimeFn(1), endTimeFn(2)]
            const rollingPeriods = [30]

            await catchRevert(
                I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestrictionMulti(accounts, percents, startTimes, endTimes, rollingPeriods, { from: token_owner })
            )
        })

        it("Should be possible to modify multiple volume dumping restrictions at once", async() => {
            const accounts = [account_investor3, account_investor4]
            const percents = [ 20, 30 ]
            const startTimes = [0, (await web3.eth.getBlock('latest')).timestamp+100]
            const endTimes = [endTimeFn(1), endTimeFn(2)]
            const rollingPeriods = [20, 20]

            let result = await I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestrictionMulti(accounts, percents, startTimes, endTimes, rollingPeriods, { from: token_owner });

            for (let account in accounts) {
                result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(accounts[account], { from: token_owner });

                assert.equal(percents[account], result[0].toNumber(), "Failed to modify the percent");
                assert.equal(endTimes[account], result[2].toNumber(), "Failed to modify end time");
                assert.equal(rollingPeriods[account], result[3].toNumber(), "Failed to modify rolling period");
            }
        })

        it("Should revert if the parameters are bad when removing multiple volume dumping restrictions", async() => {
            await catchRevert(
                I_VolumeRestrictionTransferManager.removeRestrictionMulti([], { from: token_owner })
            )
        })

        it("Should be possible to remove multiple volume dumping restrictions at once", async() => {
            const accounts = [account_investor3, account_investor4]

            let result = await I_VolumeRestrictionTransferManager.removeRestrictionMulti(accounts, { from: token_owner });

            for (let account in accounts) {
                result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(accounts[account], { from: token_owner });

                assert.equal(0, result[0].toNumber(), "Failed to remove the percent");
                assert.equal(0, result[2].toNumber(), "Failed to remove end time");
                assert.equal(0, result[3].toNumber(), "Failed to remove rolling period");
            }
        })

        it("Should revert if the parameters are bad when creating multiple volume dumping restrictions", async() => {
            const accounts = [account_investor3, account_investor4]
            const percents  = [ 10 ]
            const startTimes = [(await web3.eth.getBlock('latest')).timestamp+10, 0]
            const endTimes = [endTimeFn(1), endTimeFn(2)]
            const rollingPeriods = [30]

            await catchRevert(
                I_VolumeRestrictionTransferManager.addDumpingRestrictionMulti(
                    accounts, 
                    percents, 
                    startTimes, 
                    endTimes, 
                    rollingPeriods, 
                    { from: token_owner })
            )
        })

        it("Should get configuration function signature", async() => {
            let sig = await I_VolumeRestrictionTransferManager.getInitFunction.call();
            assert.equal(web3.utils.hexToNumber(sig), 0);
        });

        it("Should get the permission", async() => {
            let perm = await I_VolumeRestrictionTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

    });

    describe("VolumeDumping Restriction Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_VolumeRestrictionTransferManagerFactory.getTypes.call())[0], 2);
            assert.equal(web3.utils.toAscii(await I_VolumeRestrictionTransferManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "VolumeDumpingTransferManager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getDescription.call(),
                        "Manage the volume of tokens dumpable by an owner",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getTitle.call(),
                        "Volume Dumping Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getInstructions.call(),
                        "Allows an issuer to restrict the total number of tokens dumpable withing a rolling period",
                        "Wrong Module added");
        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_VolumeRestrictionTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "VolumeDumping");
        });
    });

});
