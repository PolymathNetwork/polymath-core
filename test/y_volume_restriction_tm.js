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

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
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
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

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

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    let tempAmount = new BigNumber(0);
    let tempArray = new Array();
    let tempArray3 = new Array();
    let tempArrayGlobal = new Array();

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    async function print(data, account) {
        console.log(`
            Latest timestamp: ${data[0].toNumber()}
            SumOfLastPeriod: ${data[1].dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Days Covered: ${data[2].toNumber()}
            Latest timestamp daily: ${data[3].toNumber()}
            Individual Total Trade on latestTimestamp : ${(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[0]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Individual Total Trade on daily latestTimestamp : ${(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[3]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber()}
        `)
    }

    async function printRestrictedData(data) {
        let investors = data[0];
        for (let i = 0 ; i < investors.length; i++) {
            console.log(`
                Token holder:   ${data[0][i]}
                Start Time:  ${data[2][i].toNumber()}
                Rolling Period In Days: ${data[3][i].toNumber()}
                End Time : ${data[4][i].toNumber()}
                Allowed Tokens: ${web3.utils.fromWei(data[1][i].toString())}
                Type of Restriction: ${data[5][i].toNumber()}
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

    before(async() => {
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
            I_STRProxied
        ] = instances;

        // STEP 5: Deploy the VolumeRestrictionTMFactory
        [I_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 6: Deploy the VolumeRestrictionTMFactory
        [P_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

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
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, true, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Attach the VRTM", async() => {
        it("Deploy the VRTM and attach with the ST", async()=> {
            let tx = await I_SecurityToken.addModule(I_VolumeRestrictionTMFactory.address, 0, 0, 0, {from: token_owner });
            assert.equal(tx.logs[2].args._moduleFactory, I_VolumeRestrictionTMFactory.address);
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "VolumeRestrictionTM",
                "VolumeRestrictionTMFactory doesn not added");
            I_VolumeRestrictionTM = VolumeRestrictionTM.at(tx.logs[2].args._module);
        });

        it("Transfer some tokens to different account", async() => {
            // Add tokens in to the whitelist
            await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor1, account_investor2, account_investor3],
                    [latestTime(), latestTime(), latestTime()],
                    [latestTime(), latestTime(), latestTime()],
                    [latestTime() + duration.days(60), latestTime() + duration.days(60), latestTime() + duration.days(60)],
                    [true, true, true],
                    {
                        from: token_owner
                    }
            );

            // Mint some tokens and transferred to whitelisted addresses
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("40", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("30", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("30", "ether"), {from: token_owner});

            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            let bal2 = await I_SecurityToken.balanceOf.call(account_investor2);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 40);
            assert.equal(web3.utils.fromWei((bal2.toNumber()).toString()), 30);

        });

        it("Should transfer the tokens freely without any restriction", async() => {
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('5', 'ether'), { from: account_investor1 });
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor3);
             // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 35);
        });
    })

    describe("Test for the addIndividualRestriction", async() => {

        it("Should add the restriction -- failed because of bad owner", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("12"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    0,
                    {
                        from: account_polymath
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid restriction type", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("12"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    3,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Invalid value of allowed tokens", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    0,
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Percentage of tokens not within (0,100]", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    0,
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e Percentage of tokens not within (0,100]", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid dates", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() - duration.seconds(5),
                    3,
                    latestTime() + duration.days(10),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the restriction -- failed because of bad parameters i.e invalid dates", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() + duration.days(2),
                    3,
                    latestTime() + duration.days(1),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() + duration.days(2),
                    0,
                    latestTime() + duration.days(10),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() + duration.days(2),
                    366,
                    latestTime() + duration.days(10),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction -- failed because of bad parameters i.e invalid rolling period", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("10"),
                    latestTime() + duration.days(2),
                    3,
                    latestTime() + duration.days(3),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the restriction succesfully", async() => {
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("12"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(5),
                    0,
                    {
                        from: token_owner
                    }
                );
            assert.equal(tx.logs[0].args._holder, account_investor1);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should add the restriction for multiple investor -- failed because of bad owner", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3,4,5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: account_polymath
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3,4,5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3,4,5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: account_polymath
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3,4,5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3, 4, 5],
                    [latestTime() + duration.days(5)],
                    [0,0,0],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor -- failed because of bad parameters i.e length mismatch", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
                    [3, 4, 5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [],
                    {
                        from: token_owner
                    }
                )
            )
        });

        it("Should add the restriction for multiple investor successfully", async() => {
            await I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                    [account_investor2, account_delegate3, account_investor4],
                    [web3.utils.toWei("12"), web3.utils.toWei("10"), web3.utils.toWei("15")],
                    [0, 0, 0],
                    [3, 4, 5],
                    [latestTime() + duration.days(5), latestTime() + duration.days(6), latestTime() + duration.days(7)],
                    [0,0,0],
                    {
                        from: token_owner
                    }
            );
            assert.equal((await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[2].toNumber(), 3);
            assert.equal((await I_VolumeRestrictionTM.individualRestriction.call(account_delegate3))[2].toNumber(), 4);
            assert.equal((await I_VolumeRestrictionTM.individualRestriction.call(account_investor4))[2].toNumber(), 5);

            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 4);
        });

        it("Should remove the restriction multi -- failed because of address is 0", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.removeIndividualRestrictionMulti(
                    [0, account_delegate3, account_investor4],
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should successfully remove the restriction", async() => {
            await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor2, {from: token_owner});
            assert.equal((await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[3].toNumber(), 0);
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
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
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 1);
        });

        it("Should add the restriction succesfully after the expiry of previous one for investor 1", async() => {
            await increaseTime(duration.days(5.1));

            console.log(
                `Estimated gas for addIndividualRestriction:
                ${await I_VolumeRestrictionTM.addIndividualRestriction.estimateGas(
                    account_investor1,
                    web3.utils.toWei("12"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(6),
                    0,
                    {
                        from: token_owner
                    }
                )}
                `);

            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei("12"),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(6),
                    0,
                    {
                        from: token_owner
                    }
                );

            assert.equal(tx.logs[1].args._holder, account_investor1);
            assert.equal(tx.logs[1].args._typeOfRestriction, 0);
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 1);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should not successfully transact the tokens -- failed because volume is above the limit", async() => {
            await increaseTime(duration.seconds(10));
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("13"), { from: account_investor1})
            );
        });

        it("Should succesfully transact the tokens by investor 1 just after the startTime", async() => {
            // Check the transfer will be valid or not by calling the verifyTransfer() directly by using _isTransfer = false
            let result = await I_VolumeRestrictionTM.verifyTransfer.call(account_investor1, account_investor3, web3.utils.toWei('.3'), "0x0", false);
            assert.equal(result.toNumber(), 1);
            // Perform the transaction
            console.log(`
                Gas estimation (Individual): ${await I_SecurityToken.transfer.estimateGas(account_investor3, web3.utils.toWei('.3'), {from: account_investor1})}`
            );
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('.3'), {from: account_investor1});
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 34.7);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);

            assert.equal(
                (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor1, data[0]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                0.3
            );
            assert.equal(
                data[0].toNumber(),
                (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber()
            );
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 0.3);
            tempArray.push(0.3);
        });

        it("Should fail to add the individual daily restriction -- Bad msg.sender", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    web3.utils.toWei("6"),
                    latestTime() + duration.seconds(1),
                    latestTime() + duration.days(4),
                    0,
                    {
                        from: account_investor1
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    web3.utils.toWei("6"),
                    latestTime() + duration.seconds(1),
                    latestTime() + duration.days(4),
                    1,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    0,
                    latestTime() + duration.seconds(1),
                    latestTime() + duration.days(4),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should fail to add the individual daily restriction -- Bad params value", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor3,
                    web3.utils.toWei("6"),
                    latestTime() + duration.days(5),
                    latestTime() + duration.days(4),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        })

        it("Should add the individual daily restriction for investor 3", async() => {
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                        account_investor3,
                        web3.utils.toWei("6"),
                        latestTime() + duration.seconds(1),
                        latestTime() + duration.days(4),
                        0,
                        {
                            from: token_owner
                        }
                    );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            assert.equal((tx.logs[0].args._allowedTokens).toNumber(), web3.utils.toWei("6"));
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 2);
            assert.equal(data[0][1], account_investor3);
            let dataRestriction = await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(18)).toNumber()}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should transfer the tokens within the individual daily restriction limits", async() => {
            // transfer 2 tokens as per the limit
            await increaseTime(5); // increase 5 seconds to layoff the time gap
            let startTime = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, web3.utils.toWei("2"), {from: account_investor3})}
            `)
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor3});
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            await increaseTime(duration.minutes(15));

            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, web3.utils.toWei("4"), {from: account_investor3})}
            `)
            // transfer the 4 tokens which is under the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("4"), {from: account_investor3});
            let newData = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(newData, account_investor3);

            assert.equal(newData[3].toNumber(), data[3].toNumber());
            assert.equal(data[3].toNumber(), startTime);
            assert.equal((await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[3]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber(), 6);
        });

        it("Should fail to transfer more tokens --because of the above limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei(".1"), {from: account_investor3})
            );
        });

        it("Should try to send after the one day completion", async() => {
            // increase the EVM time by one day
            await increaseTime(duration.days(1));

            let startTime = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            console.log(`
                Gas Estimation for the Individual daily tx - ${await I_SecurityToken.transfer.estimateGas(account_investor2, web3.utils.toWei("2"), {from: account_investor3})}
            `)
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor3});
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            assert.equal(data[3].toNumber(), startTime + duration.days(1));
            assert.equal((await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[3]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber(), 2);
        });

        it("Should add the daily restriction on the investor 1", async() => {
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                account_investor1,
                new BigNumber(5).times(new BigNumber(10).pow(16)),
                0,
                latestTime() + duration.days(4),
                1,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor1);
            assert.equal((tx.logs[0].args._typeOfRestriction).toNumber(), 1);
            assert.equal((tx.logs[0].args._allowedTokens).dividedBy(new BigNumber(10).pow(16)).toNumber(), 5);
            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 3);
            assert.equal(data[0][2], account_investor3);
            assert.equal(data[0][0], account_investor1);
            let dataRestriction = await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor1);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(16)).toNumber()} % of TotalSupply
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should transfer tokens on the 2nd day by investor1 (Individual + Individual daily)", async() => {
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();

            console.log(`
                Gas estimation (Individual + Individual daily): ${await I_SecurityToken.transfer.estimateGas(account_investor2, web3.utils.toWei("2"), {from: account_investor1})}`
            );

            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor1});
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 32.7);
            tempArray.push(2);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor1, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(),
             (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor1))[1].toNumber());
            assert.equal(amt, 2);
        });

        it("Should fail to transfer by investor 1 -- because voilating the individual daily", async() => {
            // transfer 4 tokens -- voilate the daily restriction
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("4"), {from: account_investor1})
            );
        });

        it("Should add the individual restriction to investor 3", async() => {
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                account_investor3,
                new BigNumber(15.36).times(new BigNumber(10).pow(16)), // 15.36 tokens as totalsupply is 1000
                latestTime() + duration.seconds(2),
                6,
                latestTime() + duration.days(15),
                1,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 1);

            let data = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(data);
            assert.equal(data[0].length, 4);
            assert.equal(data[0][2], account_investor3);
            assert.equal(data[0][0], account_investor1);
        });

        it("Should transfer the token by the investor 3 with in the (Individual + Individual daily limit)", async() => {
            await increaseTime(4);
            // Allowed 4 tokens to transfer
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();
            let startTimeDaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            console.log(`
                Gas estimation (Individual + Individual daily): ${await I_SecurityToken.transfer.estimateGas(account_investor2, web3.utils.toWei("4"), {from: account_investor3})}`
            );
            // Check the balance of the investors
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor3);
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("4"), {from: account_investor3});
            tempArray3.push(4);
            // Check the balance of the investors
            let bal2 = await I_SecurityToken.balanceOf.call(account_investor3);
            // Verifying the balances
            assert.equal(web3.utils.fromWei(((bal1.minus(bal2)).toNumber()).toString()), 4);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), 4);
            assert.equal(data[2].toNumber(), 0);
            assert.equal(data[3].toNumber(), startTimeDaily + duration.days(1));
            assert.equal(amt, 4);

        });

        it("Should fail during transferring more tokens by investor3 -- Voilating the daily Limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("1"), {from: account_investor3})
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
            let dataAdd = await I_VolumeRestrictionTM.getRestrictedData.call();
            await printRestrictedData(dataAdd);
            assert.equal(dataAdd[0].length, 3);
            assert.equal(dataAdd[0][0], account_investor1);
            assert.equal(dataAdd[0][2], account_investor3);

            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();

            // transfer more tokens on the same day
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("4"), {from: account_investor3});
            tempArray3[tempArray3.length -1] += 4;
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), 8);
            assert.equal(data[2].toNumber(), 0);
            assert.equal(data[3].toNumber(), 0);
            assert.equal(amt, 8);
        });

        it("Should add the new Individual daily restriction and transact the tokens", async() => {
            // add new restriction
            let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                account_investor3,
                web3.utils.toWei("2"),
                latestTime() + duration.days(1),
                latestTime() + duration.days(4),
                0,
                {
                    from: token_owner
                }
            );

            assert.equal(tx.logs[0].args._holder, account_investor3);
            assert.equal(tx.logs[0].args._typeOfRestriction, 0);
            assert.equal((tx.logs[0].args._allowedTokens).toNumber(), web3.utils.toWei("2"));
            let dataRestriction = await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3);
            console.log(`
                *** Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(18)).toNumber()}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);

            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            // Increase the time by one day
            await increaseTime(duration.days(1.1));

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor3});
            tempArray3.push(2);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(), dataRestriction[1].toNumber());
            assert.equal(amt, 2);

            // Fail to sell more tokens than the limit
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor3})
            );
        });

        it("Should fail to modify the individual daily restriction -- bad owner", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.modifyIndividualDailyRestriction(
                    account_investor3,
                    web3.utils.toWei('3'),
                    latestTime(),
                    latestTime() + duration.days(5),
                    0,
                    {
                        from: account_polymath
                    }
                )
            );
        });

        it("Should modify the individual daily restriction", async() => {
            await I_VolumeRestrictionTM.modifyIndividualDailyRestriction(
                    account_investor3,
                    web3.utils.toWei('3'),
                    0,
                    latestTime() + duration.days(5),
                    0,
                    {
                        from: token_owner
                    }
            );

            let dataRestriction = await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3);
            console.log(`
                *** Modify Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(18)).toNumber()}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should allow to sell to transfer more tokens by investor3", async() => {
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("3"), {from: account_investor3});
            tempArray3[tempArray3.length -1] += 3;

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(), startTimedaily);
            assert.equal(amt, 5);
        });

        it("Should allow to transact the tokens on the other day", async() => {
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();

            await increaseTime(duration.days(1));
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2.36"), {from: account_investor3});
            tempArray3.push(2.36);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 2);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
            assert.equal(amt, 2.36);
        });

        it("Should fail to transfer the tokens after completion of the total amount", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("0.3"), {from: account_investor3})
            );
        })

        it("Should sell more tokens on the same day after changing the total supply", async() => {
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("10"), {from: token_owner});

            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei(".50"), {from: account_investor3});
            tempArray3[tempArray3.length -1] += .50;

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 2);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
            assert.equal(amt, 2.86);
        });

        it("Should fail to transact tokens more than the allowed in the second rolling period", async() => {
            await increaseTime(duration.days(4));
            let i
            for (i = 0; i < 3; i++) {
                tempArray3.push(0);
            }
            console.log(`Diff Days: ${(latestTime() - ((await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3))[0]).toNumber()) / 86400}`);
            let allowedAmount = (tempArray3[0] + 1.1);
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei(allowedAmount.toString()), {from: account_investor3})
            );
        })

        it("Should successfully to transact tokens in the second rolling period", async() => {
            // Should transact freely tokens daily limit is also ended

            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();
            let allowedAmount = (tempArray3[0] + 1);
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei(allowedAmount.toString()), {from: account_investor3});

            tempArray3.push(allowedAmount);
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 6);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
            assert.equal(amt, allowedAmount);
        });

        it("Should sell more tokens on the net day of rolling period", async() => {
            await increaseTime(duration.days(3));

            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();

            tempArray3.push(0);
            tempArray3.push(0);

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("7"), {from: account_investor3});

            tempArray3.push(7)
            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 9);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
            assert.equal(amt, 7);
        })

        it("Should transfer after the 5 days", async() => {
            await increaseTime(duration.days(4.5));

            for (let i = 0; i <3; i++) {
                tempArray3.push(0);
            }

            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.individualDailyRestriction.call(account_investor3))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor3))[2].toNumber();

            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("25"), {from: account_investor2});
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("8"), {from: account_investor3});
            tempArray3.push(8);

            let data = await I_VolumeRestrictionTM.getIndividualBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 13);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
            assert.equal(amt, 8);
        });

        it("Should freely transfer the tokens after one day (completion of individual restriction)", async() => {
            // increase one time
            await increaseTime(duration.days(2));
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("17"), {from: account_investor3});
        });
    });

    describe("Test cases for the Default restrictions", async() => {

        it("Should add the investor 4 in the whitelist", async() => {
            await I_GeneralTransferManager.modifyWhitelist(
                account_investor4,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
                true,
                {
                    from: token_owner
                }
            );
        });

        it("Should mint some tokens to investor 4", async() => {
            await I_SecurityToken.mint(account_investor4, web3.utils.toWei("20"), {from: token_owner});
        });

        it("Should add the default daily restriction successfully", async() => {
            await I_VolumeRestrictionTM.addDefaultDailyRestriction(
                new BigNumber(2.75).times(new BigNumber(10).pow(16)),
                0,
                latestTime() + duration.days(3),
                1,
                {
                    from: token_owner
                }
            );

            let dataRestriction = await I_VolumeRestrictionTM.defaultDailyRestriction.call();
            console.log(`
                *** Add Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(16)).toNumber()} % of TotalSupply
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should fail to transfer above the daily limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("5"), {from: account_investor4})
            )
        })

        it("Should transfer the token by investor 4", async() => {
            let startTimedaily = (await I_VolumeRestrictionTM.defaultDailyRestriction.call())[1].toNumber();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("3.57"), {from: account_investor4});

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor4);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor4, data[3].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), 0);
            assert.equal(data[1].toNumber(), 0);
            assert.equal(data[2].toNumber(), 0);
            assert.equal(data[3].toNumber(), startTimedaily);
            assert.equal(amt, 3.57);
        });

        it("Should transfer the tokens freely after ending the default daily restriction", async() => {
            await increaseTime(duration.days(3) + 10);
            //sell tokens upto the limit
            let tx = await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("5"), {from: account_investor4});
            assert.equal((tx.logs[0].args.value).toNumber(), web3.utils.toWei("5"));
            // Transfer the tokens again to investor 3
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("40"), {from: account_investor2});
        })

        it("Should successfully add the default restriction", async() => {
            await I_VolumeRestrictionTM.addDefaultRestriction(
                web3.utils.toWei("10"),
                0,
                5,
                latestTime() + duration.days(10),
                0,
                {
                    from: token_owner
                }
            );

            let data = await I_VolumeRestrictionTM.defaultRestriction.call();
            assert.equal(data[0].toNumber(), web3.utils.toWei("10"));
            assert.equal(data[2].toNumber(), 5);
            let dataRestriction = await I_VolumeRestrictionTM.defaultRestriction.call();
            console.log(`
                *** Add Individual restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(18)).toNumber()}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should transfer tokens on by investor 3 (comes under the Default restriction)", async() => {
            await increaseTime(10);
            tempArray3.length = 0;
            let startTime = (await I_VolumeRestrictionTM.defaultRestriction.call())[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.defaultDailyRestriction.call())[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.defaultRestriction.call())[2].toNumber();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("5"), {from: account_investor3});
            tempArray3.push(5);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 0);
            assert.equal(data[3].toNumber(), 0);
            assert.equal(amt, 5);

            // Transfer tokens on another day
            await increaseTime(duration.days(1));
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("3"), {from: account_investor3});
            tempArray3.push(3);

            data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(), 0);
            assert.equal(amt, 3);
        });

        it("Should fail to transfer more tokens than the available default limit", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("3"), {from: account_investor3})
            );
        });

        it("Should able to transfer tokens in the next rolling period", async() => {
            await increaseTime(duration.days(4.1));
            console.log(`*** Diff days: ${(latestTime() - ((await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3))[0]).toNumber()) / 86400}`)
            for (let i = 0; i < 3; i++) {
                tempArray3.push(0);
            }

            let startTime = (await I_VolumeRestrictionTM.defaultRestriction.call())[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.defaultDailyRestriction.call())[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.defaultRestriction.call())[2].toNumber();

            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("7"), {from: account_investor3});
            tempArray3.push(7);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 5);
            assert.equal(data[3].toNumber(), 0);
            assert.equal(amt, 7);

            // Try to transact more on the same day but fail
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("1"), {from: account_investor3})
            );
        });

        it("Should add the daily default restriction again", async() => {
            await I_VolumeRestrictionTM.addDefaultDailyRestriction(
                web3.utils.toWei("2"),
                0,
                latestTime() + duration.days(3),
                0,
                {
                    from: token_owner
                }
            );

            let dataRestriction = await I_VolumeRestrictionTM.defaultDailyRestriction.call();
            console.log(`
                *** Add Individual Daily restriction data ***
                Allowed Tokens:          ${dataRestriction[0].dividedBy(new BigNumber(10).pow(16)).toNumber()}
                StartTime :              ${dataRestriction[1].toNumber()}
                Rolling Period in days : ${dataRestriction[2].toNumber()}
                EndTime :                ${dataRestriction[3].toNumber()}
                Type of Restriction:     ${dataRestriction[4].toNumber()}
            `);
        });

        it("Should not able to transfer tokens more than the default daily restriction", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor2, web3.utils.toWei("3"), {from: account_investor3})
            );
        });

        it("Should able to transfer tokens within the limit of (daily default + default) restriction", async() => {
            await increaseTime(duration.days(1));
            let startTime = (await I_VolumeRestrictionTM.defaultRestriction.call())[1].toNumber();
            let startTimedaily = (await I_VolumeRestrictionTM.defaultDailyRestriction.call())[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.defaultRestriction.call())[2].toNumber();
            //sell tokens upto the limit
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei("2"), {from: account_investor3});
            tempArray3.push(2);

            let data = await I_VolumeRestrictionTM.getDefaultBucketDetailsToUser.call(account_investor3);
            await print(data, account_investor3);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradedByUser.call(account_investor3, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray3));
            assert.equal(data[2].toNumber(), 6);
            assert.equal(data[3].toNumber(), startTimedaily + duration.days(1));
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
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("3"), {from: account_investor4});
            let afterBal = await I_SecurityToken.balanceOf.call(account_investor4);
            let diff = beforeBal.minus(afterBal);
            assert.equal(web3.utils.fromWei((diff.toNumber()).toString()), 3);
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
            await I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [web3.utils.toWei("15"), new BigNumber(12.78).times(new BigNumber(10).pow(16))],
                [latestTime() + duration.days(1), latestTime() + duration.days(2)],
                [15, 20],
                [latestTime() + duration.days(40), latestTime() + duration.days(60)],
                [0,1],
                {
                    from: token_owner
                }
            );

            let indi1 = await I_VolumeRestrictionTM.individualRestriction.call(account_investor3);
            let indi2 = await I_VolumeRestrictionTM.individualRestriction.call(account_delegate3);

            assert.equal(indi1[0].dividedBy(new BigNumber(10).pow(18)), 15);
            assert.equal(indi2[0].dividedBy(new BigNumber(10).pow(16)), 12.78);

            assert.equal(indi1[2].toNumber(), 15);
            assert.equal(indi2[2].toNumber(), 20);

            assert.equal(indi1[4].toNumber(), 0);
            assert.equal(indi2[4].toNumber(), 1);
        });

        it("Should modify the details before the starttime passed", async() => {
            await I_VolumeRestrictionTM.modifyIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [new BigNumber(12.78).times(new BigNumber(10).pow(16)), web3.utils.toWei("15")],
                [latestTime() + duration.days(1), latestTime() + duration.days(2)],
                [20, 15],
                [latestTime() + duration.days(40), latestTime() + duration.days(60)],
                [1,0],
                {
                    from: token_owner
                }
            );

            let indi1 = await I_VolumeRestrictionTM.individualRestriction.call(account_investor3);
            let indi2 = await I_VolumeRestrictionTM.individualRestriction.call(account_delegate3);

            assert.equal(indi2[0].dividedBy(new BigNumber(10).pow(18)), 15);
            assert.equal(indi1[0].dividedBy(new BigNumber(10).pow(16)), 12.78);

            assert.equal(indi2[2].toNumber(), 15);
            assert.equal(indi1[2].toNumber(), 20);

            assert.equal(indi2[4].toNumber(), 0);
            assert.equal(indi1[4].toNumber(), 1);
        });

    });

    describe("VolumeRestriction Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_VolumeRestrictionTMFactory.getSetupCost.call(),0);
            assert.equal((await I_VolumeRestrictionTMFactory.getTypes.call())[0],2);
            assert.equal(web3.utils.toAscii(await I_VolumeRestrictionTMFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "VolumeRestrictionTM",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.description.call(),
                        "Manage transfers based on the volume of tokens that needs to be transact",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.title.call(),
                        "Volume Restriction Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.getInstructions.call(),
                        "Module used to restrict the volume of tokens traded by the token holders",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTMFactory.version.call(), "1.0.0");
        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_VolumeRestrictionTMFactory.getTags.call();
            assert.equal(tags.length, 5);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "Maximum Volume");
        });
    });

});
