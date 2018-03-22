import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import { increaseTime } from './helpers/time';

const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require("./TickerRegistrar.sol");
const STVersion = artifacts.require('./STVersionProxy_001.sol');
const GeneralDelegateManagerFactory = artifacts.require('./GeneralDelegateManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralDelegateManager = artifacts.require('./GeneralDelegateManager');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('CappedSTO', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);

    // Contract Instance Declaration 
    let I_GeneralDelegateManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralDelegateManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistrar;
    let I_SecurityTokenRegistrar;
    let I_CappedSTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_CappedSTO;

    // SecurityToken Details
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Capped STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(30);                     // Add 30 days more
    const cap = web3.utils.toWei('100000', 'ether');
    const rate = 1000;

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
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
        }
        ]
    }, [startTime, endTime, cap, rate]);
    

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[2];
        token_owner = account_issuer;

        // ----------- POLYMATH NETWORK Configuration ------------
        
        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new({from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralDelegateManagerFactory = await GeneralDelegateManagerFactory.new({from:account_polymath});

        assert.notEqual(
            I_GeneralDelegateManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new({from:account_polymath});

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        let module_ = await I_ModuleRegistry.registry(I_GeneralTransferManagerFactory.address);

        assert.equal(
            web3.utils.toAscii(module_[1])
            .replace(/\u0000/g, ''),
            "GeneralTransferManager",
            "GeneralTransferManager module was not registered"
        );

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralDelegateManagerFactory.address, { from: account_polymath });
        module_ = await I_ModuleRegistry.registry(I_GeneralDelegateManagerFactory.address);

        assert.equal(
            web3.utils.toAscii(module_[1])
            .replace(/\u0000/g, ''),
            "GeneralDelegateManager",
            "GeneralDelegateManager module was not registered"
        );

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
        module_ = await I_ModuleRegistry.registry(I_CappedSTOFactory.address);

        assert.equal(
            web3.utils.toAscii(module_[1])
            .replace(/\u0000/g, ''),
            "CappedSTO",
            "CappedSTOFactory module was not registered"
        );

        // Step 6: Deploy the TickerRegistrar

        I_TickerRegistrar = await TickerRegistrar.new({ from: account_polymath });

        assert.notEqual(
            I_TickerRegistrar.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistrar contract was not deployed",
        );
            
        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new();

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 8: Deploy the SecurityTokenRegistrar

        I_SecurityTokenRegistrar = await SecurityTokenRegistrar.new(
            I_ModuleRegistry.address,
            I_TickerRegistrar.address,
            I_GeneralTransferManagerFactory.address,
            I_GeneralDelegateManagerFactory.address,
            I_STVersion.address,
            { 
                from: account_polymath
            });

        assert.notEqual(
            I_SecurityTokenRegistrar.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistrar contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistrar
        await I_TickerRegistrar.setTokenRegistrar(I_SecurityTokenRegistrar.address, {from: account_polymath});

        // Printing all the contract addresses 
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralDelegateManagerFactory: ${I_GeneralDelegateManagerFactory.address}\n
            CappedSTOFactory: ${I_CappedSTOFactory.address}\n
            TickerRegistrar: ${I_TickerRegistrar.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistrar: ${I_SecurityTokenRegistrar.address}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_TickerRegistrar.registerTicker(symbol, contact, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            let tx = await I_SecurityTokenRegistrar.generateSecurityToken(name, symbol, decimals, tokenDetails, { from: token_owner });
            
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            
            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralDelegateManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 1);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralDelegateManager"
            );
            LogAddModule.stopWatching();
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(2);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);
           
           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

           moduleData = await I_SecurityToken.modules(1);
           I_GeneralDelegateManager = GeneralDelegateManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralDelegateManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManager contract was not deployed",
           );
        });
        it("Should successfully attach the STO factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, false, { from: token_owner });
            assert.equal(tx.logs[0].args._type.toNumber(), stoKey, "CappedSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[0].args._name)
                .replace(/\u0000/g, ''),
                "CappedSTO",
                "CappedSTOFactory module was not added"
            );
            I_CappedSTO = CappedSTO.at(tx.logs[0].args._module);
        });
    });

    describe("verify the data of STO", async () => {

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                await I_CappedSTO.startTime.call(),
                startTime,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO.endTime.call(),
                endTime,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO.cap.call()).toNumber(),
                cap,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO.rate.call(),
                rate,
                "STO Configuration doesn't set as expected"
            );
        });
    });
    describe("Buy tokens", async() => {

        it("Should buy the tokens -- failed due to startTime is greater than Current time", async () => { 
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`Failed due to startTime is greater than Current time`);
                ensureException(error);
            }
        });

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`Failed because investor doesn't present in the whitelist`);
                ensureException(error);
            }
        });

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                fromTime,
                toTime,
                {
                    form: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
        });
        
    });

});