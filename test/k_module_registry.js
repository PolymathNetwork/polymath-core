import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const MockFactory = artifacts.require('./MockFactory.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('ModuleRegistry', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;

    let balanceOfReceiver;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);

    let ID_snap;
    let message = "Transaction Should fail!";
    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_CappedSTO;
    let I_PolyToken;
    let I_MockFactory;
    let I_DummySTOFactory;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = 'FLAGS';

    // Capped STO details
    let startTime;
    let endTime;
    const cap = new BigNumber(10000).times(new BigNumber(10).pow(18));
    const rate = 1000;
    const fundRaiseType = [0];
    const functionSignature = {
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_startTime'
        },{
            type: 'uint256',
            name: '_endTime'
        },{
            type: 'uint256',
            name: '_cap'
        },{
            type: 'uint256',
            name: '_rate'
        },{
            type: 'uint8[]',
            name: '_fundRaiseTypes',
        },{
            type: 'address',
            name: '_fundsReceiver'
        }
        ]
    };

    const functionSignatureProxy = {
        name: 'initialize',
        type: 'function',
        inputs: [{
            type:'address',
            name: '_polymathRegistry'
        },{
            type: 'address',
            name: '_stVersionProxy'
        },{
            type: 'uint256',
            name: '_stLaunchFee'
        },{
            type: 'uint256',
            name: '_tickerRegFee'
        },{
            type: 'address',
            name: '_polyToken'
        },{
            type: 'address',
            name: 'owner'
        }
    ]
    };

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
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

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

         // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

        // Step 10: Deploy the FeatureRegistry

        I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_FeatureRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FeatureRegistry contract was not deployed",
        );

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_STRProxied.address, {from: account_polymath});
        await I_ModuleRegistry.updateFromRegistry({from: account_polymath});

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Test case of the module registry", async() => {

        it("Should verify the ownership of the module registry", async () => {
            let _owner = await I_ModuleRegistry.owner.call();
            assert.equal(_owner, account_polymath, "Unauthenticated user deployed the contract");
        });

        it("Should successfully deployed the Module Fatories", async () => {

            I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

            assert.notEqual(
                I_GeneralTransferManagerFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "GeneralTransferManagerFactory contract was not deployed"
            );


            I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

            assert.notEqual(
                I_GeneralPermissionManagerFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "GeneralPermissionManagerFactory contract was not deployed"
            );


            I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: account_polymath });

            assert.notEqual(
                I_CappedSTOFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "CappedSTOFactory contract was not deployed"
            );

            I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: account_temp });

            assert.notEqual(
                I_DummySTOFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "DummySTOFactory contract was not deployed"
            );

            I_MockFactory = await MockFactory.new(I_PolyToken.address, 1000 * Math.pow(10, 18), 0, 0, { from: account_temp });

            assert.notEqual(
                I_MockFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "MockFactory contract was not deployed"
            );
        });
    });

    describe("Test cases of register module", async() => {

        it("Should fail to register module if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.pause({ from: account_polymath});
                await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should succssfully register the module", async() => {
            await I_ModuleRegistry.unpause({ from: account_polymath});
            let tx = await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });

            assert.equal(
                tx.logs[0].args._moduleFactory,
                I_GeneralTransferManagerFactory.address,
                "GeneralTransferManagerFactory is not registerd successfully"
            );

            assert.equal(tx.logs[0].args._owner, account_polymath);

            tx = await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });

            assert.equal(
                tx.logs[0].args._moduleFactory,
                I_GeneralPermissionManagerFactory.address,
                "GeneralPermissionManagerFactory is not registerd successfully"
            );

            assert.equal(tx.logs[0].args._owner, account_polymath);

            tx = await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: account_polymath });

            assert.equal(
                tx.logs[0].args._moduleFactory,
                I_CappedSTOFactory.address,
                "CappedSTOFactory is not registerd successfully"
            );

            assert.equal(tx.logs[0].args._owner, account_polymath);

        });

        it("Should fail in registering the same module again", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
            } catch(error) {
                console.log(`         tx revert -> Already Registered Module factory`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in registering the module-- type = 0", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.registerModule(I_MockFactory.address, { from: account_polymath });
            } catch(error) {
                console.log(`         tx revert -> Module factory of 0 type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Test cases for verify module", async() => {

        it("Should fail in calling the verify module. Because msg.sender should be account_polymath", async () => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully verify the module -- true", async() => {
           let tx = await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });
           assert.equal(
                tx.logs[0].args._moduleFactory,
                I_GeneralPermissionManagerFactory.address,
                "Failed in verifying the module"
            );
            assert.equal(
                tx.logs[0].args._verified,
                true,
                "Failed in verifying the module"
            );
        });

        it("Should successfully verify the module -- false", async() => {
            let tx = await I_ModuleRegistry.verifyModule(I_CappedSTOFactory.address, false, { from: account_polymath });
            assert.equal(
                 tx.logs[0].args._moduleFactory,
                 I_CappedSTOFactory.address,
                 "Failed in verifying the module"
             );
             assert.equal(
                 tx.logs[0].args._verified,
                 false,
                 "Failed in verifying the module"
             );
         });

         it("Should fail in verifying the module. Because the module is not registered", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.verifyModule(I_DummySTOFactory.address, true, { from: account_polymath });
            } catch(error) {
                console.log(`         tx revert -> Module is not registered`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
         });
    });

    describe("Deploy the security token registry contract", async() => {

        it("Should successfully deploy the STR", async() => {
            let tx = await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });
           assert.equal(
                tx.logs[0].args._moduleFactory,
                I_GeneralTransferManagerFactory.address,
                "Failed in verifying the module"
            );
            assert.equal(
                tx.logs[0].args._verified,
                true,
                "Failed in verifying the module"
            );

            I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

            assert.notEqual(
                I_STFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "STFactory contract was not deployed",
            );

            I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });
            await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

            assert.notEqual(
                I_SecurityTokenRegistry.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "SecurityTokenRegistry contract was not deployed",
            );

            // Step 10: update the registries addresses from the PolymathRegistry contract
            I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
            let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
            await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

            await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
        });

    });

    describe("Test cases for the tag functions", async() => {

        it("Should fail in adding the tag. Because msg.sender is not the owner", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.addTagByModuleType(3,["Non-Refundable","Capped","ETH","POLY"],{from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully add the tag", async() => {
            await I_ModuleRegistry.addTagByModuleType(3,["Non-Refundable","Capped","ETH","POLY"],{from: account_polymath});
            let tags = await I_ModuleRegistry.getTagByModuleType.call(3);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Non-Refundable");
        });

        it("Should fail in removing the tag from the list", async() => {
            let errorThrown = false;
            try {
                await I_ModuleRegistry.removeTagByModuleType(3,["Capped", "ETH"], {from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should remove the tag from the list", async() => {
            await I_ModuleRegistry.removeTagByModuleType(3,["Capped", "ETH"], {from:account_polymath});
            let tags = await I_ModuleRegistry.getTagByModuleType.call(3);
            assert.equal(web3.utils.toAscii(tags[1]).replace(/\u0000/g, ''),"");
        });

    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:85000000  });

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

    });

    describe("test cases for useModule", async() => {

        it("Should successfully add the CappedSTO module. Because module is deployed by the owner of ST", async() => {
            I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: token_owner });

            assert.notEqual(
                I_CappedSTOFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "CappedSTOFactory contract was not deployed"
            );

            let tx = await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: token_owner });

            assert.equal(
                tx.logs[0].args._moduleFactory,
                I_CappedSTOFactory.address,
                "CappedSTOFactory is not registerd successfully"
            );

            assert.equal(tx.logs[0].args._owner, token_owner);

            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

            tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, { from: token_owner, gas: 60000000 });

            assert.equal(tx.logs[2].args._type, stoKey, "CappedSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "CappedSTO",
                "CappedSTOFactory module was not added"
            );
        });

    });

    describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for reclaiming funds", async() => {

            it("Should successfully reclaim POLY tokens", async() => {
                I_PolyToken.transfer(I_ModuleRegistry.address, web3.utils.toWei("1"), { from: token_owner });
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_ModuleRegistry.reclaimERC20(I_PolyToken.address);
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(bal2.dividedBy(new BigNumber(10).pow(18)).toNumber(), bal2.dividedBy(new BigNumber(10).pow(18)).toNumber());
            });

        });

        describe("Test cases for pausing the contract", async() => {

            it("Should fail to pause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_ModuleRegistry.pause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully pause the contract", async() => {
                await I_ModuleRegistry.pause({ from: account_polymath });
                let status = await I_ModuleRegistry.paused.call();
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_ModuleRegistry.unpause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully unpause the contract", async() => {
                await I_ModuleRegistry.unpause({ from: account_polymath });
                let status = await I_ModuleRegistry.paused.call();
                assert.isNotOk(status);
            });

        });

    });

});
