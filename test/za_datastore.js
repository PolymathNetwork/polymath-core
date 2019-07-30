import latestTime from "./helpers/latestTime";
import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork } from "./helpers/createInstances";
const SecurityToken = artifacts.require("./SecurityToken.sol");
const DataStore = artifacts.require("./DataStore.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Data store", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let token_owner;

    // Contract Instance Declaration
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_DataStore;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;
    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const contact = "team@polymath.network";
    const key = "0x41";
    const key2 = "0x42";
    const bytes32data = "0x4200000000000000000000000000000000000000000000000000000000000000";
    const bytes32data2 = "0x4400000000000000000000000000000000000000000000000000000000000000";

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    const address_zero = "0x0000000000000000000000000000000000000000";
    const address_one = "0x0000000000000000000000000000000000000001";
    const address_two = "0x0000000000000000000000000000000000000002";

    before(async () => {
        account_polymath = accounts[0];
        token_owner = accounts[1];

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

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', { filter: { transactionHash: tx.transactionHash } }))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should fetch data store address", async () => {
            I_DataStore = await DataStore.at(await I_SecurityToken.dataStore());
        });
    });

    describe("Should attach to security token securely", async () => {
        it("Should be attached to a security token upon deployment", async () => {
            assert.equal(await I_DataStore.securityToken(), I_SecurityToken.address, "Incorrect Security Token attached");
        });

        it("Should not allow non-issuer to change security token address", async () => {
            await catchRevert(I_DataStore.setSecurityToken(address_one, { from: account_polymath }));
        });

        it("Should allow issuer to change security token address", async () => {
            let snapId = await takeSnapshot();
            await I_DataStore.setSecurityToken(address_one, { from: token_owner });
            assert.equal(await I_DataStore.securityToken(), address_one, "Incorrect Security Token attached");
            await revertToSnapshot(snapId);
            assert.equal(await I_DataStore.securityToken(), I_SecurityToken.address, "Incorrect Security Token attached");
        });
    });

    describe("Should set data correctly", async () => {
        it("Should set and fetch uint256 correctly", async () => {
            await catchRevert(I_DataStore.setUint256("0x0", 1, { from: token_owner }));
            await I_DataStore.setUint256(key, 1, { from: token_owner });
            assert.equal((await I_DataStore.getUint256(key)).toNumber(), 1, "Incorrect Data Inserted");
        });

        it("Should set and fetch bytes32 correctly", async () => {
            await I_DataStore.setBytes32(key, bytes32data, { from: token_owner });
            assert.equal(await I_DataStore.getBytes32(key), bytes32data, "Incorrect Data Inserted");
        });

        it("Should set and fetch address correctly", async () => {
            await I_DataStore.setAddress(key, address_one, { from: token_owner });
            assert.equal(await I_DataStore.getAddress(key), address_one, "Incorrect Data Inserted");
        });

        it("Should set and fetch string correctly", async () => {
            await I_DataStore.setString(key, name, { from: token_owner });
            assert.equal(await I_DataStore.getString(key), name, "Incorrect Data Inserted");
        });

        it("Should set and fetch bytes correctly", async () => {
            await I_DataStore.setBytes(key, bytes32data, { from: token_owner });
            assert.equal(await I_DataStore.getBytes(key), bytes32data, "Incorrect Data Inserted");
        });

        it("Should set and fetch bool correctly", async () => {
            await I_DataStore.setBool(key, true, { from: token_owner });
            assert.equal(await I_DataStore.getBool(key), true, "Incorrect Data Inserted");
        });

        it("Should set and fetch uint256 array correctly", async () => {
            let arr = [1, 2];
            await I_DataStore.setUint256Array(key, arr, { from: token_owner });
            let arr2 = await I_DataStore.getUint256Array(key);
            let arrLen = await I_DataStore.getUint256ArrayLength(key);
            let arrElement2 = await I_DataStore.getUint256ArrayElement(key, 1);
            assert.equal(arr2[0].toNumber(), arr[0], "Incorrect Data Inserted");
            assert.equal(arr2[1].toNumber(), arr[1], "Incorrect Data Inserted");
            assert.equal(arrLen, arr.length, "Incorrect Array Length");
            assert.equal(arrElement2.toNumber(), arr[1], "Incorrect array element");
        });

        it("Should set and fetch bytes32 array correctly", async () => {
            let arr = [bytes32data, bytes32data2];
            await I_DataStore.setBytes32Array(key, arr, { from: token_owner });
            let arr2 = await I_DataStore.getBytes32Array(key);
            let arrLen = await I_DataStore.getBytes32ArrayLength(key);
            let arrElement2 = await I_DataStore.getBytes32ArrayElement(key, 1);
            assert.equal(arr2[0], arr[0], "Incorrect Data Inserted");
            assert.equal(arr2[1], arr[1], "Incorrect Data Inserted");
            assert.equal(arrLen, arr.length, "Incorrect Array Length");
            assert.equal(arrElement2, arr[1], "Incorrect array element");
        });

        it("Should set and fetch address array correctly", async () => {
            let arr = [address_zero, address_one];
            await I_DataStore.setAddressArray(key, arr, { from: token_owner });
            let arr2 = await I_DataStore.getAddressArray(key);
            let arrLen = await I_DataStore.getAddressArrayLength(key);
            let arrElement2 = await I_DataStore.getAddressArrayElement(key, 1);
            assert.equal(arr2[0], arr[0], "Incorrect Data Inserted");
            assert.equal(arr2[1], arr[1], "Incorrect Data Inserted");
            assert.equal(arrLen, arr.length, "Incorrect Array Length");
            assert.equal(arrElement2, arr[1], "Incorrect array element");
        });

        it("Should set and fetch bool array correctly", async () => {
            let arr = [false, true];
            await I_DataStore.setBoolArray(key, arr, { from: token_owner });
            let arr2 = await I_DataStore.getBoolArray(key);
            let arrLen = await I_DataStore.getBoolArrayLength(key);
            let arrElement2 = await I_DataStore.getBoolArrayElement(key, 1);
            assert.equal(arr2[0], arr[0], "Incorrect Data Inserted");
            assert.equal(arr2[1], arr[1], "Incorrect Data Inserted");
            assert.equal(arrLen, arr.length, "Incorrect Array Length");
            assert.equal(arrElement2, arr[1], "Incorrect array element");
        });

        it("Should insert uint256 into Array", async () => {
            let arrLen = await I_DataStore.getUint256ArrayLength(key);
            await I_DataStore.insertUint256(key, new BN(10), { from: token_owner });
            let arrElement = await I_DataStore.getUint256ArrayElement(key, arrLen.toNumber());
            let arrElements = await I_DataStore.getUint256ArrayElements(key, 0, arrLen.toNumber());
            assert.equal(arrElement.toNumber(), arrElements[arrLen.toNumber()].toNumber());
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getUint256ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement.toNumber(), 10, "Incorrect array element");
        });

        it("Should insert bytes32 into Array", async () => {
            let arrLen = await I_DataStore.getBytes32ArrayLength(key);
            await I_DataStore.insertBytes32(key, bytes32data, { from: token_owner });
            let arrElement = await I_DataStore.getBytes32ArrayElement(key, arrLen.toNumber());
            let arrElements = await I_DataStore.getBytes32ArrayElements(key, 0, arrLen.toNumber());
            assert.equal(arrElement, arrElements[arrLen.toNumber()]);
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getBytes32ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, bytes32data, "Incorrect array element");
        });

        it("Should insert address into Array", async () => {
            let arrLen = await I_DataStore.getAddressArrayLength(key);
            await I_DataStore.insertAddress(key, address_one, { from: token_owner });
            let arrElement = await I_DataStore.getAddressArrayElement(key, arrLen.toNumber());
            let arrElements = await I_DataStore.getAddressArrayElements(key, 0, arrLen.toNumber());
            assert.equal(arrElement, arrElements[arrLen.toNumber()]);
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getAddressArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, address_one, "Incorrect array element");
        });

        it("Should insert bool into Array", async () => {
            let arrLen = await I_DataStore.getBoolArrayLength(key);
            await I_DataStore.insertBool(key, true, { from: token_owner });
            let arrElement = await I_DataStore.getBoolArrayElement(key, arrLen.toNumber());
            let arrElements = await I_DataStore.getBoolArrayElements(key, 0, arrLen.toNumber());
            assert.equal(arrElement, arrElements[arrLen.toNumber()]);
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getBoolArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, true, "Incorrect array element");
        });

        it("Should delete uint256 from Array", async () => {
            let arrLen = await I_DataStore.getUint256ArrayLength(key);
            let indexToDelete = arrLen.toNumber() - 2;
            let lastElement = await I_DataStore.getUint256ArrayElement(key, arrLen.toNumber() - 1);
            await I_DataStore.deleteUint256(key, indexToDelete, { from: token_owner });
            assert.equal(arrLen.toNumber() - 1, (await I_DataStore.getUint256ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(lastElement.toNumber(), (await I_DataStore.getUint256ArrayElement(key, indexToDelete)).toNumber(), "Incorrect array element");
        });

        it("Should delete bytes32 from Array", async () => {
            let arrLen = await I_DataStore.getBytes32ArrayLength(key);
            let indexToDelete = arrLen.toNumber() - 2;
            let lastElement = await I_DataStore.getBytes32ArrayElement(key, arrLen.toNumber() - 1);
            await I_DataStore.deleteBytes32(key, indexToDelete, { from: token_owner });
            assert.equal(arrLen.toNumber() - 1, (await I_DataStore.getBytes32ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(lastElement, await I_DataStore.getBytes32ArrayElement(key, indexToDelete), "Incorrect array element");
        });

        it("Should delete address from Array", async () => {
            let arrLen = await I_DataStore.getAddressArrayLength(key);
            let indexToDelete = arrLen.toNumber() - 2;
            let lastElement = await I_DataStore.getAddressArrayElement(key, arrLen.toNumber() - 1);
            await I_DataStore.deleteAddress(key, indexToDelete, { from: token_owner });
            assert.equal(arrLen.toNumber() - 1, (await I_DataStore.getAddressArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(lastElement, await I_DataStore.getAddressArrayElement(key, indexToDelete), "Incorrect array element");
        });

        it("Should delete bool from Array", async () => {
            let arrLen = await I_DataStore.getBoolArrayLength(key);
            let indexToDelete = arrLen.toNumber() - 2;
            let lastElement = await I_DataStore.getBoolArrayElement(key, arrLen.toNumber() - 1);
            await I_DataStore.deleteBool(key, indexToDelete, { from: token_owner });
            assert.equal(arrLen.toNumber() - 1, (await I_DataStore.getBoolArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(lastElement, await I_DataStore.getBoolArrayElement(key, indexToDelete), "Incorrect array element");
        });

        it("Should set and fetch multiple uint256 correctly", async () => {
            await catchRevert(I_DataStore.setUint256Multi([key], [1,2], { from: token_owner }));
            await I_DataStore.setUint256Multi([key, key2], [1,2], { from: token_owner });
            assert.equal((await I_DataStore.getUint256(key)).toNumber(), 1, "Incorrect Data Inserted");
            assert.equal((await I_DataStore.getUint256(key2)).toNumber(), 2, "Incorrect Data Inserted");
        });

        it("Should set and fetch multiple bytes32 correctly", async () => {
            await I_DataStore.setBytes32Multi([key, key2], [bytes32data, bytes32data2], { from: token_owner });
            assert.equal(await I_DataStore.getBytes32(key), bytes32data, "Incorrect Data Inserted");
            assert.equal(await I_DataStore.getBytes32(key2), bytes32data2, "Incorrect Data Inserted");
        });

        it("Should set and fetch multiple address correctly", async () => {
            await I_DataStore.setAddressMulti([key, key2], [address_one, address_two], { from: token_owner });
            assert.equal(await I_DataStore.getAddress(key), address_one, "Incorrect Data Inserted");
            assert.equal(await I_DataStore.getAddress(key2), address_two, "Incorrect Data Inserted");
        });

        it("Should set and fetch multiple bool correctly", async () => {
            await I_DataStore.setBoolMulti([key, key2], [true, true], { from: token_owner });
            assert.equal(await I_DataStore.getBool(key), true, "Incorrect Data Inserted");
            assert.equal(await I_DataStore.getBool(key2), true, "Incorrect Data Inserted");
        });

        it("Should insert multiple uint256 into multiple Array", async () => {
            let arrLen = await I_DataStore.getUint256ArrayLength(key);
            let arrLen2 = await I_DataStore.getUint256ArrayLength(key2);
            await I_DataStore.insertUint256Multi([key, key2], [10, 20], { from: token_owner });
            let arrElement = await I_DataStore.getUint256ArrayElement(key, arrLen.toNumber());
            let arrElement2 = await I_DataStore.getUint256ArrayElement(key2, arrLen2.toNumber());
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getUint256ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement.toNumber(), 10, "Incorrect array element");
            assert.equal(arrLen2.toNumber() + 1, (await I_DataStore.getUint256ArrayLength(key2)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement2.toNumber(), 20, "Incorrect array element");
        });

        it("Should insert multiple bytes32 into multiple Array", async () => {
            let arrLen = await I_DataStore.getBytes32ArrayLength(key);
            let arrLen2 = await I_DataStore.getBytes32ArrayLength(key2);
            await I_DataStore.insertBytes32Multi([key, key2], [bytes32data, bytes32data2], { from: token_owner });
            let arrElement = await I_DataStore.getBytes32ArrayElement(key, arrLen.toNumber());
            let arrElement2 = await I_DataStore.getBytes32ArrayElement(key2, arrLen2.toNumber());
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getBytes32ArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrLen2.toNumber() + 1, (await I_DataStore.getBytes32ArrayLength(key2)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, bytes32data, "Incorrect array element");
            assert.equal(arrElement2, bytes32data2, "Incorrect array element");
        });

        it("Should insert multiple address into multiple Array", async () => {
            let arrLen = await I_DataStore.getAddressArrayLength(key);
            let arrLen2 = await I_DataStore.getAddressArrayLength(key2);
            await I_DataStore.insertAddressMulti([key, key2], [address_one, address_two], { from: token_owner });
            let arrElement = await I_DataStore.getAddressArrayElement(key, arrLen.toNumber());
            let arrElement2 = await I_DataStore.getAddressArrayElement(key2, arrLen2.toNumber());
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getAddressArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrLen2.toNumber() + 1, (await I_DataStore.getAddressArrayLength(key2)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, address_one, "Incorrect array element");
            assert.equal(arrElement2, address_two, "Incorrect array element");
        });

        it("Should insert multiple bool into multiple Array", async () => {
            let arrLen = await I_DataStore.getBoolArrayLength(key);
            let arrLen2 = await I_DataStore.getBoolArrayLength(key2);
            await I_DataStore.insertBoolMulti([key, key2], [true, true], { from: token_owner });
            let arrElement = await I_DataStore.getBoolArrayElement(key, arrLen.toNumber());
            let arrElement2 = await I_DataStore.getBoolArrayElement(key2, arrLen2.toNumber());
            assert.equal(arrLen.toNumber() + 1, (await I_DataStore.getBoolArrayLength(key)).toNumber(), "Incorrect Array Length");
            assert.equal(arrLen2.toNumber() + 1, (await I_DataStore.getBoolArrayLength(key2)).toNumber(), "Incorrect Array Length");
            assert.equal(arrElement, true, "Incorrect array element");
            assert.equal(arrElement2, true, "Incorrect array element");
        });
    });

    describe("Should not allow unautohrized modification to data", async () => {
        it("Should not allow unauthorized addresses to modify uint256", async () => {
            await catchRevert(I_DataStore.setUint256(key, new BN(1), { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify bytes32", async () => {
            await catchRevert(I_DataStore.setBytes32(key, bytes32data, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify address", async () => {
            await catchRevert(I_DataStore.setAddress(key, address_one, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify string", async () => {
            await catchRevert(I_DataStore.setString(key, name, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify bytes", async () => {
            await catchRevert(I_DataStore.setBytes32(key, bytes32data, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify bool", async () => {
            await catchRevert(I_DataStore.setBool(key, true, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify uint256 array", async () => {
            let arr = [1, 2];
            await catchRevert(I_DataStore.setUint256Array(key, arr, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify bytes32 array", async () => {
            let arr = [bytes32data, bytes32data2];
            await catchRevert(I_DataStore.setBytes32Array(key, arr, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify address array", async () => {
            let arr = [address_zero, address_one];
            await catchRevert(I_DataStore.setAddressArray(key, arr, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify bool array", async () => {
            let arr = [false, true];
            await catchRevert(I_DataStore.setBoolArray(key, arr, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert uint256 into Array", async () => {
            await catchRevert(I_DataStore.insertUint256(key, new BN(10), { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert bytes32 into Array", async () => {
            await catchRevert(I_DataStore.insertBytes32(key, bytes32data, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert address into Array", async () => {
            await catchRevert(I_DataStore.insertAddress(key, address_one, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert bool into Array", async () => {
            await catchRevert(I_DataStore.insertBool(key, true, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to delete uint256 from Array", async () => {
            await catchRevert(I_DataStore.deleteUint256(key, 0, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to delete bytes32 from Array", async () => {
            await catchRevert(I_DataStore.deleteBytes32(key, 0, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to delete address from Array", async () => {
            await catchRevert(I_DataStore.deleteAddress(key, 0, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to delete bool from Array", async () => {
            await catchRevert(I_DataStore.deleteBool(key, 0, { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify multiple uint256", async () => {
            await catchRevert(I_DataStore.setUint256Multi([key, key2], [1,2], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify multiple bytes32", async () => {
            await catchRevert(I_DataStore.setBytes32Multi([key, key2], [bytes32data, bytes32data2], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify multiple address", async () => {
            await catchRevert(I_DataStore.setAddressMulti([key, key2], [address_one, address_two], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to modify multiple bool", async () => {
            await catchRevert(I_DataStore.setBoolMulti([key, key2], [true, true], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert multiple uint256 into multiple Array", async () => {
            await catchRevert(I_DataStore.insertUint256Multi([key, key2], [10, 20], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert multiple bytes32 into multiple Array", async () => {
            await catchRevert(I_DataStore.insertBytes32Multi([key, key2], [bytes32data, bytes32data2], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert multiple address into multiple Array", async () => {
            await catchRevert(I_DataStore.insertAddressMulti([key, key2], [address_one, address_two], { from: account_polymath }));
        });

        it("Should not allow unauthorized addresses to insert multiple bool into multiple Array", async () => {
            await catchRevert(I_DataStore.insertBoolMulti([key, key2], [true, true], { from: account_polymath }));
        });
    });
});
