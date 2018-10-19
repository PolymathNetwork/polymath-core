import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployMaximumVolumeTMAndVerifyed, deployGPMAndVerifyed, deployCountTMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const MaximumVolumeTransferManager = artifacts.require("./MaximumVolumeTransferManager");
const CountTransferManager = artifacts.require("./CountTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("MaximumVolumeTransferManager", accounts => {
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
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_MaximumVolumeTransferManagerFactory;
    let P_MaximumVolumeTransferManagerFactory;
    let P_MaximumVolumeTransferManager;
    let I_CountTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_MaximumVolumeTransferManager;
    let I_CountTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_MRProxied;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

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

    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[5];

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 3: Deploy the MaximumVolumeTransferManagerFactory
        [I_MaximumVolumeTransferManagerFactory] = await deployMaximumVolumeTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 4: Deploy the Paid MaximumVolumeTransferManagerFactory
        [P_MaximumVolumeTransferManagerFactory] = await deployMaximumVolumeTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500", "ether"));
        // STEP 5: Deploy the CountTransferManagerFactory
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        MaximumVolumeTransferManagerFactory: ${I_MaximumVolumeTransferManagerFactory.address}
        CountTransferManagerFactory:       ${I_CountTransferManagerFactory.address}
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
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using whitelist & manual approvals", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("4", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("4", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should successfully attach the MaximumVolumeTransferManager with the security token", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_MaximumVolumeTransferManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_MaximumVolumeTransferManagerFactory.address,
                "0x",
                web3.utils.toWei("500", "ether"),
                0,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "Maximum Volume Transfer Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "MaximumVolumeTransferManager",
                "MaximumVolumeTransferManagerFactory module was not added"
            );
            P_MaximumVolumeTransferManagerFactory = MaximumVolumeTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the MaximumVolumeTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_MaximumVolumeTransferManagerFactory.address, "", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "MaximumVolumeTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "MaximumVolumeTransferManager",
                "MaximumVolumeTransferManager module was not added"
            );
            I_MaximumVolumeTransferManager = MaximumVolumeTransferManager.at(tx.logs[2].args._module);
        });

        it("Cannot call verifyTransfer on the TM directly if _isTransfer == true", async () => {
            await catchRevert(
                I_MaximumVolumeTransferManager.verifyTransfer(
                    account_investor4,
                    account_investor4,
                    web3.utils.toWei("2", "ether"),
                    "",
                    true,
                    { from: token_owner }
                )
            );
        });

        it("Can call verifyTransfer on the TM directly if _isTransfer == false", async () => {
            await I_MaximumVolumeTransferManager.verifyTransfer(
                account_investor4,
                account_investor4,
                web3.utils.toWei("2", "ether"),
                "",
                false,
                { from: token_owner }
            );
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should pause the tranfers at transferManager level", async() => {
            let tx = await I_MaximumVolumeTransferManager.pause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("5", "ether"));
        });

        it("Should unpause the tranfers at transferManager level", async() => {
            await I_MaximumVolumeTransferManager.unpause({from: token_owner});
        });

        let max_vol = web3.utils.toWei('1', 'ether');
        let startTime = 0; //now
        let endTime = latestTime() + duration.years(2);
        let rollingInterval = 1; //weekly

        it("should fail to add a new max volume restriction when called by a non-admin account", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    startTime,
                    endTime,
                    rollingInterval,
                    { from: account_investor1 }
                );
            } catch(error) {
                console.log(`         tx revert -> not an admin`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should not allow creation of a maximum volume restriction if endTime is set to 0", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    startTime,
                    0,
                    rollingInterval,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> invalid end time`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should not allow creation of a maximum volume restriction if rolling interval is not recognized", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    startTime,
                    endTime,
                    6,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> invalid rolling interval enum`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should not allow creation of a maximum volume restriction if startTime is equal to endTime", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    endTime,
                    endTime,
                    rollingInterval,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> invalid startTime and endTime`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should not allow creation of a maximum volume restriction if endTime is less than startTime", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    endTime,
                    startTime,
                    rollingInterval,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> invalid startTime and endTime`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should not allow creation of a maximum volume restriction if rolling interval is greater than the restriction period", async() => {
            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                    max_vol,
                    startTime,
                    startTime + 10,
                    rollingInterval,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> rolling interval is bigger than the restriction period`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should create a Maximum Volume Transfer Restriction", async()=>{
            await I_SecurityToken.changeGranularity(Math.pow(10, 5), { from: token_owner });
            const tx = await I_MaximumVolumeTransferManager.addMaxVolumeRestricion(
                max_vol,
                startTime,
                endTime,
                rollingInterval,
                { from: token_owner }
            );
            const logs = tx.logs[0];
            const currentStartTime = (await web3.eth.getBlock('latest')).timestamp;

            assert.equal(
                1,
                await I_MaximumVolumeTransferManager.getMaximumVolumeRestrictionsCount.call(),
                "Restriction not added to the array"
            );
            assert.equal("AddNewMaximumVolumeRestriction", logs['event'], "Invalid event");
            assert.equal(currentStartTime, logs['args']['_startTime'], "Invalid start time");
            assert.equal(endTime, logs['args']['_endTime'], "Invalid end time");
            assert.equal(rollingInterval , logs['args']['_rollingPeriodInterval'], "Invalid rolling interval");
        });

        it("Should not be able to transfer between existing token holders over maximum limit", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1.1', 'ether'), { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Transfer value exceeds maximum limit`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should allow all token transfers upto the limit and then reject further transfers until the next period starts", async () => {
            const initialBalance = await I_SecurityToken.balanceOf(account_investor3);
            assert.equal(initialBalance.toNumber(), web3.utils.toWei('1', 'ether'));

            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('0.4', 'ether'), { from: account_investor1 });
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('0.2', 'ether'), { from: account_investor1 });
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('0.4', 'ether'), { from: account_investor1 });
            
            let finalBalance = await I_SecurityToken.balanceOf(account_investor3);
            assert.equal(finalBalance.toNumber(), web3.utils.toWei('2', 'ether'));

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> maximum transfer limit exceeded`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            // increase evm time by one week/604800 seconds
            await increaseTime(604800);
            
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), { from: account_investor1 });

            finalBalance = await I_SecurityToken.balanceOf(account_investor3);
            assert.equal(finalBalance.toNumber(), web3.utils.toWei('3', 'ether'));
        });

        it("should allow for modification of an existing maximum volume transfer restriction", async()=>{
            const nRestrictions = await I_MaximumVolumeTransferManager.getMaximumVolumeRestrictionsCount.call();
            const index = nRestrictions - 1;

            const newMaxVolume = web3.utils.toWei('0.5', 'ether');
            const newStartTime = 0;
            const newEndTime = latestTime() + duration.years(1);
            const newRollingInterval = 0;

            const tx = await I_MaximumVolumeTransferManager.modifyMaximumTransferRestriction(
                index,
                newMaxVolume,
                newStartTime,
                newEndTime,
                newRollingInterval,
                { from: token_owner }
            );
            const logs = tx.logs[0];
            const currentStartTime = (await web3.eth.getBlock('latest')).timestamp;

            assert.equal("ModifyMaximumVolumeRestriction", logs['event'], "Invalid event");
            assert.equal(currentStartTime, logs['args']['_startTime'], "Invalid start time");
            assert.equal(newEndTime, logs['args']['_endTime'], "Invalid end time");
            assert.equal(newRollingInterval , logs['args']['_rollingPeriodInterval'], "Invalid rolling interval");
        });

        it("should not allow for modification of an expired restriction", async()=>{
            // increase evm time by 3 years
            await increaseTime(94608000);

            let errorThrown = false;
            try {
                await I_MaximumVolumeTransferManager.modifyMaximumTransferRestriction(
                    0,
                    web3.utils.toWei('5', 'ether'),
                    0,
                    latestTime() + duration.years(1),
                    3,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> Transfer restriction has already expired`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should fail to modify any restriction if index provided is wrong", async() =>{
            let errorThrown = false;
            const nRestrictions = await I_MaximumVolumeTransferManager.getMaximumVolumeRestrictionsCount.call();
            try {
                await I_MaximumVolumeTransferManager.modifyMaximumTransferRestriction(
                    nRestrictions,
                    web3.utils.toWei('5', 'ether'),
                    0,
                    latestTime() + duration.years(1),
                    1,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> Index out of bounds`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should fail to add to add multiple new max volume restrictions when called by a non-admin account", async() => {
            const maxVolumes = [100000000, 500000000, 6000000000];
            const startTimes = [0, 0, 0];
            const endTimes = [latestTime() + duration.years(1), latestTime() + duration.years(2), latestTime() + duration.years(3)];
            const rollingIntervals = [0, 2, 4];

            let errorThrown = false;
            try{
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricionsMulti(
                    maxVolumes,
                    startTimes,
                    endTimes,
                    rollingIntervals,
                    { from: account_investor1 }
                );
            } catch(error) {
                console.log(`         tx revert -> not an admin`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should allow for addition of multiple maximum volume restrictions", async()=>{
            const maxVolumes = [100000000, 500000000, 6000000000];
            const startTimes = [0, 0, 0];
            const endTimes = [latestTime() + duration.years(1), latestTime() + duration.years(2), latestTime() + duration.years(3)];
            const rollingIntervals = [0, 2, 4];

            await I_MaximumVolumeTransferManager.addMaxVolumeRestricionsMulti(
                maxVolumes,
                startTimes,
                endTimes,
                rollingIntervals,
                { from: token_owner }
            );

            assert.equal(
                4,
                await I_MaximumVolumeTransferManager.getMaximumVolumeRestrictionsCount.call(),
                "Failed to add multiple restrictions"
            );
        });

        it("should fail if input array lengths mismatch for mutiple maximum volume transfer restrictions", async()=>{
            const maxVolumes = [100000000, 6000000000];
            const startTimes = [0, 0, 0];
            const endTimes = [latestTime() + duration.years(1)];
            const rollingIntervals = [0, 2, 4];

            let errorThrown = false;
            try {
                await I_MaximumVolumeTransferManager.addMaxVolumeRestricionsMulti(
                    maxVolumes,
                    startTimes,
                    endTimes,
                    rollingIntervals,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> Array lengths mis-match`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("should allow for deletion of a maximum volume transfer restriction", async () => {
            const tx = await I_MaximumVolumeTransferManager.removeMaximumTransferRestriction(1, { from: token_owner });
            const logs = tx.logs[0];
            assert.equal("RemoveMaximumVolumeRestricion", logs['event'], "Invalid event");
        });

        it("should fail to delete any restriction if index provided is wrong", async() =>{
            let errorThrown = false;
            const nRestrictions = await I_MaximumVolumeTransferManager.getMaximumVolumeRestrictionsCount.call();
            try {
                await I_MaximumVolumeTransferManager.removeMaximumTransferRestriction(
                    nRestrictions,
                    { from: token_owner }
                );
            } catch(error) {
                console.log(`         tx revert -> Index out of bounds`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });
        
        it("Should successfully attach the CountTransferManager with the security token (count of 1)", async () => {
            let bytesCountTM = web3.eth.abi.encodeFunctionCall(
                {
                    name: "configure",
                    type: "function",
                    inputs: [
                        {
                            type: "uint256",
                            name: "_maxHolderCount"
                        }
                    ]
                },
                [1]
            );

            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesCountTM, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            let name = web3.utils.toUtf8(tx.logs[2].args._name);
            assert.equal(name, "CountTransferManager", "CountTransferManager module was not added");
            I_CountTransferManager = CountTransferManager.at(tx.logs[2].args._module);
        });

        it("Should get the permission list", async () => {
            let perm = await I_MaximumVolumeTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

        it("Should get the init function", async () => {
            let byte = await I_MaximumVolumeTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ""), 0);
        });
    });

    describe("MaximumVolume Transfer Manager Factory test cases", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_MaximumVolumeTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_MaximumVolumeTransferManagerFactory.getTypes.call())[0], 2);
            let name = web3.utils.toUtf8(await I_MaximumVolumeTransferManagerFactory.getName.call());
            assert.equal(name, "MaximumVolumeTransferManager", "Wrong Module added");
            let desc = await I_MaximumVolumeTransferManagerFactory.getDescription.call();
            assert.equal(desc, "limit the volume of transferable tokens within a rolling time interval", "Wrong Module added");
            let title = await I_MaximumVolumeTransferManagerFactory.getTitle.call();
            assert.equal(title, "Maximum Volume Transfer Manager", "Wrong Module added");
            let inst = await I_MaximumVolumeTransferManagerFactory.getInstructions.call();
            assert.equal(
                inst,
                "Allows an issuer to restrict the total volume of tokens that can be transfered within a rolling time interval.",
                "Wrong Module added"
            );
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_MaximumVolumeTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "MaximumVolume");
        });
    });
});

