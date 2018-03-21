const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require("./TickerRegistrar.sol");
const GeneralDelegateManagerFactory = artifacts.require('./GeneralDelegateManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('CappedSTO', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;

    // Contract Instance Declaration 
    let I_GeneralDelegateManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_ModuleRegistry;
    let I_TickerRegistrar;
    let I_SecurityTokenRegistrar;
    let I_CappedSTOFactory;

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
        "GeneralTransferManager module was not added"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await I_ModuleRegistry.registerModule(I_GeneralDelegateManagerFactory.address, { from: account_polymath });
    module_ = await I_ModuleRegistry.registry(I_GeneralDelegateManagerFactory.address);

    assert.equal(
        web3.utils.toAscii(module_[1])
        .replace(/\u0000/g, ''),
        "GeneralDelegateManager",
        "GeneralDelegateManager module was not added"
    );

    // (C) : Register the STOFactory
    await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
    module_ = await I_ModuleRegistry.registry(I_CappedSTOFactory.address);

    assert.equal(
        web3.utils.toAscii(module_[1])
        .replace(/\u0000/g, ''),
        "CappedSTO",
        "CappedSTOFactory module was not added"
    );

    // Step 6: Deploy the TickerRegistrar

    I_TickerRegistrar = await TickerRegistrar.new({ from: account_polymath });

    assert.notEqual(
        I_TickerRegistrar.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "TickerRegistrar contract was not deployed",
    );
        
    // Step 7: Deploy the SecurityTokenRegistrar

    I_SecurityTokenRegistrar = await SecurityTokenRegistrar.new(
        I_ModuleRegistry.address,
        I_TickerRegistrar.address,
        I_GeneralTransferManagerFactory.address,
        I_GeneralDelegateManagerFactory.address,
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
        SecurityTokenRegistrar: ${I_SecurityTokenRegistrar.address}\n
    `);
});

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            
        });

        it("Should generate the new security token with the same symbol as registered above", async () =>{

        });
    });

})