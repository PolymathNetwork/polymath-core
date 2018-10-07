import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { encodeProxyCall } from './helpers/encodeCall';

const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const SecurityTokenRegistryMock = artifacts.require("./SecurityTokenRegistryMock.sol");
const OwnedUpgradeabilityProxy = artifacts.require('./OwnedUpgradeabilityProxy.sol');
const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol')
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol')
const STFactory = artifacts.require('./STFactory.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol')

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract ("SecurityTokenRegistryProxy", accounts => {


    let I_SecurityTokenRegistry;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryMock;
    let I_STFactory;
    let I_PolymathRegistry;
    let I_ModuleRegistryProxy;
    let I_PolyToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_SecurityToken;
    let I_ModuleRegistry;
    let I_FeatureRegistry;

    let account_polymath;
    let account_temp;
    let token_owner;
    let account_polymath_new;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");
    const version = "1.0.0";
    const message = "Transaction Should Fail!";

    // SecurityToken Details for funds raise Type ETH
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    const transferManagerKey = 2;
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    async function readStorage(contractAddress, slot) {
        return await web3.eth.getStorageAt(contractAddress, slot);
    }

    before(async() => {
        account_polymath = accounts[0];
        account_temp = accounts[1];
        token_owner = accounts[2];
        account_polymath_new = accounts[3];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

         // Step 2: Deploy the FeatureRegistry

         I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });

        // STEP 3: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});
        // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);

        // STEP 4: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // Register the Modules with the ModuleRegistry contract


        // Step 3: Deploy the STFactory contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
             I_STFactory.address.valueOf(),
             "0x0000000000000000000000000000000000000000",
             "STFactory contract was not deployed",
        );

        // Step 4: Deploy the SecurityTokenRegistry
        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});
        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });


         // Printing all the contract addresses
         console.log(`
         --------------------- Polymath Network Smart Contracts: ---------------------
         PolymathRegistry:                  ${PolymathRegistry.address}
         SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
         SecurityTokenRegistry:             ${SecurityTokenRegistry.address}

         STFactory:                         ${STFactory.address}
         GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
         -----------------------------------------------------------------------------
         `);
    });

    describe("Attach the implementation address", async() => {

        // Storage
        // __version -- index 11
        // __implementation -- index 12
        // __upgradeabilityOwner -- index 13

        it("Should attach the implementation and version", async() => {
            let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
            await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
            let c = OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistry.address);
            assert.equal((web3.utils.toAscii(await readStorage(c.address, 11)).replace(/\u0000/g, '')).replace(/\n/, ''), "1.0.0");
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
        });

        it("Verify the initialize data", async() => {
            assert.equal((await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("expiryLimit"))).toNumber(), 60*24*60*60, "Should equal to 60 days");
            assert.equal((await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("tickerRegFee"))).toNumber(), web3.utils.toWei("250"));
        });

    })

    describe("Feed some data in storage", async() => {

        it("Register the ticker", async() => {
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, "Owner should be the same as registered with the ticker");
            assert.equal(tx.logs[0].args._ticker, symbol, "Same as the symbol registered in the registerTicker function call");
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);


            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
        });
    })

    describe("Upgrade the imlplementation address", async() => {

        it("Should upgrade the version and implementation address -- fail bad owner", async() => {
            let errorThrown = false;
            I_SecurityTokenRegistryMock = await SecurityTokenRegistryMock.new({from: account_polymath});
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryMock.address, {from: account_temp});
            } catch(error) {
                console.log(`       tx -> revert bad owner of the proxy contract`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and implementation address -- Implementaion address should be a contract address", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", account_temp, {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert Implementaion address should be a contract address`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be 0x", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", "0x00000000000000000000000000000000000000", {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert Implemenation address should not be 0x`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be the same address", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistry.address, {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert Implemenation address should not be the same address`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and implementation address -- same version as previous is not allowed", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.0.0", I_SecurityTokenRegistryMock.address, {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert same version as previous is not allowed`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and implementation address -- empty version string is not allowed", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("", I_SecurityTokenRegistryMock.address, {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert empty version string is not allowed`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should upgrade the version and the implementation address successfully", async() => {
            await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryMock.address, {from: account_polymath});
            let c = OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal((web3.utils.toAscii(await readStorage(c.address, 11)).replace(/\u0000/g, '')).replace(/\n/, ''), "1.1.0", "Version mis-match");
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistryMock.address, "Implemnted address is not matched");
            I_STRProxied = await SecurityTokenRegistryMock.at(I_SecurityTokenRegistryProxy.address);
        });
    });

    describe("Execute functionality of the implementation contract on the earlier storage", async() => {

        it("Should get the previous data", async() => {
            let _tokenAddress = await I_STRProxied.getSecurityTokenAddress.call(symbol);
            let _data = await I_STRProxied.getSecurityTokenData.call(_tokenAddress);
            assert.equal(_data[0], symbol, "Symbol should match with registered symbol");
            assert.equal(_data[1], token_owner, "Owner should be the deployer of token");
            assert.equal(_data[2], tokenDetails, "Token details should matched with deployed ticker");
        });

        it("Should alter the old storage", async() => {
            await I_STRProxied.changeTheDeployedAddress(symbol, account_temp, {from: account_polymath});
            let _tokenAddress = await I_STRProxied.getSecurityTokenAddress.call(symbol);
            assert.equal(_tokenAddress, account_temp, "Should match with the changed address");
        });
    })

    describe("Transfer the ownership of the proxy contract", async() => {

        it("Should change the ownership of the contract -- because of bad owner", async()=> {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.transferProxyOwnership(account_polymath_new, {from: account_temp});
            } catch(error) {
                console.log(`       tx -> revert because of bad owner`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the ownership of the contract -- new address should not be 0x", async()=> {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistryProxy.transferProxyOwnership("0x00000000000000000000000000000000000000", {from: account_polymath});
            } catch(error) {
                console.log(`       tx -> revert because new owner address should not be 0x`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the ownership of the contract", async()=> {
            await I_SecurityTokenRegistryProxy.transferProxyOwnership(account_polymath_new, {from: account_polymath});
            let _currentOwner = await I_SecurityTokenRegistryProxy.proxyOwner.call({from: account_polymath_new});
            assert.equal(_currentOwner, account_polymath_new, "Should equal to the new owner");
        });

        it("Should change the implementation contract and version by the new owner", async() => {
            I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath});
            await I_SecurityTokenRegistryProxy.upgradeTo("1.2.0", I_SecurityTokenRegistry.address, {from: account_polymath_new});
            let c = OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal((web3.utils.toAscii(await readStorage(c.address, 11)).replace(/\u0000/g, '')).replace(/\n/, ''), "1.2.0", "Version mis-match");
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistry.address, "Implemnted address is not matched");
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
        });
    })


})
