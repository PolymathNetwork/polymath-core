import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployPercentageTMAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const PercentageTransferManager = artifacts.require("./PercentageTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const SecurityToken = artifacts.require("./SecurityToken.sol");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PercentageTransferManager", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_delegate;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_PercentageTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_PercentageTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_PercentageTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_PercentageTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    var I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // PercentageTransferManager details
    const holderPercentage = 70 * 10**16;           // Maximum number of token holders

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_maxHolderPercentage'
        },{
            type: 'bool',
            name: '_allowPrimaryIssuance'
        }
        ]
    }, [holderPercentage, false]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_delegate = accounts[6];

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        // STEP 3(a): Deploy the PercentageTransferManager
        [I_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        // STEP 4(b): Deploy the PercentageTransferManager
        [P_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500", "ether"));
    
        // Printing all the contract addresses
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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        PercentageTransferManagerFactory:  ${I_PercentageTransferManagerFactory.address}
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
            assert.equal(tx.logs[2].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[2].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[2].args._module);
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
                true,
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

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should successfully attach the PercentageTransferManager factory with the security token - failed payment", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_PercentageTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the PercentageTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_PercentageTransferManagerFactory.address,
                bytesSTO,
                web3.utils.toWei("500", "ether"),
                0,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "PercentageTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "PercentageTransferManagerFactory module was not added"
            );
            P_PercentageTransferManager = PercentageTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the PercentageTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_PercentageTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "PercentageTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "PercentageTransferManager module was not added"
            );
            I_PercentageTransferManager = PercentageTransferManager.at(tx.logs[2].args._module);
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
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
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("1", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei("1", "ether"));
        });

        it("Should pause the tranfers at transferManager level", async () => {
            let tx = await I_PercentageTransferManager.pause({ from: token_owner });
        });

        it("Should still be able to transfer between existing token holders up to limit", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("2", "ether"));
        });

        it("Should unpause the tranfers at transferManager level", async () => {
            await I_PercentageTransferManager.unpause({ from: token_owner });
        });

        it("Should not be able to transfer between existing token holders over limit", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor3, web3.utils.toWei("2", "ether"), { from: account_investor1 }));
        });

        it("Should not be able to mint token amount over limit", async() => {
            await catchRevert(I_SecurityToken.mint(account_investor3, web3.utils.toWei('100', 'ether'), { from: token_owner }))
        });

        it("Allow unlimited primary issuance and remint", async() => {
            let snapId = await takeSnapshot();
            await I_PercentageTransferManager.setAllowPrimaryIssuance(true, { from: token_owner });
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei('100', 'ether'), { from: token_owner });
            // trying to call it again with the same value. should fail
            await catchRevert(
                I_PercentageTransferManager.setAllowPrimaryIssuance(true, { from: token_owner })
            )
            await revertToSnapshot(snapId);
        });

        it("Should not be able to transfer between existing token holders over limit", async() => {
           await catchRevert(
                I_SecurityToken.transfer(account_investor3, web3.utils.toWei('2', 'ether'), { from: account_investor1 })
           )
        });

        it("Should not be able to modify holder percentage to 100 - Unauthorized msg.sender", async () => {
            await catchRevert(
                I_PercentageTransferManager.changeHolderPercentage(100 * 10 ** 16, { from: account_delegate })
            )
        });

        it("Should successfully add the delegate", async() => {
            let tx = await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should provide the permission", async() => {
            let tx = await I_GeneralPermissionManager.changePermission(
                account_delegate,
                I_PercentageTransferManager.address,
                "ADMIN",
                true,
                {from: token_owner}
            );
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Modify holder percentage to 100", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_PercentageTransferManager.changeHolderPercentage(100 * 10 ** 16, { from: account_delegate });

            assert.equal((await I_PercentageTransferManager.maxHolderPercentage()).toNumber(), 100 * 10 ** 16);
        });

        it("Should be able to transfer between existing token holders up to limit", async () => {
            await I_PercentageTransferManager.modifyWhitelist(account_investor3, false, { from: token_owner });
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei("2", "ether"), { from: account_investor1 });
        });

        it("Should whitelist in batch --failed because of mismatch in array lengths", async() => {
            await catchRevert(
                I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [false], { from: token_owner })
            );
        })

        it("Should whitelist in batch", async() => {
            let snapId = await takeSnapshot();
            await I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [false, true], { from: token_owner });
            await revertToSnapshot(snapId);
        })

        it("Should be able to whitelist address and then transfer regardless of holders", async () => {
            await I_PercentageTransferManager.changeHolderPercentage(30 * 10 ** 16, { from: token_owner });
            await I_PercentageTransferManager.modifyWhitelist(account_investor1, true, { from: token_owner });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("2", "ether"), { from: account_investor3 });
        });

        it("Should get the permission", async () => {
            let perm = await I_PercentageTransferManager.getPermissions.call();
            assert.equal(perm.length, 2);
        });
    });

    describe("Percentage Transfer Manager Factory test cases", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_PercentageTransferManagerFactory.getSetupCost.call(), 0);
            assert.equal((await I_PercentageTransferManagerFactory.getTypes.call())[0], 2);
            assert.equal(
                web3.utils.toAscii(await I_PercentageTransferManagerFactory.getName.call()).replace(/\u0000/g, ""),
                "PercentageTransferManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_PercentageTransferManagerFactory.description.call(),
                "Restrict the number of investors",
                "Wrong Module added"
            );
            assert.equal(await I_PercentageTransferManagerFactory.title.call(), "Percentage Transfer Manager", "Wrong Module added");
            assert.equal(
                await I_PercentageTransferManagerFactory.getInstructions.call(),
                "Allows an issuer to restrict the total number of non-zero token holders",
                "Wrong Module added"
            );
            assert.equal(await I_PercentageTransferManagerFactory.version.call(), "1.0.0");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_PercentageTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Percentage");
        });
    });
});
