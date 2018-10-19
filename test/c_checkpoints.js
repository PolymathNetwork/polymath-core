import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Checkpoints", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_STRProxied;
    let I_MRProxied;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
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

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];

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

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
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
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should set controller to token owner", async () => {
            await I_SecurityToken.setController(token_owner, { from: token_owner });
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                false,
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

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("10", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("10", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                false,
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
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("10", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("10", "ether"));
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                false,
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
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("10", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei("10", "ether"));
        });

        it("Fuzz test balance checkpoints", async () => {
            await I_SecurityToken.changeGranularity(1, { from: token_owner });
            let cps = [];
            let ts = [];
            for (let j = 0; j < 10; j++) {
                let balance1 = BigNumber(await I_SecurityToken.balanceOf(account_investor1));
                let balance2 = BigNumber(await I_SecurityToken.balanceOf(account_investor2));
                let balance3 = BigNumber(await I_SecurityToken.balanceOf(account_investor3));
                let totalSupply = BigNumber(await I_SecurityToken.totalSupply());
                cps.push([balance1, balance2, balance3]);
                ts.push(totalSupply);
                console.log(
                    "Checkpoint: " +
                        (j + 1) +
                        " Balances: " +
                        JSON.stringify(cps[cps.length - 1]) +
                        " TotalSupply: " +
                        JSON.stringify(totalSupply)
                );
                await I_SecurityToken.createCheckpoint({ from: token_owner });
                let checkpointTimes = await I_SecurityToken.getCheckpointTimes();
                assert.equal(checkpointTimes.length, j + 1);
                console.log("Checkpoint Times: " + checkpointTimes);
                let txs = Math.floor(Math.random() * 3);
                for (let i = 0; i < txs; i++) {
                    let sender;
                    let receiver;
                    let s = Math.random() * 3;
                    if (s < 1) {
                        sender = account_investor1;
                    } else if (s < 2) {
                        sender = account_investor2;
                    } else {
                        sender = account_investor3;
                    }
                    let r = Math.random() * 3;
                    if (r < 1) {
                        receiver = account_investor1;
                    } else if (r < 2) {
                        receiver = account_investor2;
                    } else {
                        receiver = account_investor3;
                    }
                    let m = Math.random();
                    let amount = BigNumber(await I_SecurityToken.balanceOf(sender))
                        .mul(Math.random().toFixed(10))
                        .toFixed(0);
                    if (m > 0.8) {
                        console.log("Sending full balance");
                        amount = BigNumber(await I_SecurityToken.balanceOf(sender));
                    }
                    console.log("Sender: " + sender + " Receiver: " + receiver + " Amount: " + JSON.stringify(amount));
                    await I_SecurityToken.transfer(receiver, amount, { from: sender });
                }
                if (Math.random() > 0.5) {
                    let n = BigNumber(Math.random().toFixed(10))
                        .mul(10 ** 17)
                        .toFixed(0);
                    let p = Math.random() * 3;
                    let r = Math.random() * 3;
                    let minter;
                    if (r < 1) {
                        minter = account_investor1;
                    } else if (r < 2) {
                        minter = account_investor2;
                    } else {
                        minter = account_investor3;
                    }
                    console.log("Minting: " + n.toString() + " to: " + minter);
                    await I_SecurityToken.mint(minter, n, { from: token_owner });
                }
                if (Math.random() > 0.5) {
                    let n = BigNumber(Math.random().toFixed(10)).mul(10 ** 17);
                    let p = Math.random() * 3;
                    let r = Math.random() * 3;
                    let burner;
                    if (r < 1) {
                        burner = account_investor1;
                    } else if (r < 2) {
                        burner = account_investor2;
                    } else {
                        burner = account_investor3;
                    }
                    let burnerBalance = BigNumber(await I_SecurityToken.balanceOf(burner));
                    if (n.gt(burnerBalance.div(2))) {
                        n = burnerBalance.div(2);
                    }
                    n = n.toFixed(0);
                    console.log("Burning: " + n.toString() + " from: " + burner);
                    await I_SecurityToken.forceBurn(burner, n, "", "", { from: token_owner });
                }
                console.log("Checking Interim...");
                for (let k = 0; k < cps.length; k++) {
                    let balance1 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor1, k + 1));
                    let balance2 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor2, k + 1));
                    let balance3 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor3, k + 1));
                    let totalSupply = BigNumber(await I_SecurityToken.totalSupplyAt(k + 1));
                    let balances = [balance1, balance2, balance3];
                    console.log("Checking TotalSupply: " + totalSupply + " is " + ts[k] + " at checkpoint: " + (k + 1));
                    assert.isTrue(totalSupply.eq(ts[k]));
                    console.log("Checking Balances: " + balances + " is " + cps[k] + " at checkpoint: " + (k + 1));
                    for (let l = 0; l < cps[k].length; l++) {
                        // console.log(balances[l].toString(), cps[k][l].toString());
                        assert.isTrue(balances[l].eq(cps[k][l]));
                    }
                }
            }
            console.log("Checking...");
            for (let k = 0; k < cps.length; k++) {
                let balance1 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor1, k + 1));
                let balance2 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor2, k + 1));
                let balance3 = BigNumber(await I_SecurityToken.balanceOfAt(account_investor3, k + 1));
                let totalSupply = BigNumber(await I_SecurityToken.totalSupplyAt(k + 1));
                let balances = [balance1, balance2, balance3];
                console.log("Checking TotalSupply: " + totalSupply + " is " + ts[k] + " at checkpoint: " + (k + 1));
                assert.isTrue(totalSupply.eq(ts[k]));
                console.log("Checking Balances: " + balances + " is " + cps[k] + " at checkpoint: " + (k + 1));
                for (let l = 0; l < cps[k].length; l++) {
                    // console.log(balances[l].toString(), cps[k][l].toString());
                    assert.isTrue(balances[l].eq(cps[k][l]));
                }
            }
        });
    });
});
