import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const PreSaleSTOFactory = artifacts.require('./PreSaleSTOFactory.sol');
const PreSaleSTO = artifacts.require('./PreSaleSTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('PreSaleSTO', accounts => {
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
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_PreSaleSTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_PreSaleSTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details for funds raise Type ETH
    const swarmHash = "dagwrgwgvwergwrvwrg";
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
    const initRegFee = 250 * Math.pow(10, 18);

    // PreSale STO details
    let endTime;                                      // Start time will be 5000 seconds more than the latest time
    const functionSignature = {
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_endTime'
        }]
    };

    before(async() => {

        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[4];
        account_investor2 = accounts[3];
        account_investor3 = accounts[5];
        account_fundsReceiver = accounts[2];
        token_owner = account_issuer;

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})

        // STEP 2: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the PreSaleSTOFactory

        I_PreSaleSTOFactory = await PreSaleSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: token_owner });

        assert.notEqual(
            I_PreSaleSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PreSaleSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_PreSaleSTOFactory.address, { from: token_owner });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, initRegFee, { from: account_polymath });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 8: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolymathRegistry.address,
            I_STVersion.address,
            initRegFee,
            {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        await I_SecurityTokenRegistry.updateFromRegistry({from: account_polymath});
        await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
        await I_TickerRegistry.updateFromRegistry({from: account_polymath});


        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            PreSaleSTOFactory: ${I_PreSaleSTOFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
            LatestTime: ${latestTime()}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner });
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000 });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(transferManagerKey, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

        });

        it("Should fail to launch the STO due to endTime is 0", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [0]);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner, gas: 26000000 });
            } catch(error) {
                console.log(`         tx revert -> Rate is ${0}. Test Passed Successfully`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            endTime = latestTime() + duration.days(30);           // Start time will be 5000 seconds more than the latest time
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [endTime]);

            const tx = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, bytesSTO, 0, 0, { from: token_owner, gas: 26000000 });

            assert.equal(tx.logs[2].args._type, stoKey, "PreSaleSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "PreSaleSTO",
                "PreSaleSTOFactory module was not added"
            );
            I_PreSaleSTO = PreSaleSTO.at(tx.logs[2].args._module);
        });
    });

    describe("verify the data of STO", async () => {

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                (await I_PreSaleSTO.endTime.call()).toNumber(),
                endTime,
                "STO Configuration doesn't set as expected"
            );
        });

        it("Should get the permissions", async() => {
           let perm = await I_PreSaleSTO.getPermissions.call();
           assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ''), "PRE_SALE_ADMIN");
        });
    });

    describe("Buy tokens", async() => {

        it("Should allocate the tokens -- failed due to investor not on whitelist", async () => {
            let errorThrown = false;
            try {
                await I_PreSaleSTO.allocateTokens(account_investor1, 1000, web3.utils.toWei('1', 'ether'), 0);
            } catch(error) {
                console.log(`         tx revert -> Investor is not on whitelist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should Buy the tokens", async() => {
            fromTime = latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(duration.days(1));
            await I_PreSaleSTO.allocateTokens(account_investor1, web3.utils.toWei('1', 'ether'), web3.utils.toWei('1', 'ether'), 0, {from: account_issuer, gas: 60000000});

            assert.equal(
                (await I_PreSaleSTO.getRaisedEther.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1
            );
            console.log(await I_PreSaleSTO.getNumberInvestors.call());
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 1);
            // assert.isTrue(false);

        });

        it("Should allocate the tokens -- failed due to msg.sender is not pre sale admin", async () => {
            let errorThrown = false;
            try {
                await I_PreSaleSTO.allocateTokens(account_investor1, web3.utils.toWei('1', 'ether'), web3.utils.toWei('1', 'ether'), 0, {from: account_fundsReceiver, gas: 60000000});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not pre sale admin`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should allocate tokens to multiple investors", async() => {
            fromTime = latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            // Add the Investor in to the whitelist
            let tx1 = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx1.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

            // Add the Investor in to the whitelist
            let tx2 = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx2.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");

            await I_PreSaleSTO.allocateTokensMulti([account_investor2, account_investor3], [web3.utils.toWei('1', 'ether'), web3.utils.toWei('1', 'ether')], [0,0], [web3.utils.toWei('1000', 'ether'), web3.utils.toWei('1000', 'ether')], {from: account_issuer, gas: 60000000});

            assert.equal(
                (await I_PreSaleSTO.getRaisedPOLY.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                2000
            );
            assert.equal((await I_PreSaleSTO.getNumberInvestors.call()).toNumber(), 3);
        });

        it("Should failed at the time of buying the tokens -- Because STO has started", async() => {
            await increaseTime(duration.days(100)); // increased beyond the end time of the STO
            let errorThrown = false;
            try {
                // Fallback transaction
                await I_PreSaleSTO.allocateTokens(account_investor1, 1000, web3.utils.toWei('1', 'ether'), 0, {from: account_issuer});
            } catch(error) {
                console.log(`         tx revert -> STO has started`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

    });

    describe("Reclaim poly sent to STO by mistake", async() => {

        it("Should fail to reclaim POLY because token contract address is 0 address", async() => {
            let value = web3.utils.toWei('100','ether');
            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });

            let errorThrown = false;
            try {
                 await I_PreSaleSTO.reclaimERC20('0x0000000000000000000000000000000000000000', { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> token contract address is 0 address`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully reclaim POLY", async() => {
            let initInvestorBalance = await I_PolyToken.balanceOf(account_investor1);
            let initOwnerBalance = await I_PolyToken.balanceOf(token_owner);
            let initContractBalance = await I_PolyToken.balanceOf(I_PreSaleSTO.address);
            let value = web3.utils.toWei('100','ether');

            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_PreSaleSTO.address, value, { from: account_investor1 });
            await I_PreSaleSTO.reclaimERC20(I_PolyToken.address, { from: token_owner });
            assert.equal((await I_PolyToken.balanceOf(account_investor3)).toNumber(), initInvestorBalance.toNumber(), "tokens are not transfered out from investor account");
            assert.equal((await I_PolyToken.balanceOf(token_owner)).toNumber(), initOwnerBalance.add(value).add(initContractBalance).toNumber(), "tokens are not added to the owner account");
            assert.equal((await I_PolyToken.balanceOf(I_PreSaleSTO.address)).toNumber(), 0, "tokens are not trandfered out from STO contract");
        });
    });

    describe("Test cases for the PresaleSTOFactory", async() => {
        it("should get the exact details of the factory", async() => {
            assert.equal(await I_PreSaleSTOFactory.setupCost.call(),0);
            assert.equal(await I_PreSaleSTOFactory.getType.call(),3);
            assert.equal(web3.utils.toAscii(await I_PreSaleSTOFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "PreSaleSTO",
                        "Wrong Module added");
            assert.equal(await I_PreSaleSTOFactory.getDescription.call(),
                        "Allows Issuer to configure pre-sale token allocations",
                        "Wrong Module added");
            assert.equal(await I_PreSaleSTOFactory.getTitle.call(),
                        "PreSale STO",
                        "Wrong Module added");
            assert.equal(await I_PreSaleSTOFactory.getInstructions.call(),
                        "Configure and track pre-sale token allocations",
                        "Wrong Module added");
            let tags = await I_PreSaleSTOFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Presale");
        });
     });

});
