import latestTime from './helpers/latestTime';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployVRTMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const VolumeRestrictionTM = artifacts.require('./VolumeRestrictionTM.sol');
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require('web3');
const BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VolumeRestrictionTransferManager', accounts => {

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
    let account_delegate2;
    let account_delegate3;
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_VolumeRestrictionTMFactory;
    let P_VolumeRestrictionTMFactory;
    let I_SecurityTokenRegistryProxy;
    let P_VolumeRestrictionTM;
    let I_GeneralTransferManagerFactory;
    let I_VolumeRestrictionTM;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
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
    const delegateDetails = web3.utils.toHex("Hello I am legit delegate");

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    let tempAmount = new BN(0);
    let tempArray = new Array();
    let tempArray3 = new Array();
    let tempArrayGlobal = new Array();
    let delegateArray = new Array();

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    const address_zero = "0x0000000000000000000000000000000000000000";

    async function print(data, account) {
        console.log(`
            Latest timestamp: ${data[0].toString()}
            SumOfLastPeriod: ${web3.utils.fromWei(data[1]).toString()}
            Days Covered: ${data[2].toString()}
            Latest timestamp daily: ${data[3].toString()}
            Individual Total Trade on latestTimestamp : ${web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[0]))
                .toString()}
            Individual Total Trade on daily latestTimestamp : ${web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[3]))
                .toString()}
            Last Transaction time in UTC: ${(new Date((data[4].toNumber()) * 1000 )).toUTCString()}
        `)
    }

    async function getLatestTime() {
      return new BN(await latestTime());
    }

    async function printRestrictedData(data) {
        let investors = data[0];
        for (let i = 0 ; i < investors.length; i++) {
            console.log(`
                Token holder:   ${data[0][i]}
                Start Time:  ${data[2][i].toString()}
                Rolling Period In Days: ${data[3][i].toString()}
                End Time : ${data[4][i].toString()}
                Allowed Tokens: ${web3.utils.fromWei(data[1][i].toString())}
                Type of Restriction: ${data[5][i].toString()}
            `)
        }
    }

    async function calculateSum(rollingPeriod, tempArray) {
        let sum = 0;
        let start = 0;
        if (tempArray.length >= rollingPeriod)
            start = tempArray.length - rollingPeriod;
        for (let i = start; i < tempArray.length; i++) {
            sum += tempArray[i];
        }
        return sum;
    }

    async function verifyPartitionBalance(investorAddress, lockedValue, unlockedValue) {
        assert.equal(
            web3.utils.fromWei(
                (
                    await I_VolumeRestrictionTM.getTokensByPartition.call(web3.utils.toHex("LOCKED"), investorAddress, new BN(0))
                ).toString()
            ),
            lockedValue
        );

        assert.equal(
            web3.utils.fromWei(
                (
                    await I_VolumeRestrictionTM.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), investorAddress, new BN(0))
                ).toString()
            ),
            unlockedValue
        );
    }

    async function setTime() {
        let currentTime = await getLatestTime();
        let currentHour = (new Date(currentTime.toNumber() * 1000)).getUTCHours();
        console.log(`Earlier time ${new Date((await getLatestTime()).toNumber() * 1000).toUTCString()}`);
        await increaseTime(duration.hours(24 - currentHour));
        console.log(`Current time ${new Date((await getLatestTime()).toNumber() * 1000).toUTCString()}`);
    }

    before(async() => {
        let newLatestTime = await getLatestTime();
        fromTime = newLatestTime;
        toTime = newLatestTime;
        expiryTime = toTime.add(new BN(duration.days(15)));
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_investor3 = accounts[4];
        account_investor4 = accounts[3];
        account_delegate = accounts[7];
        account_delegate2 = accounts[6];
        account_delegate3 = accounts[5];

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

        // STEP 5: Deploy the VolumeRestrictionTMFactory
        [I_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 6: Deploy the VolumeRestrictionTMFactory
        [P_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy                ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        VolumeRestrictionTMFactory:        ${I_VolumeRestrictionTMFactory.address}
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

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, true, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Attach the VRTM", async() => {
        it("Deploy the VRTM and attach with the ST", async()=> {
            let tx = await I_SecurityToken.addModule(I_VolumeRestrictionTMFactory.address, "0x0", new BN(0), new BN(0), false, {from: token_owner });
            assert.equal(tx.logs[2].args._moduleFactory, I_VolumeRestrictionTMFactory.address);
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "VolumeRestrictionTM",
                "VolumeRestrictionTMFactory doesn not added");
            I_VolumeRestrictionTM = await VolumeRestrictionTM.at(tx.logs[2].args._module);
        });

        it("Transfer some tokens to different account", async() => {
            // Add tokens in to the whitelist
            let newLatestTime = await getLatestTime();
            await I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor1, account_investor2, account_investor3],
                    [newLatestTime, newLatestTime, newLatestTime],
                    [newLatestTime, newLatestTime, newLatestTime],
                    [newLatestTime.add(new BN(duration.days(60))), newLatestTime.add(new BN(duration.days(60))), newLatestTime.add(new BN(duration.days(60)))],
                    {
                        from: token_owner
                    }
            );

            // Mint some tokens and transferred to whitelisted addresses
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("40", "ether")), "0x0", {from: token_owner});
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("30", "ether")), "0x0", {from: token_owner});
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("30", "ether")), "0x0", {from: token_owner});

            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            let bal2 = await I_SecurityToken.balanceOf.call(account_investor2);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toString()).toString()), 40);
            assert.equal(web3.utils.fromWei((bal2.toString()).toString()), 30);

        });

        it("Should transfer the tokens freely without any restriction", async() => {
            await verifyPartitionBalance(account_investor1, 0, 40);
            console.log(
                await I_SecurityToken.canTransfer.call(account_investor3, new BN(web3.utils.toWei('5', 'ether')), "0x0", {from: account_investor1})
            )
            console.log(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString()));
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei('5', 'ether')), { from: account_investor1 });
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor3);
             // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toString()).toString()), 35);
        });
    })

    describe("Test for the addIndividualRestriction", async() => {
        it("Should add the restriction -- failed because of bad owner", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("12")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    0,
                    {
                        from: account_polymath
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid restriction type", async() => {
            let newLatestTime = await getLatestTime();

            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("12")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    3,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Invalid value of allowed tokens", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    0,
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Percentage of tokens not within (0,100]", async() => {
            let newLatestTime = await getLatestTime();

            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    0,
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Percentage of tokens not within (0,100]", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid dates", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.sub(new BN(duration.seconds(5))),
                    3,
                    newLatestTime.add(new BN(duration.days(10))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid dates", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.add(new BN(duration.days(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(1))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.add(new BN(duration.days(2))),
                    0,
                    newLatestTime.add(new BN(duration.days(10))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.add(new BN(duration.days(2))),
                    366,
                    newLatestTime.add(new BN(duration.days(10))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("10")),
                    newLatestTime.add(new BN(duration.days(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(3))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction succesfully", async() => {
            let newLatestTime = await getLatestTime();
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("12")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(5))),
                    0,
                    {
                        from: token_owner
                    }
                );
            assert.equal(tx.logs[0].args._holder, account_investor1);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should add the restriction for multiple investor -- failed because of bad owner", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3,4,5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: account_polymath
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3,4,5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3,4,5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: account_polymath
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3,4,5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3, 4, 5],
                    [newLatestTime.add(new BN(duration.days(5)))],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2))), newLatestTime.add(new BN(duration.seconds(2)))],
                    [3, 4, 5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor successfully", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [new BN(web3.utils.toWei("12")), new BN(web3.utils.toWei("10")), new BN(web3.utils.toWei("15"))],
                    [0, 0, 0],
                    [3, 4, 5],
                    [newLatestTime.add(new BN(duration.days(5))), newLatestTime.add(new BN(duration.days(6))), newLatestTime.add(new BN(duration.days(7)))],
                    [0,0,0],
                    {
                        from: token_owner
                    }
            );
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor2))[2].toString(), 3);
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate3))[2].toString(), 4);
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor4))[2].toString(), 5);

            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 4);
        });

        it("Should remove the restriction multi -- failed because of address is 0", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.removeIndividualRestrictionMulti(
                    [address_zero, account_delegate3, account_investor4],
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should successfully remove the restriction", async() => {
            await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor2, {from: token_owner});
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor2))[3].toString(), 0);
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 3);
            for (let i = 0; i < data[0].length; i++) {
                assert.notEqual(data[0][i], account_investor2);
            }
        });

        it("Should remove the restriction -- failed because restriction not present anymore", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.removeIndividualRestriction(account_investor2, {from: token_owner})
            );
        });

        it("Should remove the restriction multi", async() => {
            await I_VolumeRestrictionTM.removeIndividualRestrictionMulti(
                [account_delegate3, account_investor4],
                {
                    from: token_owner
                }
            )
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 1);
        });

        it("Should add the restriction succesfully after the expiry of previous one for investor 1", async() => {
            await increaseTime(duration.days(5.1));
            let newLatestTime = await getLatestTime();
            console.log(
                `Estimated gas for addIndividualRestriction:
                ${await I_VolumeRestrictionTM.addIndividualRestriction.estimateGas(
                    account_investor1,
                    new BN(web3.utils.toWei("12")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(6))),
                    0,
                    {
                        from: token_owner
                    }
                )}
                `);
            newLatestTime = await getLatestTime();
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    new BN(web3.utils.toWei("12")),
                    newLatestTime.add(new BN(duration.seconds(2))),
                    3,
                    newLatestTime.add(new BN(duration.days(6))),
                    0,
                    {
                        from: token_owner
                    }
                );

            assert.equal(tx.logs[1].args._holder, account_investor1);
            assert.equal(tx.logs[1].args._typeOfRestriction, 0);
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 1);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should not successfully transact the tokens -- failed because volume is above the limit", async() => {
            await increaseTime(duration.seconds(10));
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("13")), { from: account_investor1})
            );
        });

        it("Should succesfully transact the tokens by investor 1 just after the startTime", async() => {
            // Check the transfer will be valid or not by calling the verifyTransfer() directly by using _isTransfer = false
            let result = await I_VolumeRestrictionTM.verifyTransfer.call(account_investor1, account_investor3, new BN(web3.utils.toWei('.3', "ether")), "0x0");
            assert.equal(result[0].toString(), 1);
            // Perform the transaction
            console.log(`
                Gas estimation (Individual): ${await I_SecurityToken.transfer.estimateGas(account_investor3, new BN(web3.utils.toWei('.3', "ether")), {from: account_investor1})}`
            );
            // Back and forth verifying the partition balances
            await verifyPartitionBalance(account_investor1, 23, 12);
            await I_VolumeRestrictionTM.pause({from: token_owner});
            await verifyPartitionBalance(account_investor1, 0, 35);
            await I_VolumeRestrictionTM.unpause({from: token_owner});
            await verifyPartitionBalance(account_investor1, 23, 12);

            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei('.3')), {from: account_investor1});
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toString()).toString()), 34.7);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);
            assert.equal(
                web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor1, data[0])),
                0.3
            );
            assert.equal(
                data[0].toString(),
                (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor1))[1].toString()
            );
            assert.equal(web3.utils.fromWei(data[1].toString()), 0.3);
            tempArray.push(0.3);
        });

        it("Should fail to add the individual daily restriction -- Bad msg.sender", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    new BN(web3.utils.toWei("6")),
                    newLatestTime.add(new BN(duration.seconds(1))),
                    newLatestTime.add(new BN(duration.days(4))),
                    0,
                    {
                        from: account_investor1
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    new BN(web3.utils.toWei("6")),
                    newLatestTime.add(new BN(duration.seconds(1))),
                    newLatestTime.add(new BN(duration.days(4))),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    0,
                    newLatestTime.add(new BN(duration.seconds(1))),
                    newLatestTime.add(new BN(duration.days(4))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    new BN(web3.utils.toWei("6")),
                    newLatestTime.add(new BN(duration.days(5))),
                    newLatestTime.add(new BN(duration.days(4))),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the individual daily restriction for investor 3", async() => {
            let newLatestTime = await getLatestTime();
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                        account_investor3,
                        new BN(web3.utils.toWei("6")),
                        newLatestTime.add(new BN(duration.seconds(10))),
                        newLatestTime.add(new BN(duration.days(4))),
                        0,
                        {
                            from: token_owner
                        }
                    );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            assert.equal((tx.logs[0].args._allowedTokens).toString(), new BN(web3.utils.toWei("6")));
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 2);
            assert.equal(data[0][1], account_investor3);
            let dataRestriction = await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(18))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
        });

        it("Should transfer the tokens within the individual daily restriction limits", async() => {
            // transfer 2 tokens as per the limit
            await increaseTime(12); // increase 12 seconds to layoff the time gap
            // verify the partition balance
            console.log(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()));
            await verifyPartitionBalance(account_investor3, 29.3, 6);

            let startTime = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3})}
            `)
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3});
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);
            await increaseTime(duration.minutes(15));
            // verify the partition balance
            await verifyPartitionBalance(account_investor3, 29.3, 4);
            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor3})}
            `)
            // transfer the 4 tokens which is under the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor3});
            let newData = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(newData, account_investor3);
            // verify the partition balance
            await verifyPartitionBalance(account_investor3, 29.3, 0);
            assert.equal(newData[3].toString(), data[3].toString());
            assert.equal(data[3].toString(), startTime);
            assert.equal(web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[3]))
            , 6);
        });

        it("Should fail to transfer more tokens --because of the above limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei(".1")), {from: account_investor3})
            );
        });

        it("Should try to send after the one day completion", async() => {
            // increase the EVM time by one day
            await increaseTime(duration.days(1));

            let startTime = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3})}
            `)
            // verify the partition balance
            await verifyPartitionBalance(account_investor3, 23.3, 6);
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3});
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);
            await verifyPartitionBalance(account_investor3, 23.3, 4);
            assert.equal(data[3].toString(), new BN(startTime).add(new BN(duration.days(1))));
            assert.equal(web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[3]))
            , 2);
        });

        it("Should add the daily restriction on the investor 1", async() => {
            let newLatestTime = await getLatestTime();
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                account_investor1,
                new BN(5).mul(new BN(10).pow(new BN(16))),
                0,
                newLatestTime.add(new BN(duration.days(4))),
                1,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor1);
            assert.equal((tx.logs[0].args._typeOfRestriction).toString(), 1);
            assert.equal(web3.utils.fromWei(new BN(tx.logs[0].args._allowedTokens)), 0.05);
            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 3);
            assert.equal(data[0][2], account_investor3);
            assert.equal(data[0][0], account_investor1);
            let dataRestriction = await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor1);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(16))).toString()} % of TotalSupply
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
            // verify the partition balance
            let currentBalance = web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString());
            let percentatgeBalance = dataRestriction[0].div(new BN(10).pow(new BN(16))).toString();
            await increaseTime(2);
            await verifyPartitionBalance(account_investor1, 29.7, percentatgeBalance);
        });

        it("Should transfer tokens on the 2nd day by investor1 (Individual + Individual daily)", async() => {
            await increaseTime(2);
            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor1))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor1))[2].toString();

            console.log(`
                Gas estimation (Individual + Individual daily): ${await I_SecurityToken.transfer.estimateGas(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor1})}`
            );

            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor1});
            await verifyPartitionBalance(account_investor1, 29.7, 3);
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.equal(web3.utils.fromWei(bal1.toString()), 32.7);
            tempArray.push(2);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor1, data[0]));
            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray));
            assert.equal(data[2].toString(), 1);
            assert.equal(data[3].toString(),
             (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor1))[1].toString());
            assert.equal(amt, 2);
        });

        it("Should fail to transfer by investor 1 -- because voilating the individual daily", async() => {
            // transfer 4 tokens -- voilate the daily restriction
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor1})
            );
        });

        it("Should add the individual restriction to investor 3", async() => {
            let newLatestTime = await getLatestTime();
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                account_investor3,
                new BN(1536).mul(new BN(10).pow(new BN(14))), // 15.36 tokens as totalsupply is 1000
                newLatestTime.add(new BN(duration.seconds(2))),
                6,
                newLatestTime.add(new BN(duration.days(15))),
                1,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 1);

            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 4);
            assert.equal(data[0][2], account_investor3);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should transfer the token by the investor 3 with in the (Individual + Individual daily limit)", async() => {
            await increaseTime(4);
            console.log("Balance of investor 3" +
                web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())
            )
            await verifyPartitionBalance(account_investor3, 23.3, 4);
            // Allowed 4 tokens to transfer
            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();
            let startTimeDaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            console.log(`
                Gas estimation (Individual + Individual daily): ${await I_SecurityToken.transfer.estimateGas(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor3})}`
            );
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor3);
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor3});
            await verifyPartitionBalance(account_investor3, 23.3, 0);
            tempArray3.push(4);
            // Check the balance of the investors
            let bal2 = await I_SecurityToken.balanceOf.call(account_investor3);
            // Verifying the balances
            assert.equal(web3.utils.fromWei(((bal1.sub(bal2)).toString()).toString()), 4);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()))
            .div(new BN(10).pow(new BN(18))).toString();

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), 4);
            assert.equal(data[2].toString(), 0);
            assert.equal(data[3].toString(), new BN(startTimeDaily).add(new BN(duration.days(1))));
            assert.equal(amt, 4);
        });

        it("Should fail during transferring more tokens by investor3 -- Voilating the daily Limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1")), {from: account_investor3})
            );
        });

        it("Should remove the daily individual limit and transfer more tokens on a same day -- failed because of bad owner", async() => {
            // remove the Individual daily restriction
            await catchRevert(
                I_VolumeRestrictionTM.removeIndividualDailyRestriction(account_investor3, {from: account_investor4})
            );
        })

        it("Should remove the daily individual limit and transfer more tokens on a same day", async() => {
            // remove the Individual daily restriction
            let tx = await I_VolumeRestrictionTM.removeIndividualDailyRestriction(account_investor3, {from: token_owner});
            assert.equal(tx.logs[0].args._holder, account_investor3);
            let dataAdd = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(dataAdd);
            assert.equal(dataAdd[0].length, 3);
            assert.equal(dataAdd[0][0], account_investor1);
            assert.equal(dataAdd[0][2], account_investor3);

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();

            // transfer more tokens on the same day
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("4")), {from: account_investor3});
            await verifyPartitionBalance(account_investor3, 11.94, 7.36);
            tempArray3[tempArray3.length -1] += 4;
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()))
            .div(new BN(10).pow(new BN(18))).toString();

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), 8);
            assert.equal(data[2].toString(), 0);
            assert.equal(data[3].toString(), 0);
            assert.equal(amt, 8);
        });

        it("Should add the new Individual daily restriction and transact the tokens", async() => {
            let newLatestTime = await getLatestTime();
            // add new restriction
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                account_investor3,
                new BN(web3.utils.toWei("2")),
                newLatestTime.add(new BN(duration.days(1))),
                newLatestTime.add(new BN(duration.days(4))),
                0,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            assert.equal((tx.logs[0].args._allowedTokens).toString(), new BN(web3.utils.toWei("2")));
            let dataRestriction = await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(18))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);

            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();
            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            // Increase the time by one day
            await increaseTime(duration.days(1.1));

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3});
            tempArray3.push(2);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()))
            .div(new BN(10).pow(new BN(18))).toString();

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 1);
            assert.equal(data[3].toString(), dataRestriction[1].toString());
            assert.equal(amt, 2);

            // Fail to sell more tokens than the limit
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3})
            );
        });

        it("Should fail to modify the individual daily restriction -- bad owner", async() => {
            let newLatestTime = await getLatestTime();
            await catchRevert(
                I_VolumeRestrictionTM.modifyIndividualDailyRestriction(
                    account_investor3,
                    new BN(web3.utils.toWei('3')),
                    newLatestTime,
                    newLatestTime.add(new BN(duration.days(5))),
                    0,
                    {
                        from: account_polymath
                    }
                )
            );
        });

        it("Should modify the individual daily restriction", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.modifyIndividualDailyRestriction(
                    account_investor3,
                    new BN(web3.utils.toWei('3')),
                    newLatestTime.add(new BN(duration.seconds(10))),
                    newLatestTime.add(new BN(duration.days(5))),
                    0,
                    {
                        from: token_owner
                    }
            );

            let dataRestriction = await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3);
            console.log(`
                *** Modify Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(18))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
        });

        it("Should allow to sell to transfer more tokens by investor3", async() => {
            await increaseTime(duration.seconds(15));
            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("3")), {from: account_investor3});
            tempArray3[tempArray3.length -1] += 3;

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 1);
            assert.equal(data[3].toString(), startTimedaily);
            assert.equal(amt, 5);
        });

        it("Should allow to transact the tokens on the other day", async() => {
            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();

            await increaseTime(duration.days(1.1));
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2.36")), {from: account_investor3});
            tempArray3.push(2.36);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 2);
            assert.equal(data[3].toString(), new BN(startTimedaily).add(new BN(duration.days(1))));
            assert.equal(amt, 2.36);
        });

        it("Should fail to transfer the tokens after completion of the total amount", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("0.3")), {from: account_investor3})
            );
        })

        it("Should sell more tokens on the same day after changing the total supply", async() => {
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("10")), "0x0", {from: token_owner});

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei(".50")), {from: account_investor3});
            tempArray3[tempArray3.length -1] += .50;

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 2);
            assert.equal(data[3].toString(), new BN(startTimedaily).add(new BN(duration.days(1))));
            assert.equal(amt, 2.86);
        });

        it("Should fail to transact tokens more than the allowed in the second rolling period", async() => {
            let newLatestTime = await getLatestTime();
            await increaseTime(duration.days(4));
            let i
            for (i = 0; i < 3; i++) {
                tempArray3.push(0);
            }
            console.log(`Diff Days: ${(newLatestTime - ((await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3))[0]).toString()) / 86400}`);
            let allowedAmount = (tempArray3[0] + 1.1);
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei(allowedAmount.toString())), {from: account_investor3})
            );
        })

        it("Should successfully to transact tokens in the second rolling period", async() => {
            // Should transact freely tokens daily limit is also ended

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();
            let allowedAmount = (tempArray3[0] + 1);
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei(allowedAmount.toString())), {from: account_investor3});

            tempArray3.push(allowedAmount);
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 6);
            assert.equal(data[3].toString(), new BN(startTimedaily).add(new BN(duration.days(1))).toString());
            assert.equal(amt, allowedAmount);
        });

        it("Should sell more tokens on the next day of rolling period", async() => {
            await increaseTime(duration.days(3));

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();

            tempArray3.push(0);
            tempArray3.push(0);

            let dataRestriction = await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(18))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
            //sell tokens upto the limit
            console.log(
                "Balance of Investor3 :" +
                web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString())
            );
            console.log(
                web3.utils.fromWei(
                    (
                        await I_VolumeRestrictionTM.getTokensByPartition.call(web3.utils.toHex("LOCKED"), account_investor3, new BN(0))
                    ).toString()
                )
            )
            console.log(
                web3.utils.fromWei(
                    (
                        await I_VolumeRestrictionTM.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), account_investor3, new BN(0))
                    ).toString()
                )
            )
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("7")), {from: account_investor3});

            tempArray3.push(7)
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 9);
            assert.equal(data[3].toString(), new BN(startTimedaily).add(new BN(duration.days(1))));
            assert.equal(amt, 7);
        })

        it("Should transfer after the 5 days", async() => {
            await increaseTime(duration.days(4.5));

            for (let i = 0; i <3; i++) {
                tempArray3.push(0);
            }

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getIndividualDailyRestriction.call(account_investor3))[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3))[2].toString();

            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("25")), {from: account_investor2});
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("8")), {from: account_investor3});
            tempArray3.push(8);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 13);
            assert.equal(data[3].toString(), new BN(startTimedaily).add(new BN(duration.days(1))));
            assert.equal(amt, 8);
        });

        it("Should freely transfer the tokens after one day (completion of individual restriction)", async() => {
            // increase one time
            await increaseTime(duration.days(2));
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("17")), {from: account_investor3});
        });
    });

    describe("Test cases for the Default restrictions", async() => {

        it("Should add the investor 4 in the whitelist", async() => {
            let newLatestTime = await getLatestTime();
            await I_GeneralTransferManager.modifyKYCData(
                account_investor4,
                newLatestTime,
                newLatestTime,
                newLatestTime.add(new BN(duration.days(30))),
                {
                    from: token_owner
                }
            );
        });

        it("Should issue some tokens to investor 4", async() => {
            await I_SecurityToken.issue(account_investor4, new BN(web3.utils.toWei("20")), "0x0", {from: token_owner});
        });

        it("Should add the default daily restriction successfully", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.addDefaultDailyRestriction(
                new BN(275).mul(new BN(10).pow(new BN(14))),
                0,
                newLatestTime.add(new BN(duration.days(3))),
                1,
                {
                    from: token_owner
                }
            );

            let dataRestriction = await I_VolumeRestrictionTM.getDefaultDailyRestriction.call();
            console.log(`
                *** Add Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(16))).toString()} % of TotalSupply
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
        });

        it("Should fail to transfer above the daily limit", async() => {
            await increaseTime(2); // increase time to layoff the time gap
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("5")), {from: account_investor4})
            )
        })

        it("Should transfer the token by investor 4", async() => {
            let startTimedaily = (await I_VolumeRestrictionTM.getDefaultDailyRestriction.call())[1].toString();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("3.57")), {from: account_investor4});

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor4);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor4, data[3].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), 0);
            assert.equal(data[1].toString(), 0);
            assert.equal(data[2].toString(), 0);
            assert.equal(data[3].toString(), startTimedaily);
            assert.equal(amt, 3.57);
        });

        it("Should transfer the tokens freely after ending the default daily restriction", async() => {
            await increaseTime(duration.days(3) + 10);
            //sell tokens upto the limit
            let tx = await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("5")), {from: account_investor4});
            assert.equal((tx.logs[0].args.value).toString(), new BN(web3.utils.toWei("5")));
            // Transfer the tokens again to investor 3
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("40")), {from: account_investor2});
        })

        it("Should successfully add the default restriction", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.addDefaultRestriction(
                new BN(web3.utils.toWei("10")),
                0,
                5,
                newLatestTime.add(new BN(duration.days(10))),
                0,
                {
                    from: token_owner
                }
            );

            let data = await I_VolumeRestrictionTM.getDefaultRestriction.call();
            assert.equal(data[0].toString(), new BN(web3.utils.toWei("10")));
            assert.equal(data[2].toString(), 5);
            let dataRestriction = await I_VolumeRestrictionTM.getDefaultRestriction.call();
            console.log(`
                *** Add Individual restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(18))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
        });

        it("Should transfer tokens on by investor 3 (comes under the Default restriction)", async() => {
            await increaseTime(10);
            tempArray3.length = 0;
            let startTime = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getDefaultDailyRestriction.call())[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[2].toString();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("5")), {from: account_investor3});
            tempArray3.push(5);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 0);
            assert.equal(data[3].toString(), 0);
            assert.equal(amt, 5);

            // Transfer tokens on another day
            await increaseTime(duration.days(1));
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("3")), {from: account_investor3});
            tempArray3.push(3);

            data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 1);
            assert.equal(data[3].toString(), 0);
            assert.equal(amt, 3);
        });

        it("Should fail to transfer more tokens than the available default limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("3")), {from: account_investor3})
            );
        });

        it("Should able to transfer tokens in the next rolling period", async() => {
            let newLatestTime = await getLatestTime();
            await increaseTime(duration.days(4.1));
            console.log(`*** Diff days: ${(newLatestTime - ((await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3))[0]).toString()) / 86400}`)
            for (let i = 0; i < 3; i++) {
                tempArray3.push(0);
            }

            let startTime = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getDefaultDailyRestriction.call())[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[2].toString();

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("7")), {from: account_investor3});
            tempArray3.push(7);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 5);
            assert.equal(data[3].toString(), 0);
            assert.equal(amt, 7);

            // Try to transact more on the same day but fail
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1")), {from: account_investor3})
            );
        });

        it("Should add the daily default restriction again", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.addDefaultDailyRestriction(
                new BN(web3.utils.toWei("2")),
                newLatestTime.add(new BN(duration.seconds(10))),
                newLatestTime.add(new BN(duration.days(3))),
                0,
                {
                    from: token_owner
                }
            );

            let dataRestriction = await I_VolumeRestrictionTM.getDefaultDailyRestriction.call();
            console.log(`
                *** Add Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].div(new BN(10).pow(new BN(16))).toString()}
                StartTime :              ${dataRestriction[1].toString()}
                Rolling Period in days : ${dataRestriction[2].toString()}
                EndTime :                ${dataRestriction[3].toString()}
                Type of Restriction:     ${dataRestriction[4].toString()}
            `);
        });

        it("Should not able to transfer tokens more than the default daily restriction", async() => {
            await increaseTime(duration.seconds(15));
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("3")), {from: account_investor3})
            );
        });

        it("Should able to transfer tokens within the limit of (daily default + default) restriction", async() => {
            await increaseTime(duration.days(1));
            let startTime = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[1].toString();
            let startTimedaily = (await I_VolumeRestrictionTM.getDefaultDailyRestriction.call())[1].toString();
            let rollingPeriod = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[2].toString();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("2")), {from: account_investor3});
            tempArray3.push(2);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toString()));

            // Verify the storage changes
            assert.equal(data[0].toString(), new BN(startTime).add(new BN(duration.days(data[2].toString()))));
            assert.equal(web3.utils.fromWei(data[1]), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toString(), 6);
            assert.equal(data[3].toString(), (new BN(startTimedaily).add(new BN(duration.days(1)))).toString());
            assert.equal(amt, 2);
        });
    })

    describe("Test for the exemptlist", async() => {

        it("Should add the token holder in the exemption list -- failed because of bad owner", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.changeExemptWalletList(account_investor4, true, {from: account_polymath})
            );
        });

        it("Should add the token holder in the exemption list", async() => {
            await I_VolumeRestrictionTM.changeExemptWalletList(account_investor4, true, {from: token_owner});
            console.log(await I_VolumeRestrictionTM.getExemptAddress.call());
            let beforeBal = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("3")), {from: account_investor4});
            let afterBal = await I_SecurityToken.balanceOf.call(account_investor4);
            let diff = beforeBal.sub(afterBal);
            assert.equal(web3.utils.fromWei((diff.toString()).toString()), 3);
        });

        it("Should add multiple token holders to exemption list and check the getter value", async() => {
            let holders = [account_investor1, account_investor3, account_investor2, account_delegate2];
            let change = [true, true, true, true];
            for (let i = 0; i < holders.length; i++) {
                await I_VolumeRestrictionTM.changeExemptWalletList(holders[i], change[i], {from: token_owner});
            }
            let data = await I_VolumeRestrictionTM.getExemptAddress.call();
            assert.equal(data.length, 5);
            assert.equal(data[0], account_investor4);
            assert.equal(data[1], account_investor1);
            assert.equal(data[2], account_investor3);
            assert.equal(data[3], account_investor2);
            assert.equal(data[4], account_delegate2);
        });

        it("Should unexempt a particular address", async() => {
            await I_VolumeRestrictionTM.changeExemptWalletList(account_investor1, false, {from: token_owner});
            let data = await I_VolumeRestrictionTM.getExemptAddress.call();
            assert.equal(data.length, 4);
            assert.equal(data[0], account_investor4);
            assert.equal(data[1], account_delegate2);
            assert.equal(data[2], account_investor3);
            assert.equal(data[3], account_investor2);
        });

        it("Should fail to unexempt the same address again", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.changeExemptWalletList(account_investor1, false, {from: token_owner})
            );
        });

        it("Should delete the last element of the exemption list", async() => {
            await I_VolumeRestrictionTM.changeExemptWalletList(account_investor2, false, {from: token_owner});
            let data = await I_VolumeRestrictionTM.getExemptAddress.call();
            assert.equal(data.length, 3);
            assert.equal(data[0], account_investor4);
            assert.equal(data[1], account_delegate2);
            assert.equal(data[2], account_investor3);
        });

        it("Should delete multiple investor from the exemption list", async() => {
            let holders = [account_delegate2, account_investor4, account_investor3];
            let change = [false, false, false];
            for (let i = 0; i < holders.length; i++) {
                await I_VolumeRestrictionTM.changeExemptWalletList(holders[i], change[i], {from: token_owner});
            }
            let data = await I_VolumeRestrictionTM.getExemptAddress.call();
            assert.equal(data.length, 0);
        });
    });

    describe("Test for modify functions", async() => {

        it("Should add the individual restriction for multiple investor", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [new BN(web3.utils.toWei("15")), new BN(1278).mul(new BN(10).pow(new BN(14)))],
                [newLatestTime.add(new BN(duration.days(1))), newLatestTime.add(new BN(duration.days(2)))],
                [15, 20],
                [newLatestTime.add(new BN(duration.days(40))), newLatestTime.add(new BN(duration.days(60)))],
                [0,1],
                {
                    from: token_owner
                }
            );

            let indi1 = await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3);
            let indi2 = await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate3);

            assert.equal(indi1[0].div(new BN(10).pow(new BN(18))).toString(), 15);
            assert.equal(indi2[0].div(new BN(10).pow(new BN(14))).toString(), 1278);

            assert.equal(indi1[2].toString(), 15);
            assert.equal(indi2[2].toString(), 20);

            assert.equal(indi1[4].toString(), 0);
            assert.equal(indi2[4].toString(), 1);
        });

        it("Should modify the details before the starttime passed", async() => {
            let newLatestTime = await getLatestTime();
            await I_VolumeRestrictionTM.modifyIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [new BN(1278).mul(new BN(10).pow(new BN(14))), new BN(web3.utils.toWei("15"))],
                [newLatestTime.add(new BN(duration.days(1))), newLatestTime.add(new BN(duration.days(2)))],
                [20, 15],
                [newLatestTime.add(new BN(duration.days(40))), newLatestTime.add(new BN(duration.days(60)))],
                [1,0],
                {
                    from: token_owner
                }
            );

            let indi1 = await I_VolumeRestrictionTM.getIndividualRestriction.call(account_investor3);
            let indi2 = await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate3);

            assert.equal(indi2[0].div(new BN(10).pow(new BN(18))).toString(), 15);
            assert.equal(indi1[0].div(new BN(10).pow(new BN(14))).toString(), 1278);

            assert.equal(indi2[2].toString(), 15);
            assert.equal(indi1[2].toString(), 20);

            assert.equal(indi2[4].toString(), 0);
            assert.equal(indi1[4].toString(), 1);
        });

    });

    describe("Test the major issue from the audit ( Possible accounting corruption between individualRestriction​ and ​defaultRestriction)", async() => {

        it("Should add the individual restriction for the delegate 2 address", async() => {
            let currentTime = await getLatestTime();
            await I_GeneralTransferManager.modifyKYCData(
                account_delegate2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
                {
                    from: token_owner
                }
            );

            await I_SecurityToken.issue(account_delegate2, new BN(web3.utils.toWei("50")), "0x0", { from: token_owner });
            // Use to set the time to start of the day 0:00 to test the edge case properly
            await setTime();
            currentTime = await getLatestTime();
            await I_VolumeRestrictionTM.addIndividualRestriction(
                account_delegate2,
                web3.utils.toWei("12"),
                currentTime.add(new BN(duration.minutes(1))),
                new BN(2),
                currentTime.add(new BN(duration.days(5.5))),
                new BN(0),
                {
                    from: token_owner
                }
            );
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[2].toNumber(), 2);

            let data = await I_VolumeRestrictionTM.getRestrictionData.call();
            await printRestrictedData(data);

            // Add default restriction as well
            currentTime = await getLatestTime();
            await I_VolumeRestrictionTM.removeDefaultRestriction({from: token_owner});
            await I_VolumeRestrictionTM.addDefaultRestriction(
                web3.utils.toWei("5"),
                currentTime.add(new BN(duration.minutes(1))),
                new BN(5),
                currentTime.add(new BN(duration.days(20))),
                new BN(0),
                {
                    from: token_owner
                }
            );

            data = await I_VolumeRestrictionTM.getDefaultRestriction.call();
            assert.equal(data[0].toString(), web3.utils.toWei("5"));
            assert.equal(data[2].toString(), 5);
            let dataRestriction = await I_VolumeRestrictionTM.getDefaultRestriction.call();
            console.log(`
                *** Add Default restriction data ***
                Allowed Tokens:          ${web3.utils.fromWei(dataRestriction[0])}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should transact with delegate address 2", async() => {
            await increaseTime(duration.minutes(2));

            let startTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[2].toNumber();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("6"), {from: account_delegate2});
            delegateArray.push(6);

            console.log(`Print the default bucket details`);
            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_delegate2);
            await print(data, account_delegate2);
            assert.equal(data[0].toNumber(), 0);
            assert.equal(data[1].toNumber(), 0);

            console.log(`Print the individual bucket details`);
            data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_delegate2);
            await print(data, account_delegate2);

            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_delegate2, data[0].toString()));
            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(web3.utils.fromWei(data[1].toString()), await calculateSum(rollingPeriod, delegateArray));
            assert.equal(data[2].toNumber(), 0);
            assert.equal(amt, 6);

            // Sell more tokens
            await increaseTime(duration.days(5.1));
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("9"), {from: account_delegate2});

            delegateArray.push(9);

            console.log(`Print the default bucket details`);
            let dataDefault = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_delegate2);
            await print(dataDefault, account_delegate2);
            assert.equal(dataDefault[0].toNumber(), 0);
            assert.equal(dataDefault[1].toNumber(), 0);
            console.log(`Print the individual bucket details`);
            let dataIndividual = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_delegate2);
            await print(dataIndividual, account_delegate2);

            // get the trade amount using the timestamp
            let amtTraded = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_delegate2, dataIndividual[0].toString()));
            // Verify the storage changes
            assert.equal(dataIndividual[0].toNumber(), startTime + duration.days(dataIndividual[2].toNumber()));
            assert.equal(dataIndividual[2].toNumber(), 5);
            assert.equal(amtTraded, 9);
        });

        it("Should fail to transact -- edge case when user restriction changes and do the transfer on the same day", async() => {
            await increaseTime(duration.days(0.6));
            //sell tokens upto the limit
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("5"), {from: account_delegate2})
            );
        });

        it("Should transact under the default restriction unaffected from the edge case", async() => {
            await increaseTime(duration.days(0.5));
            let individualStartTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[1].toNumber();
            let startTime = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[2].toNumber();

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("4"), {from: account_delegate2});

            console.log(`Print the individual bucket details`);
            let dataIndividual = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_delegate2);
            await print(dataIndividual, account_delegate2);
            console.log(dataIndividual[4].toString());

            // Verify the storage changes
            assert.equal(dataIndividual[0].toNumber(), individualStartTime + duration.days(dataIndividual[2].toNumber()));
            assert.equal(dataIndividual[2].toNumber(), 5);

            console.log(`Print the default bucket details`);
            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_delegate2);
            await print(data, account_delegate2);
            console.log(data[4].toString());

             // get the trade amount using the timestamp
             let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_delegate2, data[0].toString()));
            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[2].toNumber(), 6);
            assert.equal(amt, 4);
        });

        it("Should check whether user is able to transfer when amount is less than the restriction limit (when restriction change)", async() => {
            let currentTime = await getLatestTime();
            await I_VolumeRestrictionTM.addIndividualRestriction(
                account_delegate2,
                web3.utils.toWei("7"),
                currentTime.add(new BN(duration.minutes(1))),
                1,
                currentTime.add(new BN(duration.days(2))),
                0,
                {
                    from: token_owner
                }
            );
            assert.equal((await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[2].toNumber(), 1);
            let individualStartTime = (await I_VolumeRestrictionTM.getIndividualRestriction.call(account_delegate2))[1].toNumber();
            let startTime = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.getDefaultRestriction.call())[2].toNumber();

            await increaseTime(duration.minutes(2));

            // sell tokens when user restriction changes from the default restriction to individual restriction
            await catchRevert (I_SecurityToken.transfer(account_investor1, web3.utils.toWei("5")), {from: account_delegate2});

            // allow to transact when the day limit is with in the restriction. default allow to transact maximum 5 tokens within
            // a given rolling period. 4 tokens are already sold here user trying to sell 1 more token on the same day
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1"), {from: account_delegate2});

            console.log(`Print the individual bucket details`);
            let dataIndividual = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_delegate2);
            await print(dataIndividual, account_delegate2);

            // Verify the storage changes
            assert.equal(dataIndividual[0].toNumber(), individualStartTime + duration.days(dataIndividual[2].toNumber()));
            assert.equal(dataIndividual[2].toNumber(), 0);
            // get the trade amount using the timestamp
            let amt = web3.utils.fromWei(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_delegate2, dataIndividual[0].toString()));
            assert.equal(amt, 1);

            console.log(`Print the default bucket details`);
            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_delegate2);
            await print(data, account_delegate2);

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[2].toNumber(), 6);
        });
    });

    describe("VolumeRestriction Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_VolumeRestrictionTMFactory.setupCost.call(),0);
            assert.equal((await I_VolumeRestrictionTMFactory.getTypes.call())[0],2);
            assert.equal(web3.utils.toAscii(await I_VolumeRestrictionTMFactory.name.call())
                        .replace(/\u0000/g, ''),
                        "VolumeRestrictionTM",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.description.call(),
                        "Manage transfers based on the volume of tokens that needs to be transact",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.title.call(),
                        "Volume Restriction Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.version.call(), "3.0.0");
        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_VolumeRestrictionTMFactory.getTags.call();
            assert.equal(tags.length, 3);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "Rolling Period");
        });
    });

});
