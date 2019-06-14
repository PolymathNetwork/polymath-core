import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { encodeProxyCall, encodeCall } from "./helpers/encodeCall";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork } from "./helpers/createInstances";

const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const SecurityTokenRegistryMock = artifacts.require("./SecurityTokenRegistryMock.sol");
const MockSTRGetter = artifacts.require("./MockSTRGetter.sol");
const OwnedUpgradeabilityProxy = artifacts.require("./OwnedUpgradeabilityProxy.sol");
const STFactory = artifacts.require("./STFactory.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const STRGetter = artifacts.require("./STRGetter.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("SecurityTokenRegistryProxy", async (accounts) => {
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
    let I_STRGetter;
    let I_Getter;
    let I_STGetter;
    let stGetter;

    let account_polymath;
    let account_temp;
    let token_owner;
    let account_polymath_new;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("250"));
    const initRegFeePOLY = new BN(web3.utils.toWei("1000"));
    const version = "1.0.0";
    const message = "Transaction Should Fail!";

    // SecurityToken Details for funds raise Type ETH
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    const transferManagerKey = 2;

    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";
    const STRProxyParameters = ["address", "uint256", "uint256", "address", "address"];

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

        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({ from: account_polymath });

        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, { from: account_polymath });
        await I_MRProxied.updateFromRegistry({ from: account_polymath });

        // Printing all the contract addresses
        console.log(`
         --------------------- Polymath Network Smart Contracts: ---------------------
         PolymathRegistry:                  ${I_PolymathRegistry.address}
         SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
         SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}

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

        it("Should attach the implementation and version", async () => {
            I_STRGetter = await STRGetter.new({from: account_polymath});
            let bytesProxy = encodeProxyCall(STRProxyParameters, [
                I_PolymathRegistry.address,
                initRegFee,
                initRegFee,
                account_polymath,
                I_STRGetter.address
            ]);
            await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {
                from: account_polymath
            });
            let c = await OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistry.address.toLowerCase());
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.0.0"
            );
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
            I_STRGetter = await STRGetter.at(I_SecurityTokenRegistryProxy.address);
            await I_STRProxied.setProtocolFactory(I_STFactory.address, 3, 0, 0);
            await I_STRProxied.setLatestVersion(3, 0, 0);
        });

        it("Verify the initialize data", async () => {
            assert.equal(
                (await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("expiryLimit"))).toNumber(),
                60 * 24 * 60 * 60,
                "Should equal to 60 days"
            );
            assert.equal(
                await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("tickerRegFee")),
                web3.utils.toWei("250")
            );
        });

        it("Upgrade the proxy again and change getter", async () => {
          let snapId = await takeSnapshot();
          const I_MockSTRGetter = await MockSTRGetter.new({from: account_polymath});
          const I_MockSecurityTokenRegistry = await SecurityTokenRegistry.new({ from: account_polymath });
          const bytesProxy = encodeCall("setGetterRegistry", ["address"], [I_MockSTRGetter.address]);
          console.log("Getter: " + I_MockSTRGetter.address);
          console.log("Registry: " + I_MockSecurityTokenRegistry.address);
          console.log("STRProxy: " + I_SecurityTokenRegistryProxy.address);

          await I_SecurityTokenRegistryProxy.upgradeToAndCall("2.0.0", I_MockSecurityTokenRegistry.address, bytesProxy, {
              from: account_polymath
          });

          let c = await OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
          assert.equal(await readStorage(c.address, 12), I_MockSecurityTokenRegistry.address.toLowerCase());
          assert.equal(
              web3.utils
                  .toAscii(await readStorage(c.address, 11))
                  .replace(/\u0000/g, "")
                  .replace(/\n/, ""),
              "2.0.0"
          );

          const I_MockSecurityTokenRegistryProxy = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
          const I_MockSTRGetterProxy = await MockSTRGetter.at(I_SecurityTokenRegistryProxy.address);
          await I_MockSecurityTokenRegistryProxy.setProtocolFactory(I_STFactory.address, 3, 1, 0);
          await I_MockSecurityTokenRegistryProxy.setLatestVersion(3, 1, 0);
          let newValue = await I_MockSTRGetterProxy.newFunction.call();
          assert.equal(newValue.toNumber(), 99);
          //assert.isTrue(false);
          await revertToSnapshot(snapId);
        });


    });

    describe("Feed some data in storage", async () => {
        it("Register the ticker", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("8000")), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, "Owner should be the same as registered with the ticker");
            assert.equal(tx.logs[0].args._ticker, symbol, "Same as the symbol registered in the registerTicker function call");
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });
    });

    describe("Upgrade the imlplementation address", async () => {
        it("Should upgrade the version and implementation address -- fail bad owner", async () => {
            I_SecurityTokenRegistryMock = await SecurityTokenRegistryMock.new({ from: account_polymath });
            await catchRevert(I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryMock.address, { from: account_temp }));
        });

        it("Should upgrade the version and implementation address -- Implementaion address should be a contract address", async () => {
            await catchRevert(I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", account_temp, { from: account_polymath }));
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be 0x", async () => {
            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", address_zero, { from: account_polymath })
            );
        });

        it("Should upgrade the version and implementation address -- Implemenation address should not be the same address", async () => {
            await catchRevert(I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistry.address, { from: account_polymath }));
        });

        it("Should upgrade the version and implementation address -- same version as previous is not allowed", async () => {
            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeTo("1.0.0", I_SecurityTokenRegistryMock.address, { from: account_polymath })
            );
        });

        it("Should upgrade the version and implementation address -- empty version string is not allowed", async () => {
            await catchRevert(I_SecurityTokenRegistryProxy.upgradeTo("", I_SecurityTokenRegistryMock.address, { from: account_polymath }));
        });

        it("Should upgrade the version and the implementation address successfully", async () => {
            await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryMock.address, { from: account_polymath });
            let c = await OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.1.0",
                "Version mis-match"
            );
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistryMock.address.toLowerCase(), "Implemnted address is not matched");
            I_STRProxied = await SecurityTokenRegistryMock.at(I_SecurityTokenRegistryProxy.address);
            I_Getter = await STRGetter.at(I_SecurityTokenRegistryProxy.address);
        });
    });

    describe("Execute functionality of the implementation contract on the earlier storage", async () => {
        it("Should get the previous data", async () => {

            let _tokenAddress = await I_Getter.getSecurityTokenAddress.call(symbol);
            let _data = await I_Getter.getSecurityTokenData.call(_tokenAddress);
            assert.equal(_data[0], symbol, "Symbol should match with registered symbol");
            assert.equal(_data[1], token_owner, "Owner should be the deployer of token");
            assert.equal(_data[2], tokenDetails, "Token details should matched with deployed ticker");
        });

        it("Should alter the old storage", async () => {
            await I_STRProxied.changeTheFee(0, { from: account_polymath });
            let feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            console.log(feesToken);
            // assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            // assert.equal(feesToken[1].toString(), origPricePOLY.toString());
        });
    });

    describe("Transfer the ownership of the proxy contract", async () => {
        it("Should change the ownership of the contract -- because of bad owner", async () => {
            await catchRevert(I_SecurityTokenRegistryProxy.transferProxyOwnership(account_polymath_new, { from: account_temp }));
        });

        it("Should change the ownership of the contract -- new address should not be 0x", async () => {
            await catchRevert(
                I_SecurityTokenRegistryProxy.transferProxyOwnership(address_zero, { from: account_polymath })
            );
        });

        it("Should change the ownership of the contract", async () => {
            await I_SecurityTokenRegistryProxy.transferProxyOwnership(account_polymath_new, { from: account_polymath });
            let _currentOwner = await I_SecurityTokenRegistryProxy.proxyOwner.call({ from: account_polymath_new });
            assert.equal(_currentOwner, account_polymath_new, "Should equal to the new owner");
        });

        it("Should change the implementation contract and version by the new owner", async () => {
            I_SecurityTokenRegistry = await SecurityTokenRegistry.new({ from: account_polymath });
            await I_SecurityTokenRegistryProxy.upgradeTo("1.2.0", I_SecurityTokenRegistry.address, { from: account_polymath_new });
            let c = await OwnedUpgradeabilityProxy.at(I_SecurityTokenRegistryProxy.address);
            assert.equal(
                web3.utils
                    .toAscii(await readStorage(c.address, 11))
                    .replace(/\u0000/g, "")
                    .replace(/\n/, ""),
                "1.2.0",
                "Version mis-match"
            );
            assert.equal(await readStorage(c.address, 12), I_SecurityTokenRegistry.address.toLowerCase(), "Implemnted address is not matched");
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
        });

        it("Should get the version", async () => {
            assert.equal(await I_SecurityTokenRegistryProxy.version.call({ from: account_polymath_new }), "1.2.0");
        });

        it("Should get the implementation address", async () => {
            assert.equal(
                await I_SecurityTokenRegistryProxy.implementation.call({ from: account_polymath_new }),
                I_SecurityTokenRegistry.address
            );
        });
    });
});
