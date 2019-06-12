import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployDummySTOAndVerifyed } from "./helpers/createInstances";

const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const SecurityTokenRegistryMock = artifacts.require("./SecurityTokenRegistryMock.sol");
const STFactory = artifacts.require("./STFactory.sol");
const STFactoryV2 = artifacts.require("./STFactory.sol"); // change here
const STRGetter = artifacts.require('./STRGetter.sol');
const STGetter = artifacts.require("./STGetter.sol");
const DataStoreLogic = artifacts.require('./DataStore.sol');
const DataStoreFactory = artifacts.require('./DataStoreFactory.sol');
const TokenLib = artifacts.require('./TokenLib.sol');
const SecurityTokenMock = artifacts.require('./SecurityTokenMock.sol');

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("SecurityTokenRegistry", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;
    let dummy_token;

    let balanceOfReceiver;

    let ID_snap;
    const message = "Transaction Should Fail!!";

    // Contract Instance Declaration
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_SecurityTokenRegistryV2;
    let I_DummySTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_DummySTO;
    let I_PolyToken;
    let I_STFactory;
    let I_STFactory002;
    let I_SecurityToken002;
    let I_STFactory003;
    let I_PolymathRegistry;
    let I_SecurityTokenRegistryProxy;
    let I_STRProxied;
    let I_MRProxied;
    let I_STRGetter;
    let I_Getter;
    let I_STGetter;
    let stGetter;
    let I_USDOracle;
    let I_POLYOracle;
    let I_StablePOLYOracle;
    let I_TokenLib;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    let treasury_wallet;
    //Security Token Detials (Version 2)
    const name2 = "Demo2 Token";
    const symbol2 = "DET2";
    const tokenDetails2 = "This is equity type of issuance";
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("250"));
    const initRegFeePOLY = new BN(web3.utils.toWei("1000"));

    const STRProxyParameters = ["address", "uint256", "uint256", "address", "address"];
    const STOParameters = ["uint256", "uint256", "uint256", "string"];

    // Capped STO details
    const cap = new BN(web3.utils.toWei("10000"));
    const someString = "Hello string";

    let currentTime;

    function _pack(_major, _minor, _patch) {
        let packedVersion =(parseInt(_major) << 16) | (parseInt(_minor) << 8) | parseInt(_patch);
        return packedVersion;
    }

    before(async () => {
        currentTime = new BN(await latestTime());
        treasury_wallet = accounts[2];
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
        token_owner = account_issuer;
        dummy_token = accounts[3];

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
            I_STGetter,
            I_USDOracle,
            I_POLYOracle,
            I_StablePOLYOracle
        ] = instances;

        // STEP 8: Deploy the CappedSTOFactory

        [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, 0);
        // Step 9: Deploy the SecurityTokenRegistry
        console.log(I_SecurityTokenRegistry.address);
        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({ from: account_polymath });
        console.log(I_SecurityTokenRegistry.address);

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            address_zero,
            "SecurityTokenRegistry contract was not deployed"
        );

        // Step 9 (a): Deploy the proxy
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({ from: account_polymath });
        // Step 10 : Deploy the getter contract
        I_STRGetter = await STRGetter.new({ from: account_polymath });
        //Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, { from: account_polymath });
        await I_MRProxied.updateFromRegistry({ from: account_polymath });

        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}

        DummySTOFactory:                  ${I_DummySTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Test the initialize the function", async () => {
        it("Should successfully update the implementation address -- fail because polymathRegistry address is 0x", async () => {
            let bytesProxy = encodeProxyCall(STRProxyParameters, [
                address_zero,
                initRegFee,
                initRegFee,
                account_polymath,
                I_STRGetter.address
            ]);
            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because polymathRegistry address is 0x"
            );
        });

        it("Should successfully update the implementation address -- fail because owner address is 0x", async () => {
            let bytesProxy = encodeProxyCall(STRProxyParameters, [
                I_PolymathRegistry.address,
                initRegFee,
                initRegFee,
                address_zero,
                I_STRGetter.address
            ]);
            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because owner address is 0x"
            );
        });

        it("Should successfully update the implementation address -- fail because all params get 0", async () => {
            let bytesProxy = encodeProxyCall(STRProxyParameters, [address_zero, new BN(0), new BN(0), address_zero, address_zero]);
            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because owner address is 0x"
            );
        });

        it("Should successfully update the implementation address", async () => {
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
            I_Getter = await STRGetter.at(I_SecurityTokenRegistryProxy.address);
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
            await I_STRProxied.setProtocolFactory(I_STFactory.address, 3, 0, 0);
            await I_STRProxied.setLatestVersion(3, 0, 0);

            let latestSTF = await I_Getter.getSTFactoryAddress();
            console.log(latestSTF);
            assert.equal(await I_Getter.getSTFactoryAddressOfVersion(196608), latestSTF); //196608 is 3.0.0 in packed format
            let info = await I_Getter.getLatestProtocolVersion();
            for (let i = 0; i < info.length; i++) {
                console.log(info[i].toNumber());
            }
            console.log(await I_Getter.getLatestProtocolVersion());

        });
    });

    describe(" Test cases of the registerTicker", async () => {
        it("verify the intial parameters", async () => {
            let intialised = await I_STRProxied.getBoolValue.call(web3.utils.soliditySha3("initialised"));
            assert.isTrue(intialised, "Should be true");

            let expiry = await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("expiryLimit"));
            assert.equal(expiry.toNumber(), 5184000, "Expiry limit should be equal to 60 days");

            let polytoken = await I_STRProxied.getAddressValue.call(web3.utils.soliditySha3("polyToken"));
            assert.equal(polytoken, I_PolyToken.address, "Should be the polytoken address");

            let stlaunchFee = await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("stLaunchFee"));
            assert.equal(stlaunchFee.toString(), initRegFee.toString(), "Should be provided reg fee");

            let tickerRegFee = await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("tickerRegFee"));
            assert.equal(tickerRegFee.toString(), tickerRegFee.toString(), "Should be provided reg fee");

            let polymathRegistry = await I_STRProxied.getAddressValue.call(web3.utils.soliditySha3("polymathRegistry"));
            assert.equal(polymathRegistry, I_PolymathRegistry.address, "Should be the address of the polymath registry");

            let getterContract = await I_STRProxied.getAddressValue.call(web3.utils.soliditySha3("STRGetter"));
            assert.equal(getterContract, I_STRGetter.address, "Should be the address of the getter contract");

            let owner = await I_STRProxied.getAddressValue.call(web3.utils.soliditySha3("owner"));
            assert.equal(owner, account_polymath, "Should be the address of the registry owner");
        });

        it("Can't call the initialize function again", async () => {
            await catchRevert(
                I_STRProxied.initialize(
                    I_PolymathRegistry.address,
                    initRegFee,
                    initRegFee,
                    account_polymath,
                    I_STRGetter.address
                ),
                "tx revert -> Can't call the initialize function again"
            );
        });

        it("Should fail to register ticker if tickerRegFee not approved", async () => {
            await catchRevert(
                I_STRProxied.registerNewTicker(account_temp, symbol, { from: account_temp }),
                "tx revert -> POLY allowance not provided for registration fee"
            );
        });

        it("Should fail to register ticker if owner is 0x", async () => {
            await I_PolyToken.getTokens(initRegFeePOLY, account_temp);
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: account_temp });

            await catchRevert(
                I_STRProxied.registerNewTicker(address_zero, symbol, { from: account_temp }),
                "tx revert -> owner should not be 0x"
            );
        });

        it("Should fail to register ticker due to the symbol length is 0", async () => {
            await catchRevert(I_STRProxied.registerNewTicker(account_temp, "", { from: account_temp }), "tx revert -> Symbol Length is 0");
        });

        it("Should fail to register ticker due to the symbol length is greater than 10", async () => {
            await catchRevert(
                I_STRProxied.registerNewTicker(account_temp, "POLYMATHNET", { from: account_temp }),
                "tx revert -> Symbol Length is greater than 10"
            );
        });

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_STRProxied.registerNewTicker(account_temp, symbol, { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, symbol, `Symbol should be ${symbol}`);
            let data = await I_Getter.getTickerDetails.call(symbol);
            assert.equal(data[0], account_temp);
            // trying to access the function data directly from the STRGetter then it should give all values zero
            data = await I_STRGetter.getTickerDetails.call(symbol);
            assert.equal(data[0], address_zero);
            assert.equal(data[3], "");
        });

        it("Should change ticker price based on oracle", async () => {
            let snap_Id = await takeSnapshot();
            let origPriceUSD = new BN(web3.utils.toWei("250"));
            let origPricePOLY = new BN(web3.utils.toWei("1000"));
            let currentRate = await I_POLYOracle.getPrice.call();
            console.log("Current Rate: " + currentRate);
            let feesTicker = await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            let feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            assert.equal(feesTicker[0].toString(), origPriceUSD.toString());
            assert.equal(feesTicker[1].toString(), origPricePOLY.toString());
            assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            assert.equal(feesToken[1].toString(), origPricePOLY.toString());
            await I_POLYOracle.changePrice(new BN(27).mul(new BN(10).pow(new BN(16))));
            await I_STRProxied.getFees("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesTicker = await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            // No change as difference is less than 10%
            assert.equal(feesTicker[0].toString(), origPriceUSD.toString());
            assert.equal(feesTicker[1].toString(), origPricePOLY.toString());
            assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            assert.equal(feesToken[1].toString(), origPricePOLY.toString());
            await I_POLYOracle.changePrice(new BN(20).mul(new BN(10).pow(new BN(16))));
            await I_STRProxied.getFees("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesTicker = await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            let newPricePOLY = new BN(web3.utils.toWei("1250"));
            assert.equal(feesTicker[0].toString(), origPriceUSD.toString());
            assert.equal(feesTicker[1].toString(), newPricePOLY.toString());
            assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            assert.equal(feesToken[1].toString(), newPricePOLY.toString());
            await I_POLYOracle.changePrice(new BN(21).mul(new BN(10).pow(new BN(16))));
            await I_STRProxied.getFees("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesTicker = await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            // No change as difference is less than 10%
            assert.equal(feesTicker[0].toString(), origPriceUSD.toString());
            assert.equal(feesTicker[1].toString(), newPricePOLY.toString());
            assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            assert.equal(feesToken[1].toString(), newPricePOLY.toString());
            await I_StablePOLYOracle.changeEvictPercentage(new BN(10).pow(new BN(16)));
            await I_STRProxied.getFees("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesTicker = await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2");
            feesToken = await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2");
            // Change as eviction percentage updated
            // newPricePOLY = new BN(web3.utils.toWei("1250"));
            //1190.476190476190476190 = 250/0.21
            assert.equal(feesTicker[0].toString(), origPriceUSD.toString());
            assert.equal(feesTicker[1].toString(), "1190476190476190476190");
            assert.equal(feesToken[0].toString(), origPriceUSD.toString());
            assert.equal(feesToken[1].toString(), "1190476190476190476190");
            await revertToSnapshot(snap_Id);
        });

        it("Should register the ticker when the tickerRegFee is 0", async () => {
            let snap_Id = await takeSnapshot();
            await I_STRProxied.changeTickerRegistrationFee(0, { from: account_polymath });
            let tx = await I_STRProxied.registerNewTicker(account_temp, "ZERO", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "ZERO", `Symbol should be ZERO`);
            await revertToSnapshot(snap_Id);
        });

        it("Should fail to register same symbol again", async () => {
            // Give POLY to token issuer
            await I_PolyToken.getTokens(initRegFeePOLY, token_owner);
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            // Call registration function
            await catchRevert(
                I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner }),
                "tx revert -> Symbol is already alloted to someone else"
            );
        });

        it("Should successfully register pre registerd ticker if expiry is reached", async () => {
            await increaseTime(5184000 + 100); // 60(5184000) days of expiry + 100 sec for buffer
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, symbol, `Symbol should be ${symbol}`);
        });

        it("Should fail to register ticker if registration is paused", async () => {
            await I_STRProxied.pause({ from: account_polymath });
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });

            await catchRevert(
                I_STRProxied.registerNewTicker(token_owner, "AAA", { from: token_owner }),
                "tx revert -> Registration is paused"
            );
        });

        it("Should fail to pause if already paused", async () => {
            await catchRevert(I_STRProxied.pause({ from: account_polymath }), "tx revert -> Registration is already paused");
        });

        it("Should successfully register ticker if registration is unpaused", async () => {
            await I_STRProxied.unpause({ from: account_polymath });
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, "AAA", { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, "AAA", `Symbol should be AAA`);
        });

        it("Should fail to unpause if already unpaused", async () => {
            await catchRevert(I_STRProxied.unpause({ from: account_polymath }), "tx revert -> Registration is already unpaused");
        });
    });

    describe("Test cases for the expiry limit", async () => {
        it("Should fail to set the expiry limit because msg.sender is not owner", async () => {
            await catchRevert(I_STRProxied.changeExpiryLimit(duration.days(10), { from: account_temp }), "tx revert -> msg.sender is not owner");
        });

        it("Should successfully set the expiry limit", async () => {
            await I_STRProxied.changeExpiryLimit(duration.days(10), { from: account_polymath });
            assert.equal(
                (await I_STRProxied.getUintValue.call(web3.utils.soliditySha3("expiryLimit"))).toNumber(),
                duration.days(10),
                "Failed to change the expiry limit"
            );
        });

        it("Should fail to set the expiry limit because new expiry limit is lesser than one day", async () => {
            await catchRevert(
                I_STRProxied.changeExpiryLimit(duration.seconds(5000), { from: account_polymath }),
                "tx revert -> New expiry limit is lesser than one day"
            );
        });
    });

    describe("Test cases for the getTickerDetails", async () => {
        it("Should get the details of the symbol", async () => {
            let tx = await I_Getter.getTickerDetails.call(symbol);
            assert.equal(tx[0], token_owner, "Should equal to the rightful owner of the ticker");
            assert.equal(tx[3], "", "Name of the token should equal be null/empty as it's not stored anymore");
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });

        it("Should get the details of unregistered token", async () => {
            let tx = await I_Getter.getTickerDetails.call("TORO");
            assert.equal(tx[0], address_zero, "Should be 0x as ticker is not exists in the registry");
            assert.equal(tx[3], "", "Should be an empty string");
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });
    });

    describe("Generate SecurityToken", async () => {
        it("Should get the ticker details successfully and prove the data is not storing in to the logic contract", async () => {
            let data = await I_Getter.getTickerDetails(symbol, { from: token_owner });
            assert.equal(data[0], token_owner, "Token owner should be equal");
            assert.equal(data[3], "", "Name of the token should equal be null/empty as it's not stored anymore");
            assert.equal(data[4], false, "Token is not launched yet so it should return False");
            data = await I_STRGetter.getTickerDetails(symbol, { from: token_owner });
            console.log("This is the data from the original securityTokenRegistry contract");
            assert.equal(data[0], address_zero, "Token owner should be 0x");
        });

        it("Should fail to generate new security token if fee not provided", async () => {
            await I_PolyToken.approve(I_STRProxied.address, new BN(0), { from: token_owner });

            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner }),
                "tx revert -> POLY allowance not provided for registration fee"
            );
        });

        it("Should fail to generate token if registration is paused", async () => {
            await I_STRProxied.pause({ from: account_polymath });
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });

            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner }),
                "tx revert -> Registration is paused"
            );
        });

        it("Should fail to generate the securityToken -- Because ticker length is 0", async () => {
            await I_STRProxied.unpause({ from: account_polymath });

            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, "0x0", tokenDetails, false, token_owner, 0, { from: token_owner }),
                "tx revert -> Zero ticker length is not allowed"
            );
        });

        it("Should fail to generate the securityToken -- Because name length is 0", async () => {
            await catchRevert(
                I_STRProxied.generateNewSecurityToken("", symbol, tokenDetails, false, token_owner, 0, { from: token_owner }),
                "tx revert -> 0 name length is not allowed"
            );
        });

        it("Should fail to generate the securityToken -- Because version is not valid", async () => {
            await catchRevert(
                I_STRProxied.generateNewSecurityToken("", symbol, tokenDetails, false, token_owner, 12356, { from: token_owner }),
                "tx revert -> 0 name length is not allowed"
            );
        });

        it("Should fail to generate the securityToken -- Because treasury wallet is 0x0", async () => {
            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, address_zero, 0, { from: token_owner }),
                "tx revert -> 0x0 value of treasury wallet is not allowed"
            );
        });

        it("Should fail to generate the securityToken -- Because msg.sender is not the rightful owner of the ticker", async () => {
            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: account_temp }),
                "tx revert -> Because msg.sender is not the rightful owner of the ticker"
            );
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            console.log(await I_STRGetter.getSTFactoryAddress());
            let info = await I_STRGetter.getLatestProtocolVersion();
            for (let i = 0; i < info.length; i++) {
                console.log(info[i].toNumber());
            }
            console.log(await I_STRGetter.getLatestProtocolVersion());
            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, treasury_wallet, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), treasury_wallet, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTrasnferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey, `Should be equal to the ${transferManagerKey}`);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should fail to generate the SecurityToken when token is already deployed with the same symbol", async () => {
            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, treasury_wallet, 0, { from: token_owner }),
                "tx revert -> Because ticker is already in use"
            );
        });

        it("Should fail to generate the SecurityToken because ticker gets expired", async () => {
            let snap_Id = await takeSnapshot();
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, "CCC", { from: token_owner });
            await increaseTime(duration.days(65));
            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name, "CCC", tokenDetails, false, treasury_wallet, 0, { from: token_owner }),
                "tx revert -> Because ticker is expired"
            );
            await revertToSnapshot(snap_Id);
        });

        it("Should generate the SecurityToken when launch fee is 0", async () => {
            let snap_Id = await takeSnapshot();
            await I_STRProxied.changeSecurityLaunchFee(0, { from: account_polymath });
            await I_STRProxied.changeTickerRegistrationFee(0, { from: account_polymath });
            //await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: token_owner });
            await I_STRProxied.registerNewTicker(token_owner, "CCC", { from: token_owner });
            await I_STRProxied.generateNewSecurityToken(name, "CCC", tokenDetails, false, treasury_wallet, 0, { from: token_owner }),
            await revertToSnapshot(snap_Id);
        });

        it("Should get all created security tokens", async() => {
            let snap_Id = await takeSnapshot();
            await I_PolyToken.getTokens(web3.utils.toWei("2000"), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("2000"), { from: account_temp });
            await I_STRProxied.registerNewTicker(account_temp, "TMP", { from: account_temp });
            let tx = await I_STRProxied.generateNewSecurityToken(name, "TMP", tokenDetails, false, account_temp, 0, { from: account_temp });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, "TMP", "SecurityToken doesn't get deployed");

            let securityTokenTmp = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            let tokens = await I_Getter.getTokensByOwner.call(token_owner);
            assert.equal(tokens.length, 1, "tokens array length error");
            assert.equal(tokens[0], I_SecurityToken.address, "ST address incorrect");

            let allTokens = await I_Getter.getTokens.call();
            assert.equal(allTokens.length, 2);
            assert.equal(allTokens[0], securityTokenTmp.address);
            assert.equal(allTokens[1], I_SecurityToken.address);

            await revertToSnapshot(snap_Id);
        });
    });

    describe("Generate SecurityToken v2", async () => {
        it("Should deploy the new ST factory version 2", async () => {
            const encodeParams = {
                name: "initialize",
                type: "function",
                inputs: [
                    {
                        type: "address",
                        name: "_getterDelegate"
                    }
                ]
            }
            // Step 7: Deploy the STFactory contract
            I_STGetter = await STGetter.new({from: account_polymath});
            let initializeData = await web3.eth.abi.encodeFunctionCall(encodeParams, [I_STGetter.address]);
            let I_DataStoreLogic = await DataStoreLogic.new({ from: account_polymath });
            let I_DataStoreFactory = await DataStoreFactory.new(I_DataStoreLogic.address, { from: account_polymath });
            I_TokenLib = await TokenLib.new();
            await STFactoryV2.link(TokenLib);
            await SecurityTokenMock.link(TokenLib);
            let SecurityTokenV2Logic = await SecurityTokenMock.new({from: account_polymath});
            I_STFactory002 = await STFactoryV2.new(
                I_PolymathRegistry.address,
                I_GeneralTransferManagerFactory.address,
                I_DataStoreFactory.address,
                "3",
                SecurityTokenV2Logic.address,
                initializeData,
                {
                    from: account_polymath
                }
            );
            console.log("STF deployed");
            assert.notEqual(
                I_STFactory002.address.valueOf(),
                address_zero,
                "STFactory002 contract was not deployed"
            );
            let _protocol = await I_Getter.getLatestProtocolVersion.call();
            assert.equal(_protocol[0], 3);
            assert.equal(_protocol[1], 0);
            assert.equal(_protocol[2], 0);
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol2, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Token owner should be ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, symbol2, `Symbol should be ${symbol2}`);
        });

        it("Should change the protocol version", async() => {
            await I_STRProxied.setProtocolFactory(I_STFactory002.address, new BN(2), new BN(2), new BN(0), { from: account_polymath });
            let _protocol = await I_Getter.getLatestProtocolVersion.call();
            assert.equal(_protocol[0], 3);
            assert.equal(_protocol[1], 0);
            assert.equal(_protocol[2], 0);
            await I_STRProxied.setLatestVersion(new BN(2), new BN(2), new BN(0), { from: account_polymath });
            _protocol = await I_Getter.getLatestProtocolVersion.call();
            assert.equal(_protocol[0], 2);
            assert.equal(_protocol[1], 2);
            assert.equal(_protocol[2], 0);
            await catchRevert(
                I_STRProxied.setProtocolFactory(I_STFactory.address, new BN(3), new BN(0), new BN(0), { from: account_polymath})
            );
            await I_STRProxied.setProtocolFactory(I_STFactory.address, new BN(3), new BN(0), new BN(1), { from: account_polymath});
            await I_STRProxied.setLatestVersion(new BN(3), new BN(0), new BN(0), { from: account_polymath});
            _protocol = await I_Getter.getLatestProtocolVersion.call();
            assert.equal(_protocol[0], 3);
            assert.equal(_protocol[1], 0);
            assert.equal(_protocol[2], 0);
        });

        it("Should fail to generate the securityToken because of invalid version", async() => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            await catchRevert(
                I_STRProxied.generateNewSecurityToken(name2, symbol2, tokenDetails, false, token_owner, _pack(1,2,0), { from: token_owner })
            );
        })

        it("Should generate the new security token with version 2", async () => {
            let snapId = await takeSnapshot();
            // Version bounds not checked here as MR is called as non-token
            let tx = await I_STRProxied.generateNewSecurityToken(name2, symbol2, tokenDetails, false, token_owner, _pack(2,2,0), { from: token_owner });
            console.log(`Protocol version: ${_pack(2,2,0)}`);
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol2, "SecurityToken doesn't get deployed");

            I_SecurityToken002 = await SecurityTokenMock.at(tx.logs[1].args._securityTokenAddress);
            let stGetterV2 = await STGetter.at(I_SecurityToken002.address);
            let stVersion = await stGetterV2.getVersion.call();
            console.log(stVersion);
            assert.equal(stVersion[0], 2);
            assert.equal(stVersion[1], 2);
            assert.equal(stVersion[2], 0);
            const log = (await I_SecurityToken002.getPastEvents('ModuleAdded'))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
            await revertToSnapshot(snapId);
        });
    });

    describe("Deploy the new SecurityTokenRegistry", async () => {
        it("Should deploy the new SecurityTokenRegistry contract logic", async () => {
            I_SecurityTokenRegistryV2 = await SecurityTokenRegistryMock.new({ from: account_polymath });
            assert.notEqual(I_SecurityTokenRegistryV2.address.valueOf(), address_zero, "SecurityTokenRegistry contract was not deployed");
        });

        it("Should fail to upgrade the logic contract of the STRProxy -- bad owner", async () => {
            await I_STRProxied.pause({ from: account_polymath });

            const STRProxyConfigParameters = ["uint256"];
            let bytesProxy = encodeModuleCall(STRProxyConfigParameters, [
                99
            ]);

            await catchRevert(
                I_SecurityTokenRegistryProxy.upgradeToAndCall("1.1.0", I_SecurityTokenRegistryV2.address, bytesProxy, { from: account_temp }),
                "tx revert -> bad owner"
            );
        });

        it("Should upgrade the logic contract into the STRProxy", async () => {
            const STRProxyConfigParameters = ["uint256"];
            let bytesProxy = encodeModuleCall(STRProxyConfigParameters, [
                99
            ]);

            await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.1.0", I_SecurityTokenRegistryV2.address, bytesProxy, { from: account_polymath });
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
            assert.isTrue(await I_STRProxied.getBoolValue.call(web3.utils.soliditySha3("paused")), "Paused value should be false");
        });

        it("Should check the old data persist or not", async () => {
            let data = await I_Getter.getTickerDetails.call(symbol);
            assert.equal(data[0], token_owner, "Should be equal to the token owner address");
            assert.equal(data[3], name, "Should be equal to the name of the token that is provided earlier");
            assert.isTrue(data[4], "Token status should be deployed == true");
        });

        it("Should unpause the logic contract", async () => {
            await I_STRProxied.unpause({ from: account_polymath });
            assert.isFalse(await I_STRProxied.getBoolValue.call(web3.utils.soliditySha3("paused")), "Paused value should be false");
        });
    });

    describe("Generate custom tokens", async () => {
        it("Should fail if msg.sender is not polymath", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken("LOG", account_temp, dummy_token, "I am custom ST", currentTime, {
                    from: account_delegate
                }),
                "tx revert -> msg.sender is not polymath account"
            );
        });

        it("Should fail to genrate the custom security token -- ticker length is greater than 10 chars", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken("LOGLOGLOGLOG", account_temp, dummy_token, "I am custom ST", currentTime, {
                    from: account_polymath
                }),
                "tx revert -> ticker length is greater than 10 chars"
            );
        });

        it("Should fail to generate the custom security token -- name should not be 0 length ", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken("LOG", account_temp, dummy_token, "I am custom ST", currentTime, {
                    from: account_polymath
                }),
                "tx revert -> name should not be 0 length"
            );
        });

        it("Should fail if ST address is 0 address", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken("LOG", account_temp, address_zero, "I am custom ST", currentTime, {
                    from: account_polymath
                }),
                "tx revert -> Security token address is 0"
            );
        });

        it("Should fail if symbol length is 0", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken("0x0", account_temp, dummy_token, "I am custom ST", currentTime, {
                    from: account_polymath
                }),
                "tx revert -> zero length of the symbol is not allowed"
            );
        });

        it("Should fail to generate the custom ST -- deployedAt param is 0", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingSecurityToken(symbol2, token_owner, dummy_token, "I am custom ST", new BN(0), { from: account_polymath }),
                "tx revert -> because deployedAt param is 0"
            );
        });

        it("Should successfully generate custom token", async () => {
            // Register the new ticker -- Fulfiling the TickerStatus.ON condition
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1000")), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: account_temp });
            let tickersListArray = await I_Getter.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            await I_STRProxied.registerNewTicker(account_temp, "LOG", { from: account_temp });
            tickersListArray = await I_Getter.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            // Generating the ST
            let tx = await I_STRProxied.modifyExistingSecurityToken("LOG", account_temp, I_SecurityToken.address, "I am custom ST", currentTime, {
                from: account_polymath
            });
            tickersListArray = await I_Getter.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            assert.equal(tx.logs[1].args._ticker, "LOG", "Symbol should match with the registered symbol");
            assert.equal(
                tx.logs[1].args._securityTokenAddress,
                I_SecurityToken.address,
                `Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`
            );
        });

        it("Should successfully generate the custom token", async () => {
            // Fulfilling the TickerStatus.NN condition
            //
            // await catchRevert(I_STRProxied.modifyExistingSecurityToken("LOG2", account_temp, dummy_token, "I am custom ST", await latestTime(), {from: account_polymath}));
            // await I_STRProxied.modifyExistingTicker(account_temp, "LOG2", await latestTime(), currentTime.add(new BN(duration.days(10))), false, {from: account_polymath});
            // await increaseTime(duration.days(1));
            let tx = await I_STRProxied.modifyExistingSecurityToken("LOG2", account_temp, I_SecurityToken.address, "I am custom ST", currentTime, {
                from: account_polymath
            });
            assert.equal(tx.logs[1].args._ticker, "LOG2", "Symbol should match with the registered symbol");
            assert.equal(
                tx.logs[1].args._securityTokenAddress,
                I_SecurityToken.address,
                `Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`
            );
            assert.equal(tx.logs[0].args._owner, account_temp, `Token owner should be ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "LOG2", `Symbol should be LOG2`);
        });

        it("Should successfully modify the ticker", async () => {
            let snap_Id = await takeSnapshot();
            let tx = await I_STRProxied.modifyExistingTicker(
                account_temp,
                "LOG2",
                currentTime,
                currentTime.add(new BN(duration.days(60))),
                false,
                { from: account_polymath }
            );
            await revertToSnapshot(snap_Id);
        });
    });

    describe("Test case for modifyTicker", async () => {
        it("Should add the custom ticker --failed because of bad owner", async () => {
            currentTime = new BN(await latestTime());
            await catchRevert(
                I_STRProxied.modifyExistingTicker(token_owner, "ETH", currentTime, currentTime.add(new BN(duration.days(10))), false, {
                    from: account_temp
                }),
                "tx revert -> failed beacause of bad owner0"
            );
        });

        it("Should add the custom ticker --fail ticker length should not be 0", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingTicker(token_owner, "", currentTime, currentTime.add(new BN(duration.days(10))), false, {
                    from: account_polymath
                }),
                "tx revert -> failed beacause ticker length should not be 0"
            );
        });

        it("Should add the custom ticker --failed because time should not be 0", async () => {
            await catchRevert(
                I_STRProxied.modifyExistingTicker(token_owner, "ETH", new BN(0), currentTime.add(new BN(duration.days(10))), false, {
                    from: account_polymath
                }),
                "tx revert -> failed because time should not be 0"
            );
        });

        it("Should add the custom ticker --failed because registeration date is greater than the expiryDate", async () => {
            let ctime = currentTime;
            await catchRevert(
                I_STRProxied.modifyExistingTicker(token_owner, "ETH", ctime, ctime.sub(new BN(duration.minutes(10))), false, {
                    from: account_polymath
                }),
                "tx revert -> failed because registeration date is greater than the expiryDate"
            );
        });

        it("Should add the custom ticker --failed because owner should not be 0x", async () => {
            let ctime = currentTime;
            await catchRevert(
                I_STRProxied.modifyExistingTicker(
                    address_zero,
                    "ETH",
                    ctime,
                    ctime.add(new BN(duration.minutes(10))),
                    false,
                    { from: account_polymath }
                ),
                "tx revert -> failed because owner should not be 0x"
            );
        });

        it("Should add the new custom ticker", async () => {
            let ctime = currentTime;
            let tx = await I_STRProxied.modifyExistingTicker(
                account_temp,
                "ETH",
                ctime,
                ctime.add(new BN(duration.minutes(10))),
                false,
                { from: account_polymath }
            );
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "ETH", "Should be equal to ETH");
        });

        it("Should change the details of the existing ticker", async () => {
            let ctime = currentTime;
            let tx = await I_STRProxied.modifyExistingTicker(
                token_owner,
                "ETH",
                ctime,
                ctime.add(new BN(duration.minutes(10))),
                false,
                { from: account_polymath }
            );
            assert.equal(tx.logs[0].args._owner, token_owner);
        });
    });

    describe("Test cases for the transferTickerOwnership()", async () => {
        it("Should be able to transfer the ticker ownership -- failed because token is not deployed having the same ticker", async () => {
            await catchRevert(
                I_STRProxied.transferTickerOwnership(account_issuer, "ETH", { from: account_temp }),
                "tx revert -> failed because token is not deployed having the same ticker"
            );
        });

        it("Should be able to transfer the ticker ownership -- failed because new owner is 0x", async () => {
            //await I_SecurityToken002.transferOwnership(account_temp, { from: token_owner });
            await catchRevert(
                I_STRProxied.transferTickerOwnership(address_zero, symbol2, { from: token_owner }),
                "tx revert -> failed because new owner is 0x"
            );
        });

        it("Should be able to transfer the ticker ownership -- failed because ticker is of zero length", async () => {
            await catchRevert(
                I_STRProxied.transferTickerOwnership(account_temp, "", { from: token_owner }),
                "tx revert -> failed because ticker is of zero length"
            );
        });

        it("Should be able to transfer the ticker ownership", async () => {
            let tx = await I_STRProxied.transferTickerOwnership(account_temp, symbol2, { from: token_owner, gas: 5000000 });
            assert.equal(tx.logs[0].args._newOwner, account_temp);
            let symbolDetails = await I_Getter.getTickerDetails.call(symbol2);
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
        });
    });

    describe("Test case for the changeSecurityLaunchFee()", async () => {
        it("Should be able to change the STLaunchFee-- failed because of bad owner", async () => {
            await catchRevert(
                I_STRProxied.changeSecurityLaunchFee(new BN(web3.utils.toWei("500")), { from: account_temp }),
                "tx revert -> failed because of bad owner"
            );
        });

        it("Should be able to change the STLaunchFee-- failed because of putting the same fee", async () => {
            await catchRevert(
                I_STRProxied.changeSecurityLaunchFee(initRegFee, { from: account_polymath }),
                "tx revert -> failed because of putting the same fee"
            );
        });

        it("Should be able to change the STLaunchFee", async () => {
            let tx = await I_STRProxied.changeSecurityLaunchFee(new BN(web3.utils.toWei("500")), { from: account_polymath });
            assert.equal(tx.logs[0].args._newFee.toString(), new BN(web3.utils.toWei("500")).toString());
            let stLaunchFee = await I_STRProxied.getUintValue(web3.utils.soliditySha3("stLaunchFee"));
            assert.equal(stLaunchFee.toString(), new BN(web3.utils.toWei("500")).toString());
        });
    });

    describe("Test cases for the changeExpiryLimit()", async () => {
        it("Should be able to change the ExpiryLimit-- failed because of bad owner", async () => {
            await catchRevert(
                I_STRProxied.changeExpiryLimit(duration.days(15), { from: account_temp }),
                "tx revert -> failed because of bad owner"
            );
        });

        it("Should be able to change the ExpiryLimit-- failed because expirylimit is less than 1 day", async () => {
            await catchRevert(
                I_STRProxied.changeExpiryLimit(duration.minutes(50), { from: account_polymath }),
                "tx revert -> failed because expirylimit is less than 1 day"
            );
        });

        it("Should be able to change the ExpiryLimit", async () => {
            let tx = await I_STRProxied.changeExpiryLimit(duration.days(20), { from: account_polymath });
            assert.equal(tx.logs[0].args._newExpiry, duration.days(20));
            let expiry = await I_STRProxied.getUintValue(web3.utils.soliditySha3("expiryLimit"));
            assert.equal(expiry, duration.days(20));
        });
    });

    describe("Test cases for the changeTickerRegistrationFee()", async () => {
        it("Should be able to change the fee currency-- failed because of bad owner", async () => {
            await catchRevert(
                I_STRProxied.changeFeesAmountAndCurrency(new BN(web3.utils.toWei("500")), new BN(web3.utils.toWei("100")), false, { from: account_temp }),
                "tx revert -> failed because of bad owner"
            );
        });

        it("Should be able to change the fee currency-- failed because of putting the same currency", async () => {
            await catchRevert(
                I_STRProxied.changeFeesAmountAndCurrency(new BN(web3.utils.toWei("500")), new BN(web3.utils.toWei("100")), false, { from: account_polymath }),
                "tx revert -> failed because of putting the same fee"
            );
        });

        it("Should be able to change the fee currency", async () => {
            let snapId = await takeSnapshot();
            let tx = await I_STRProxied.changeFeesAmountAndCurrency(new BN(web3.utils.toWei("500")), new BN(web3.utils.toWei("100")), true, { from: account_polymath });
            assert.equal(tx.logs[0].args._newFee.toString(), new BN(web3.utils.toWei("500")).toString(), "wrong ticker fee in event");
            assert.equal(tx.logs[1].args._newFee.toString(), new BN(web3.utils.toWei("100")).toString(), "wrong st fee in event");
            assert.equal(tx.logs[2].args._isFeeInPoly, true, "wrong fee type");
            assert.equal(await I_Getter.getIsFeeInPoly(), true, "is fee in poly not set");
            let tickerRegFee = await I_STRProxied.getUintValue(web3.utils.soliditySha3("tickerRegFee"));
            assert.equal(tickerRegFee.toString(), new BN(web3.utils.toWei("500")).toString(), "wrong fee");
            let tickerRegFeePoly = (await I_STRProxied.getFees.call("0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2"))[1];
            assert.equal(tickerRegFeePoly.toString(), tickerRegFee.toString());
            let stFee = await I_STRProxied.getUintValue(web3.utils.soliditySha3("stLaunchFee"));
            assert.equal(stFee.toString(), new BN(web3.utils.toWei("100")).toString(), "wrong fee");
            let stFeePoly = (await I_STRProxied.getFees.call("0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2"))[1];
            assert.equal(stFeePoly.toString(), stFee.toString());
            await revertToSnapshot(snapId);
        });
    });

    describe("Test cases for the changeTickerRegistrationFee()", async () => {
        it("Should be able to change the TickerRegFee-- failed because of bad owner", async () => {
            await catchRevert(
                I_STRProxied.changeTickerRegistrationFee(new BN(web3.utils.toWei("500")), { from: account_temp }),
                "tx revert -> failed because of bad owner"
            );
        });

        it("Should be able to change the TickerRegFee-- failed because of putting the same fee", async () => {
            await catchRevert(
                I_STRProxied.changeTickerRegistrationFee(initRegFee, { from: account_polymath }),
                "tx revert -> failed because of putting the same fee"
            );
        });

        it("Should be able to change the TickerRegFee", async () => {
            let tx = await I_STRProxied.changeTickerRegistrationFee(new BN(web3.utils.toWei("400")), { from: account_polymath });
            assert.equal(tx.logs[0].args._newFee.toString(), new BN(web3.utils.toWei("400")).toString());
            let tickerRegFee = await I_STRProxied.getUintValue(web3.utils.soliditySha3("tickerRegFee"));
            assert.equal(tickerRegFee.toString(), new BN(web3.utils.toWei("400")).toString());
        });

        it("Should fail to register the ticker with the old fee", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            await catchRevert(
                I_STRProxied.registerNewTicker(token_owner, "POLY", { from: token_owner }),
                "tx revert -> failed because of ticker registeration fee gets change"
            );
        });

        it("Should register the ticker with the new fee", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1600")), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, "POLY", { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Token owner should be ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, "POLY", `Symbol should be POLY`);
        });

        it("Should fail to launch the securityToken with the old launch fee", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFeePOLY, { from: token_owner });
            await catchRevert(
                I_STRProxied.generateNewSecurityToken("Polymath", "POLY", tokenDetails, false, token_owner, 0,  { from: token_owner }),
                "tx revert -> failed because of old launch fee"
            );
        });

        it("Should launch the the securityToken", async () => {
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: token_owner });
            let tx = await I_STRProxied.generateNewSecurityToken("Polymath", "POLY", tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, "POLY", "SecurityToken doesn't get deployed");
        });
    });

    describe("Test case for the update poly token", async () => {
        it("Should change the polytoken address -- failed because of bad owner", async () => {
            catchRevert(
                I_STRProxied.updatePolyTokenAddress(dummy_token, { from: account_temp }),
                "tx revert -> failed because of bad owner"
            );
        });

        it("Should change the polytoken address -- failed because of 0x address", async () => {
            catchRevert(
                I_STRProxied.updatePolyTokenAddress(address_zero, { from: account_polymath }),
                "tx revert -> failed because 0x address"
            );
        });

        it("Should successfully change the polytoken address", async () => {
            let _id = await takeSnapshot();
            await I_STRProxied.updatePolyTokenAddress(dummy_token, { from: account_polymath });
            assert.equal(await I_STRProxied.getAddressValue.call(web3.utils.soliditySha3("polyToken")), dummy_token);
            await revertToSnapshot(_id);
        });
    });

    describe("Test case for refreshing a security token", async () => {
        it("Should fail if msg.sender is not ST owner", async () => {
            await catchRevert(
                I_STRProxied.refreshSecurityToken("refreshedToken", symbol, "refreshedToken", true, token_owner, {
                    from: account_delegate
                })
            );
        });

        it("Should fail if ticker is not deployed", async () => {
            await catchRevert(
                I_STRProxied.refreshSecurityToken("refreshedToken", "LOGLOG3", "refreshedToken", true, token_owner, {
                    from: token_owner
                })
            );
        });

        it("Should fail if name is 0 length", async () => {
            await catchRevert(
                I_STRProxied.refreshSecurityToken("", symbol, "refreshedToken", true, token_owner, {
                    from: token_owner
                })
            );
        });

        it("Should fail if null treasurey wallet", async () => {
            await catchRevert(
                I_STRProxied.refreshSecurityToken("refreshedToken", symbol, "refreshedToken", true, address_zero, {
                    from: token_owner
                })
            );
        });

        it("Should fail if transfers not frozen", async () => {
            await catchRevert(
                I_STRProxied.refreshSecurityToken("refreshedToken", symbol, "refreshedToken", true, token_owner, {
                    from: token_owner
                })
            );
        });

        it("Should refresh security token", async () => {
            let snapid = await takeSnapshot();
            let oldStAddress = await I_Getter.getSecurityTokenAddress(symbol);
            let oldSt = await SecurityToken.at(oldStAddress);
            await oldSt.freezeTransfers({ from:token_owner });
            let tx = await I_STRProxied.refreshSecurityToken("refreshedToken", symbol, "refreshedToken", true, token_owner, {
                from: token_owner
            });
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken not deployed");
            let newStAddress = await I_Getter.getSecurityTokenAddress(symbol);
            let securityTokenTmp = tx.logs[1].args._securityTokenAddress;
            assert.equal(newStAddress, securityTokenTmp, "ST address not updated");
            let newST = await SecurityToken.at(newStAddress);
            assert.notEqual(oldStAddress, newStAddress, "new ST not generated");
            assert.equal(await newST.name(), "refreshedToken", "ST not deployed properly");
            await revertToSnapshot(snapid);
        });
    });

    describe("Test cases for getters", async () => {
        it("Should get the security token address", async () => {
            let address = await I_Getter.getSecurityTokenAddress.call(symbol);
            assert.equal(address, I_SecurityToken.address);
        });

        it("Should get the security token data", async () => {
            let data = await I_Getter.getSecurityTokenData.call(I_SecurityToken.address);
            assert.equal(data[0], "LOG2");
            assert.equal(data[1], token_owner);
        });

        it("Should get the tickers by owner", async () => {
            let tickersList = await I_Getter.getTickersByOwner.call(token_owner);
            console.log(tickersList);
            assert.equal(tickersList.length, 4);
            let tickersListArray = await I_Getter.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            assert.equal(tickersListArray.length, 3);
        });
    });

    describe("Test case for the Removing the ticker", async () => {
        it("Should remove the ticker from the polymath ecosystem -- bad owner", async () => {
            await catchRevert(
                I_STRProxied.removeTicker(symbol2, { from: account_investor1 }),
                "tx revert -> failed because msg.sender should be account_polymath"
            );
        });

        it("Should remove the ticker from the polymath ecosystem -- fail because ticker doesn't exist in the ecosystem", async () => {
            await catchRevert(
                I_STRProxied.removeTicker("HOLA", { from: account_polymath }),
                "tx revert -> failed because ticker doesn't exist in the polymath ecosystem"
            );
        });

        it("Should successfully remove the ticker from the polymath ecosystem", async () => {
            let tx = await I_STRProxied.removeTicker(symbol2, { from: account_polymath });
            assert.equal(tx.logs[0].args._ticker, symbol2, "Ticker doesn't get deleted successfully");
        });
    });

    describe(" Test cases of the registerTicker", async () => {
        it("Should register the ticker 1", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1600")), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("1600")), { from: account_temp });
            let tx = await I_STRProxied.registerNewTicker(account_temp, "TOK1", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK1", `Symbol should be TOK1`);
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });

        it("Should register the ticker 2", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1600")), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("1600")), { from: account_temp });
            let tx = await I_STRProxied.registerNewTicker(account_temp, "TOK2", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK2", `Symbol should be TOK2`);
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });

        it("Should register the ticker 3", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1600")), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("1600")), { from: account_temp });
            let tx = await I_STRProxied.registerNewTicker(account_temp, "TOK3", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK3", `Symbol should be TOK3`);
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });

        it("Should successfully remove the ticker 2", async () => {
            let tx = await I_STRProxied.removeTicker("TOK2", { from: account_polymath });
            assert.equal(tx.logs[0].args._ticker, "TOK2", "Ticker doesn't get deleted successfully");
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });

        it("Should modify ticker 1", async () => {
            currentTime = new BN(await latestTime());
            let tx = await I_STRProxied.modifyExistingTicker(
                account_temp,
                "TOK1",
                currentTime,
                currentTime.add(new BN(duration.minutes(10))),
                false,
                { from: account_polymath }
            );
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK1", "Should be equal to TOK1");
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });

        it("Should modify ticker 3", async () => {
            let tx = await I_STRProxied.modifyExistingTicker(
                account_temp,
                "TOK3",
                currentTime,
                currentTime.add(new BN(duration.minutes(10))),
                false,
                { from: account_polymath }
            );
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK3", "Should be equal to TOK3");
            console.log((await I_Getter.getTickersByOwner.call(account_temp)).map(x => web3.utils.toUtf8(x)));
        });
    });
    describe("Test cases for IRegistry functionality", async () => {
        describe("Test cases for reclaiming funds", async () => {
            it("Should successfully reclaim POLY tokens -- fail because token address will be 0x", async () => {
                I_PolyToken.transfer(I_STRProxied.address, new BN(web3.utils.toWei("1")), { from: token_owner });
                await catchRevert(I_STRProxied.reclaimERC20(address_zero, { from: account_polymath }));
            });

            it("Should successfully reclaim POLY tokens -- not authorised", async () => {
                await catchRevert(I_STRProxied.reclaimERC20(I_PolyToken.address, { from: account_temp }));
            });

            it("Should successfully reclaim POLY tokens", async () => {
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_STRProxied.reclaimERC20(I_PolyToken.address, { from: account_polymath });
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(
                    bal2.div(new BN(10).pow(new BN(18))).toNumber(),
                    bal2.div(new BN(10).pow(new BN(18))).toNumber()
                );
            });
        });

        describe("Test cases for pausing the contract", async () => {
            it("Should fail to pause if msg.sender is not owner", async () => {
                await catchRevert(I_STRProxied.pause({ from: account_temp }), "tx revert -> msg.sender should be account_polymath");
            });

            it("Should successfully pause the contract", async () => {
                await I_STRProxied.pause({ from: account_polymath });
                let status = await I_STRProxied.getBoolValue.call(web3.utils.soliditySha3("paused"));
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async () => {
                await catchRevert(I_STRProxied.unpause({ from: account_temp }), "tx revert -> msg.sender should be account_polymath");
            });

            it("Should successfully unpause the contract", async () => {
                await I_STRProxied.unpause({ from: account_polymath });
                let status = await I_STRProxied.getBoolValue.call(web3.utils.soliditySha3("paused"));
                assert.isNotOk(status);
            });
        });

        describe("Test cases for the setProtocolVersion", async () => {
            it("Should successfully change the protocolVersion -- failed because of bad owner", async () => {
                await catchRevert(I_STRProxied.setProtocolFactory(accounts[8], 5, 6, 7, { from: account_temp }));
            });

            it("Should successfully change the protocolVersion -- failed because factory address is 0x", async () => {
                await catchRevert(
                    I_STRProxied.setProtocolFactory(address_zero, 5, 6, 7, { from: account_polymath })
                );
            });

            it("Should successfully change the protocolVersion -- not a valid version", async () => {
                await catchRevert(I_STRProxied.setLatestVersion(new BN(0), new BN(0), new BN(0), { from: account_polymath }));
            });

            it("Should successfully change the protocolVersion -- fail in second attempt because of invalid version", async () => {
                let snap_Id = await takeSnapshot();
                await I_STRProxied.setProtocolFactory(accounts[8], 3, 1, 1, { from: account_polymath });
                await catchRevert(I_STRProxied.setLatestVersion(1, 3, 1, { from: account_polymath }));
                await revertToSnapshot(snap_Id);
            });
        });

        describe("Test cases for the transferOwnership", async () => {
            it("Should fail to transfer the ownership -- not authorised", async () => {
                await catchRevert(I_STRProxied.transferOwnership(account_temp, { from: account_issuer }));
            });

            it("Should fail to transfer the ownership -- 0x address is not allowed", async () => {
                await catchRevert(I_STRProxied.transferOwnership(address_zero, { from: account_polymath }));
            });

            it("Should successfully transfer the ownership of the STR", async () => {
                let tx = await I_STRProxied.transferOwnership(account_temp, { from: account_polymath });
                assert.equal(tx.logs[0].args.previousOwner, account_polymath);
                assert.equal(tx.logs[0].args.newOwner, account_temp);
            });
        });
    });
});
