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
    let tempArrayVariable = new Array();
    let tempArrayGlobal = new Array();

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    async function print(data, account) {
        console.log(`
            Latest timestamp: ${data[0].toNumber()}
            SumOfLastPeriod: ${data[1].dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Days Covered: ${data[2].toNumber()}
            Global days covered: ${data[3].toNumber()}
            Global Sum of LastPeriod: ${data[4].dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Global Latest timestamp: ${data[5].toNumber()}
            Individual Total Trade on latestTimestamp : ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account, data[0]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Global Total Trade on latestTimestamp: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account, data[5]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber()}
        `)
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
                    [latestTime() + duration.days(30), latestTime() + duration.days(30), latestTime() + duration.days(30)],
                    [true, true, true],
                    {
                        from: token_owner
                    }
            );

            // Mint some tokens and transferred to whitelisted addresses
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("40", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("30", "ether"), {from: token_owner});
            
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
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 5);
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
                    [latestTime() + duration.seconds(2), latestTime() + duration.seconds(2), latestTime() + duration.seconds(2)],
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
        });

        it("Should add the restriction succesfully after the expiry of previous one", async() => {
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
        });

        it("Should not successfully transact the tokens -- failed because volume is above the limit", async() => {
            await increaseTime(duration.seconds(10));
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("13"), { from: account_investor1})
            );
        });

        it.skip("Should succesfully transact the tokens just after the startTime", async() => {
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

            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);
            
            assert.equal(
                (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                0.3
            );
            assert.equal(
                data[0].toNumber(),
                (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber()
            );
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 0.3);
            tempArray.push(0.3);
            tempArrayGlobal.push(0);
        })

        it.skip("Should successfully add the global restriction", async() => {
            await I_VolumeRestrictionTM.addGlobalRestriction(
                web3.utils.toWei("15"),
                latestTime() + duration.seconds(2),
                5,
                latestTime() + duration.days(10),
                0,
                {
                    from: token_owner
                }
            );

            let data = await I_VolumeRestrictionTM.globalRestriction.call();
            assert.equal(data[0].toNumber(), web3.utils.toWei("15"));
            assert.equal(data[2].toNumber(), 5);
        });

        it.skip("Should successfully transact the tokens after 1 and half days", async() => {
            await increaseTime(duration.days(1.5));
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();
            let globalStartTime = (await I_VolumeRestrictionTM.globalRestriction.call())[1].toNumber();
            let globalRollingPeriod = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            console.log(`
                Gas estimation (Individual + Global): ${await I_SecurityToken.transfer.estimateGas(account_investor3, web3.utils.toWei("2"), {from: account_investor1})}`
            );
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("2"), {from: account_investor1});
            // Check the balance of the investors 
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 32.7);
            tempArray.push(2);
            tempArrayGlobal.push(2);

            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            await print(data, account_investor1);

            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();
            let globalAmt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[5].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();

            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(), 1);
            assert.equal(data[4].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(globalRollingPeriod, tempArrayGlobal));
            assert.equal(data[5].toNumber(), globalStartTime + duration.days(data[3].toNumber()));
            assert.equal(amt, 2);
            assert.equal(globalAmt, 2);
        });

        it.skip("Should add the daily restriction successfully", async() => {
            await I_VolumeRestrictionTM.addDailyGlobalRestriction(
                web3.utils.toWei("5"),
                latestTime() + duration.seconds(2),
                latestTime() + duration.days(1.1),
                0,
                {
                    from: token_owner
                }
            );
            let data = await I_VolumeRestrictionTM.dailyGlobalRestriction.call();
            assert.equal(data[0].dividedBy(new BigNumber(10).pow(18)).toNumber(), 5);
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[4].toNumber(), 0);
        });

        it.skip("Should transfer tokens within the daily limit -- falied because of limit failing", async() =>{
            // Transfer the 3.1 tokens to check the daily limit
            await increaseTime(5);
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("3.1"), {from: account_investor1})
            );
        });

        it.skip("Should transfer the tokens within the daily limit", async() => {
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();
            let globalStartTime = (await I_VolumeRestrictionTM.globalRestriction.call())[1].toNumber();
            let globalRollingPeriod = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            // Calculate the gas estimation
            console.log(`
                Gas estimation (Individual + Global + daily): ${await I_SecurityToken.transfer.estimateGas(account_investor3, web3.utils.toWei("3"), {from: account_investor1})}
            `)
            // Transfer the 3 tokens
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("3"), {from: account_investor1});
            tempArray[tempArray.length -1] += 3;
            tempArrayGlobal[tempArrayGlobal.length -1] += 3;
            // getting the data of the bucket
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            // print the logs
            await print(data, account_investor1);
            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();
            let globalAmt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[5].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();
            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray));
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[3].toNumber(), 1);
            assert.equal(data[4].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArrayGlobal));
            assert.equal(data[5].toNumber(), globalStartTime + duration.days(data[3].toNumber()));
            assert.equal(amt, 5);
            assert.equal(globalAmt, 5);
        });

        it.skip("Should transfer tokens within the daily limit -- falied because of limit failing", async() =>{
            // Transfer the 0.1 tokens to check the daily limit
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("0.1"), {from: account_investor1})
            );
        });

        it.skip("Should successfully transact tokens on the next day of the rolling period (Fuzz test)", async() => {
            // Increase time half day
            await increaseTime(duration.days(.52));
            // Check the balance of the investors 
            let balBefore = await I_SecurityToken.balanceOf.call(account_investor1);
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[1].toNumber();
            let rollingPeriod = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();
            let globalStartTime = (await I_VolumeRestrictionTM.globalRestriction.call())[1].toNumber();
            let globalRollingPeriod = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();

            let totalAmountTransacted = 0;
            // transactions performed 
            for (let i = 0; i < 5; i++) {
                let amount = Math.floor(Math.random() * (1000 - 100) + 100) / 1000;
                // Calculate the gas estimation
                console.log(`
                    Gas estimation (Individual + Global + daily): ${await I_SecurityToken.transfer.estimateGas(account_investor3, web3.utils.toWei(amount.toString()), {from: account_investor1})}
                `)
                await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(amount.toString()), {from: account_investor1});
                console.log(`${i}: Restricted investor 1 able to transact ${amount} tokens to investor 3`); 
                totalAmountTransacted += amount;
            } 
            
            // Check the balance of the investors 
            let balAfter = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.closeTo((balBefore.minus(balAfter).dividedBy(new BigNumber(10).pow(18))).toNumber(), totalAmountTransacted, 0.01);
            tempArray.push(totalAmountTransacted);
            tempArrayGlobal.push(totalAmountTransacted);
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            // print the logs
            await print(data, account_investor1);
            // get the trade amount using the timestamp
            let amt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();
            let globalAmt = (await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[5].toNumber()))
            .dividedBy(new BigNumber(10).pow(18)).toNumber();
            // Verify the storage changes
            assert.equal(data[0].toNumber(), startTime + duration.days(data[2].toNumber()));
            assert.closeTo(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArray), 0.01);
            assert.equal(data[2].toNumber(), 2);
            assert.equal(data[3].toNumber(), 2);
            assert.closeTo(data[4].dividedBy(new BigNumber(10).pow(18)).toNumber(), await calculateSum(rollingPeriod, tempArrayGlobal), 0.01);
            assert.equal(data[5].toNumber(), globalStartTime + duration.days(data[3].toNumber()));
            assert.closeTo(amt, totalAmountTransacted, 0.01);
            assert.closeTo(globalAmt, totalAmountTransacted, 0.01);
        });

        it.skip("Should fail to transact the tokens more than the allowed tokens in a rolling period", async() => {
            // Increase the time by 3/5 of the day
            await increaseTime(duration.days(.6));
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            let minimumAmount = new BigNumber(12).times(new BigNumber(10).pow(18)).minus(data[1]);
            let testAmount = minimumAmount.plus(new BigNumber(1).times(new BigNumber(10).pow(18)))
            await catchRevert( 
                I_SecurityToken.transfer(account_investor3, testAmount, {from: account_investor1})
            );
        });

        it.skip("Should fail to buy tokens in the new rolling period --failed because amount is more than last 1 timestamps", async() => {
            await increaseTime(duration.days(1));
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("10"), {from: account_investor1})
            );
        });

        it.skip("Should add the daily restriction again successfully", async() => {
            await I_VolumeRestrictionTM.addDailyGlobalRestriction(
                web3.utils.toWei("7"),
                latestTime() + duration.seconds(2),
                latestTime() + duration.days(10),
                0,
                {
                    from: token_owner
                }
            );
            let data = await I_VolumeRestrictionTM.dailyGlobalRestriction.call();
            assert.equal(data[0].dividedBy(new BigNumber(10).pow(18)).toNumber(), 7);
            assert.equal(data[2].toNumber(), 1);
            assert.equal(data[4].toNumber(), 0);
        });

        it.skip("Should transfer the tokens in a new rolling period", async() => {
            let oldData = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();
            let firstDayAmount;
            tempAmount = new BigNumber(0);
            for (let i = 0; i < oldData[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${oldData[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, oldData[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                if (i != 2) {
                    firstDayAmount = await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, oldData[0][0]);
                    tempAmount = tempAmount.plus(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, oldData[0][i]));
                }
            }

            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((oldData[1].toNumber()).toString())}
                Last Timestamp Index : ${oldData[0].length -1}
            `);

            let currentDayAmount = firstDayAmount.plus(new BigNumber(1).times(new BigNumber(10).pow(18)));
            let tx = await I_SecurityToken.transfer(account_investor3, currentDayAmount, {from: account_investor1});
            tempAmount = tempAmount.minus(currentDayAmount);
            tempArray.push(0);
            tempArray.push(currentDayAmount.dividedBy(new BigNumber(10).pow(18)).toNumber());
            console.log('\n');
            let newData = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            for (let i = 2; i < newData[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${newData[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, newData[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(newData[0][i].toNumber(), startTime + duration.days(i))
                assert.closeTo((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, newData[0][i]))
                        .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArray[i], 0.001);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((newData[1].toNumber()).toString())}
                Last Timestamp Index : ${newData[0].length -1}
            `);
        });

        it.skip("Should transfer the more tokens on the same day", async() => {
            // Check the balance of the investors 
            let balBefore = await I_SecurityToken.balanceOf.call(account_investor1);
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor1))[2].toNumber();
            await I_SecurityToken.transfer(account_investor3, tempAmount, {from: account_investor1});

            // Check the balance of the investors 
            let balAfter = await I_SecurityToken.balanceOf.call(account_investor1);
            // Verifying the balances
            assert.closeTo(
                (balBefore.minus(balAfter).dividedBy(new BigNumber(10).pow(18))).toNumber(),
                tempAmount.dividedBy(new BigNumber(10).pow(18)).toNumber(),
                0.01
            );
            tempArray[tempArray.length -1] = tempArray[tempArray.length -1] + tempAmount.dividedBy(new BigNumber(10).pow(18)).toNumber();
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor1);
            for (let i = 2; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i))
                assert.closeTo((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor1, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArray[i], 0.001);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length -1}
            `);
            let sumOflastperiod = 0;
            for (let i = tempArray.length - 1; i >= tempArray.length - 3; i--) {
                sumOflastperiod += tempArray[i];
            }
            assert.equal(data[0].length - 1, 4);
            assert.closeTo(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), sumOflastperiod, 0.001);
        });
    });

    describe.skip("Test case for the variable individual restriction", async() => {
        it("Should add the restriction succesfully", async() => {
            let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor2,
                    0,
                    new BigNumber(20).times(new BigNumber(10).pow(16)),
                    latestTime() + duration.seconds(2),
                    3,
                    latestTime() + duration.days(10),
                    1,
                    {
                        from: token_owner
                    }
                );
            
            assert.equal(tx.logs[0].args._holder, account_investor2);
            assert.equal(tx.logs[0].args._typeOfRestriction, 1);
        });

        it("Should not successfully transact the tokens -- failed because volume is above the limit", async() => {
            await increaseTime(duration.seconds(10));
            await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei("15"), { from: account_investor2})
            );
        });

        it("Should succesfully transact the tokens just after the starttime", async() => {
            // Check the transfer will be valid or not by calling the verifyTransfer() directly by using _isTransfer = false
            let result = await I_VolumeRestrictionTM.verifyTransfer.call(account_investor2, account_investor3, web3.utils.toWei('.3'), "0x0", false);
            console.log(result);
            assert.equal(result.toNumber(), 1);
            // Perform the transaction
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('.3'), {from: account_investor2});
            // Check the balance of the investors 
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor2);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 29.7);

            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            console.log('\n');
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), 0.3);
                assert.equal(data[0][i].toNumber(), (await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[2].toNumber())
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length -1}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 0.3);
            assert.equal(data[0].length -1, 0);
            tempArrayVariable.push(0.3);
        });

        it("Should successfully transact the tokens after 1 and half days", async() => {
            await increaseTime(duration.days(1.5));
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[2].toNumber();
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("1"), {from: account_investor2});
            // Check the balance of the investors 
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor2);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 28.7);
            tempArrayVariable.push(1);
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayVariable[i]);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length -1}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 1.3);
            assert.equal(data[0].length -1, 1);
        });

        it("Should successfully transact more tokens on the same day (Fuzz test)", async() => {
            // Check the balance of the investors 
            let balBefore = await I_SecurityToken.balanceOf.call(account_investor2);
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[2].toNumber();
            let totalAmountTransacted = 0;
            for (let i = 0; i < 10; i++) {
                let amount = Math.floor(Math.random() * (1000 - 100) + 100) / 1000;
                await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(amount.toString()), {from: account_investor2});
                console.log(`${i}: Restricted investor 2 able to transact ${amount} tokens to investor 3`); 
                totalAmountTransacted += amount;
            } 
            
            // Check the balance of the investors 
            let balAfter = await I_SecurityToken.balanceOf.call(account_investor2);
            tempArrayVariable[1] = tempArrayVariable[1] + totalAmountTransacted;
            // Verifying the balances
            assert.closeTo((balBefore.minus(balAfter).dividedBy(new BigNumber(10).pow(18))).toNumber(), totalAmountTransacted, 0.01);

            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.closeTo((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayVariable[i], 0.000001);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i))
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
            `);
            assert.closeTo(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), 1.3 + totalAmountTransacted, 0.000001);
            assert.equal(data[0].length -1, 1);
        });

        it("Should successfully transfer the tokens after half days-- should increase the day covered by 1", async() => {
            let oldData = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            let startTime = (await I_VolumeRestrictionTM.individualRestriction.call(account_investor2))[2].toNumber();
            await increaseTime(duration.days(.5));
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("2"), {from: account_investor2});
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            tempArrayVariable.push(2);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i))
                assert.closeTo((await I_VolumeRestrictionTM.getTotalTradeByuser.call(account_investor2, data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayVariable[i], 0.000001);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
            `);
            assert.equal(data[0].length - 1, 2);
            assert.equal(data[1].dividedBy(new BigNumber(10).pow(18)).toNumber(), 
                (oldData[1].plus(new BigNumber(2).times(new BigNumber(10).pow(18))))
                .dividedBy(new BigNumber(10).pow(18)).toNumber());
        });

        it("Should fail to transfer the tokens on third day -- because it is more than the rolling period allowed", async() => {
            let data = await I_VolumeRestrictionTM.getBucketDetailsToUser.call(account_investor2);
            let res = await I_VolumeRestrictionTM.individualRestriction.call(account_investor2);
            let allowedAmount = (res[1].mul(await I_SecurityToken.totalSupply.call())).dividedBy(new BigNumber(10).pow(18));
            let remainingAmount = allowedAmount.minus(data[1]);

            await catchRevert(
                I_SecurityToken.transfer(
                account_investor3,
                remainingAmount.plus(new BigNumber(1).times(new BigNumber(10).pow(18))),
                {
                    from: account_investor2
                }
                )
            );
            tempAmount = remainingAmount;
        });

        it("Should successfully transfer tokens more than the allowed as totalsupply get increased", async() => {
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("10"), { from: token_owner });
            
            await I_SecurityToken.transfer(
                account_investor3,
                tempAmount.plus(new BigNumber(1).times(new BigNumber(10).pow(18))),
                {
                    from: account_investor2
                }
            );
        });
    });

    describe.skip("Add the test cases for global restriction", async() => {

        it("Should successfully add the global restriction", async() => {
            await I_VolumeRestrictionTM.addGlobalRestriction(
                web3.utils.toWei("20"),
                0,
                latestTime() + duration.seconds(2),
                3,
                latestTime() + duration.days(10),
                0,
                {
                    from: token_owner
                }
            );

            let data = await I_VolumeRestrictionTM.globalRestriction.call();
            assert.equal(data[0], web3.utils.toWei("20"));
            assert.equal(data[3], 3);
        });

        it("Should successfully add the 2 more address in the whitelist", async() => {
            await I_GeneralTransferManager.modifyWhitelistMulti(
                [account_investor4, account_delegate3],
                [latestTime(), latestTime()],
                [latestTime(), latestTime()],
                [latestTime() + duration.days(30), latestTime() + duration.days(30)],
                [true, true],
                {
                    from: token_owner
                }
            );

            // Mint some tokens and transferred to whitelisted addresses
            await I_SecurityToken.mint(account_investor4, web3.utils.toWei("40", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_delegate3, web3.utils.toWei("30", "ether"), {from: token_owner});
            
            // Check the balance of the investors 
            let bal1 = await I_SecurityToken.balanceOf.call(account_investor4);
            let bal2 = await I_SecurityToken.balanceOf.call(account_delegate3);
            // Verifying the balances
            assert.equal(web3.utils.fromWei((bal1.toNumber()).toString()), 40);
            assert.equal(web3.utils.fromWei((bal2.toNumber()).toString()), 30);
        });

        it("Should successfully transfer the tokens with in the global range", async() => {
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("1"), {from: account_investor4});
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            let latestTimestamp = 0;
            tempArrayGlobal.push(1);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 1);
            assert.equal(data[0].length - 1, 0);

            console.log(`Transfer the tokens from the another investor comes under the global category`);
            await increaseTime(duration.minutes(10));
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("4"), {from: account_delegate3});
            tempArrayGlobal[tempArrayGlobal.length - 1] += 4; 
            data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
                latestTimestamp = data[0][i];
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 5);
            assert.equal(data[0].length - 1, 0);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 5);
        });

        it("Should transfer the tokens on the another day", async() => {
            await increaseTime(duration.days(1.2));
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("5"), { from: account_investor3});
            tempArrayGlobal.push(5);
            let latestTimestamp = 0;
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
                latestTimestamp = data[0][i];
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 10);
            assert.equal(data[0].length - 1, 1);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 5);
        });

        it("Should transfer tokens on the third day of rolling period", async() => {
            await increaseTime(duration.days(1));
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("6"), {from: account_investor4});
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            tempArrayGlobal.push(6);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 16);
            assert.equal(data[0].length - 1, 2);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 6);

            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("4"), {from: account_delegate3});
            data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            tempArrayGlobal[tempArrayGlobal.length -1] += 4; 
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 20);
            assert.equal(data[0].length - 1, 2);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 10);
        })

        it("Should transfer of tokens get failed - limit of global token txn get reached", async() => {
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            let latestTimestamp = 0;
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                latestTimestamp = data[0][i];
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);

            // Already 20 tokens transferred
            await catchRevert(
                I_SecurityToken.transfer(account_delegate3, web3.utils.toWei("5"), {from: account_investor3})
            );
        });

        it("Should allow to transact on the next rolling period", async() => {
            await increaseTime(duration.days(1.7));
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("1"), {from: account_investor4});
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            let latestTimestamp = 0;
            tempArrayGlobal.push(1);
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
                latestTimestamp = data[0][i];
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 16);
            assert.equal(data[0].length - 1, 3);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 1);
        });

        it("Should add the daily restriction successfully", async() => {
            await I_VolumeRestrictionTM.addDailyGlobalRestriction(
                web3.utils.toWei("5"),
                0,
                latestTime() + duration.seconds(2),
                latestTime() + duration.days(3),
                0,
                {
                    from: token_owner
                }
            );
            let data = await I_VolumeRestrictionTM.dailyGlobalRestriction.call();
            assert.equal(data[0].dividedBy(new BigNumber(10).pow(18)).toNumber(), 5);
            assert.equal(data[1].toNumber(), 0);
            assert.equal(data[5].toNumber(), 0);
        });

        it("Should failed to transact tokens -- failed because amount of tx is more than the daily limit",async() => {
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await increaseTime(duration.days(2));
            // Failed because amount of tokens is greater than the daily limit
            await catchRevert(
                I_SecurityToken.transfer(account_delegate3, web3.utils.toWei("5.1"), {from: account_investor4})
            );
        });

        it("Should transfer the tokens with in the daily limit", async() => {
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await I_SecurityToken.transfer(account_delegate3, web3.utils.toWei("4.9"), {from: account_investor4});
            tempArrayGlobal.push(0);
            tempArrayGlobal.push(4.9);
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 5.9);
            assert.equal(data[0].length - 1, 5);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 4.9);
        });

        it("Should transact the tokens more than the daily limit because daily limit restriction is ended", async() => {
            let startTime = (await I_VolumeRestrictionTM.globalRestriction.call())[2].toNumber();
            await increaseTime(duration.days(1));
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("10"), {from: account_delegate3});
            tempArrayGlobal.push(10);
            let data = await I_VolumeRestrictionTM.getGlobalBucketDetails.call();
            for (let i = 0; i < data[0].length; i++) {
                console.log(`
                    Timestamps array index ${i}: ${data[0][i].toNumber()}
                    Total Trade till now: ${(await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                        .dividedBy(new BigNumber(10).pow(18))}
                `);
                assert.equal(data[0][i].toNumber(), startTime + duration.days(i));
                assert.equal((await I_VolumeRestrictionTM.globalBucket.call(data[0][i]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber(), tempArrayGlobal[i]);
            }
            console.log(`
                SumOfLastPeriod : ${web3.utils.fromWei((data[1].toNumber()).toString())}
                Last Timestamp Index : ${data[0].length - 1}
                Total amount traded in a day: ${web3.utils.fromWei((data[2].toNumber()).toString())}
            `);
            assert.equal(web3.utils.fromWei((data[1].toNumber()).toString()), 14.9);
            assert.equal(data[0].length - 1, 6);
            assert.equal(web3.utils.fromWei((data[2].toNumber()).toString()), 10);
        });
    })

    describe.skip("Test for the exemptlist", async() => {

        it("Should add the token holder in the exemption list -- failed because of bad owner", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.changeExemptWalletList(account_investor4, true, {from: account_polymath})
            );
        });

        it("Should add the token holder in the exemption list", async() => {
            await I_VolumeRestrictionTM.changeExemptWalletList(account_investor4, true, {from: token_owner});
            let beforeBal = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("3"), {from: account_investor4});
            let afterBal = await I_SecurityToken.balanceOf.call(account_investor4);
            let diff = beforeBal.minus(afterBal);
            assert.equal(web3.utils.fromWei((diff.toNumber()).toString()), 3);
        });
    });

    describe.skip("Test for modify functions", async() => {

        it("Should not able to modify the already started restrictions --global", async() =>{
            await catchRevert(
                I_VolumeRestrictionTM.modifyGlobalRestriction(
                    web3.utils.toWei("50"),
                    0,
                    latestTime() + duration.seconds(50),
                    10,
                    latestTime() + duration.days(20),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should not able to modify the already started restrictions -- daily global", async() =>{
            await catchRevert(
                I_VolumeRestrictionTM.modifyDailyGlobalRestriction(
                    web3.utils.toWei("50"),
                    0,
                    latestTime() + duration.seconds(50),
                    latestTime() + duration.days(20),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should not able to modify the already started restrictions -- Individual", async() =>{
            await catchRevert(
                I_VolumeRestrictionTM.modifyIndividualRestriction(
                    account_investor2,
                    web3.utils.toWei("50"),
                    0,
                    latestTime() + duration.seconds(50),
                    10,
                    latestTime() + duration.days(20),
                    0,
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should not able to modify the already started transaction -- multi Individuals", async() => {
            await catchRevert(
                I_VolumeRestrictionTM.modifyIndividualRestrictionMulti(
                    [account_investor2, account_investor1],
                    [web3.utils.toWei("50"), web3.utils.toWei("50")],
                    [0, 0],
                    [latestTime() + duration.seconds(50), latestTime() + duration.seconds(50)],
                    [10, 20],
                    [latestTime() + duration.days(20), latestTime() + duration.days(50)],
                    [0, 0],
                    {
                        from: token_owner
                    }
                )
            );
        });

        it("Should add the individual restriction for multiple investor", async() => {
            await I_VolumeRestrictionTM.addIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [web3.utils.toWei("15"), 0],
                [0, new BigNumber(12.78).times(new BigNumber(10).pow(16))],
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
            assert.equal(indi2[0].dividedBy(new BigNumber(10).pow(18)), 0);

            assert.equal(indi1[1].dividedBy(new BigNumber(10).pow(18)), 0);
            assert.equal(indi2[1].dividedBy(new BigNumber(10).pow(16)), 12.78);

            assert.equal(indi1[3].toNumber(), 15);
            assert.equal(indi2[3].toNumber(), 20);

            assert.equal(indi1[5].toNumber(), 0);
            assert.equal(indi2[5].toNumber(), 1);
        });

        it("Should modify the details before the starttime passed", async() => {
            await I_VolumeRestrictionTM.modifyIndividualRestrictionMulti(
                [account_investor3, account_delegate3],
                [0, web3.utils.toWei("15")],
                [new BigNumber(12.78).times(new BigNumber(10).pow(16)), 0],
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
            assert.equal(indi1[0].dividedBy(new BigNumber(10).pow(18)), 0);

            assert.equal(indi2[1].dividedBy(new BigNumber(10).pow(18)), 0);
            assert.equal(indi1[1].dividedBy(new BigNumber(10).pow(16)), 12.78);

            assert.equal(indi2[3].toNumber(), 15);
            assert.equal(indi1[3].toNumber(), 20);

            assert.equal(indi2[5].toNumber(), 0);
            assert.equal(indi1[5].toNumber(), 1);
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
            assert.equal(tags.length, 4);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "Maximum Volume");
        });
    });
    
});