import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork } from "./helpers/createInstances";

const MockModuleRegistry = artifacts.require("./MockModuleRegistry.sol");
const OwnedUpgradeabilityProxy = artifacts.require("./OwnedUpgradeabilityProxy.sol");
const ModuleRegistryProxy = artifacts.require("./ModuleRegistryProxy.sol");
const ModuleRegistry = artifacts.require("./ModuleRegistry.sol");
const STFactory = artifacts.require("./STFactory.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManagerLogic = artifacts.require("./GeneralTransferManager.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const GeneralPermissionManagerFactory = artifacts.require("./GeneralPermissionManagerFactory.sol");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager.sol");
const STGetter = artifacts.require("./STGetter.sol");
const DataStoreLogic = artifacts.require('./DataStore.sol');
const DataStoreFactory = artifacts.require('./DataStoreFactory.sol');

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ModuleRegistryProxy", async (accounts) => {
    let I_SecurityTokenRegistry;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManagerfactory;
    let I_GeneralPermissionManagerLogic;
    let I_MockModuleRegistry;
    let I_STFactory;
    let I_PolymathRegistry;
    let I_ModuleRegistryProxy;
    let I_PolyToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_SecurityToken;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    let account_polymath;
    let account_temp;
    let token_owner;
    let account_polymath_new;

    // Initial fee for ticker registry and security token registry
    const version = "1.0.0";
    const message = "Transaction Should Fail!";
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";
    // SecurityToken Details for funds raise Type ETH
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    const transferManagerKey = 2;
    const MRProxyParameters = ["address", "address"];

    async function readStorage(contractAddress, slot) {
        return await web3.eth.getStorageAt(contractAddress, slot);
    }

    before(async () => {
        account_polymath = accounts[0];
        account_temp = accounts[1];
        token_owner = accounts[2];
        account_polymath_new = accounts[3];

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
           I_STRGetter,
           I_STGetter
       ] = instances;

        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from: account_polymath});
        I_ModuleRegistry = await ModuleRegistry.new({from: account_polymath });

        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, { from: account_polymath });

        // Printing all the contract addresses
        console.log(`
         --------------------- Polymath Network Smart Contracts: ---------------------
         PolymathRegistry:                  ${I_PolymathRegistry.address}
         SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
         SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
         ModuleRegistry:                    ${I_ModuleRegistry.address}
         ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
         STFactory:                         ${I_STFactory.address}
         GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
         -----------------------------------------------------------------------------
         `);
    });

    describe("Attach the implementation address", async () => {
        // Storage
        // __version -- index 11
        // __implementation -- index 12
        // __upgradeabilityOwner -- index 13

        it("Should attach the MR implementation and version", async () => {
            let bytesProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
            await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesProxy, { from: account_polymath });
            let c = await OwnedUpgradeabilityProxy.at(I_ModuleRegistryProxy.address);
            assert.equal(await readStorage(c.address, 12), I_ModuleRegistry.address.toLowerCase());
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.0.0"
            );
            I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);
        });

        it("Deploy the essential smart contracts", async () => {
            await I_MRProxied.updateFromRegistry({ from: account_polymath });
            // STEP 4: Deploy the GeneralTransferManagerFactory

            let I_GeneralTransferManagerLogic = await GeneralTransferManagerLogic.new(
                address_zero,
                address_zero,
                { from: account_polymath }
            );

            let I_SecurityTokenLogic = await SecurityToken.new(
                { from: account_polymath }
            );

            I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(new BN(0), I_GeneralTransferManagerLogic.address, I_PolymathRegistry.address, true, {
                from: account_polymath
            });

            assert.notEqual(
                I_GeneralTransferManagerFactory.address.valueOf(),
                address_zero,
                "GeneralTransferManagerFactory contract was not deployed"
            );

            // Register the Modules with the ModuleRegistry contract

            // (A) :  Register the GeneralTransferManagerFactory
            await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
            await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });

            // Step 3: Deploy the STFactory contract
            I_STGetter = await STGetter.new({from: account_polymath});
            let I_DataStoreLogic = await DataStoreLogic.new({ from: account_polymath });
            let I_DataStoreFactory = await DataStoreFactory.new(I_DataStoreLogic.address, { from: account_polymath });
            const tokenInitBytes = {
                name: "initialize",
                type: "function",
                inputs: [
                    {
                        type: "address",
                        name: "_getterDelegate"
                    }
                ]
            };
            let tokenInitBytesCall = web3.eth.abi.encodeFunctionCall(tokenInitBytes, [I_STGetter.address]);
            I_STFactory = await STFactory.new(I_PolymathRegistry.address, I_GeneralTransferManagerFactory.address, I_DataStoreFactory.address, "3.0.0", I_SecurityTokenLogic.address, tokenInitBytesCall, { from: account_polymath });

            assert.notEqual(I_STFactory.address.valueOf(), address_zero, "STFactory contract was not deployed");
        });

        it("Verify the initialize data", async () => {
            assert.equal(
                await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("owner")),
                account_polymath,
                "Should equal to right address"
            );
            assert.equal(await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("polymathRegistry")), I_PolymathRegistry.address);
        });
    });

    describe("Feed some data in storage", async () => {
        it("Register and verify the new module", async () => {
            I_GeneralPermissionManagerLogic = await GeneralPermissionManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });
            I_GeneralPermissionManagerfactory = await GeneralPermissionManagerFactory.new(new BN(0), I_GeneralPermissionManagerLogic.address, I_PolymathRegistry.address, true, {
                from: account_polymath
            });

            assert.notEqual(
                I_GeneralPermissionManagerfactory.address.valueOf(),
                address_zero,
                "GeneralPermissionManagerFactory contract was not deployed"
            );

            await I_MRProxied.registerModule(I_GeneralPermissionManagerfactory.address, { from: account_polymath });
            await I_MRProxied.verifyModule(I_GeneralPermissionManagerfactory.address, { from: account_polymath });
        });
    });

    describe("Upgrade the imlplementation address", async () => {
        it("Should upgrade the version and implementation address -- fail bad owner", async () => {
            I_MockModuleRegistry = await MockModuleRegistry.new({ from: account_polymath });
            await catchRevert(I_ModuleRegistryProxy.upgradeTo("1.1.0", I_MockModuleRegistry.address, { from: account_temp }));
        });

        it("Should upgrade the version and implementation address -- Implementaion address should be a contract address", async () => {
            await catchRevert(I_ModuleRegistryProxy.upgradeTo("1.1.0", account_temp, { from: account_polymath }));
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be 0x", async () => {
            await catchRevert(
                I_ModuleRegistryProxy.upgradeTo("1.1.0", address_zero, { from: account_polymath })
            );
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be the same address", async () => {
            await catchRevert(I_ModuleRegistryProxy.upgradeTo("1.1.0", I_ModuleRegistry.address, { from: account_polymath }));
        });

        it("Should upgrade the version and implementation address -- same version as previous is not allowed", async () => {
            await catchRevert(I_ModuleRegistryProxy.upgradeTo("1.0.0", I_MockModuleRegistry.address, { from: account_polymath }));
        });

        it("Should upgrade the version and implementation address -- empty version string is not allowed", async () => {
            await catchRevert(I_ModuleRegistryProxy.upgradeTo("", I_MockModuleRegistry.address, { from: account_polymath }));
        });

        it("Should upgrade the version and the implementation address successfully", async () => {
            await I_ModuleRegistryProxy.upgradeTo("1.1.0", I_MockModuleRegistry.address, { from: account_polymath });
            let c = await OwnedUpgradeabilityProxy.at(I_ModuleRegistryProxy.address);
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.1.0",
                "Version mis-match"
            );
            assert.equal(await readStorage(c.address, 12), I_MockModuleRegistry.address.toLowerCase(), "Implemnted address is not matched");
            I_MRProxied = await MockModuleRegistry.at(I_ModuleRegistryProxy.address);
        });
    });

    describe("Execute functionality of the implementation contract on the earlier storage", async () => {
        it("Should get the previous data", async () => {
            let _data = await I_MRProxied.getFactoryDetails.call(I_GeneralTransferManagerFactory.address);
            assert.equal(_data[2].length, new BN(0), "Should give the original length");
        });

        it("Should alter the old storage", async () => {
            await I_MRProxied.addMoreReputation(I_GeneralTransferManagerFactory.address, [account_polymath, account_temp], {
                from: account_polymath
            });
            let _data = await I_MRProxied.getFactoryDetails.call(I_GeneralTransferManagerFactory.address);
            assert.equal(_data[2].length, 2, "Should give the updated length");
        });
    });

    describe("Transfer the ownership of the proxy contract", async () => {
        it("Should change the ownership of the contract -- because of bad owner", async () => {
            await catchRevert(I_ModuleRegistryProxy.transferProxyOwnership(account_polymath_new, { from: account_temp }));
        });

        it("Should change the ownership of the contract -- new address should not be 0x", async () => {
            await catchRevert(
                I_ModuleRegistryProxy.transferProxyOwnership(address_zero, { from: account_polymath })
            );
        });

        it("Should change the ownership of the contract", async () => {
            await I_ModuleRegistryProxy.transferProxyOwnership(account_polymath_new, { from: account_polymath });
            let _currentOwner = await I_ModuleRegistryProxy.proxyOwner.call({ from: account_polymath_new });
            assert.equal(_currentOwner, account_polymath_new, "Should equal to the new owner");
        });

        it("Should change the implementation contract and version by the new owner", async () => {
            I_ModuleRegistry = await ModuleRegistry.new({ from: account_polymath });
            await I_ModuleRegistryProxy.upgradeTo("1.2.0", I_ModuleRegistry.address, { from: account_polymath_new });
            let c = await OwnedUpgradeabilityProxy.at(I_ModuleRegistryProxy.address);
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.2.0",
                "Version mis-match"
            );
            assert.equal(await readStorage(c.address, 12), I_ModuleRegistry.address.toLowerCase(), "Implemnted address is not matched");
            I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);
        });
    });
});
