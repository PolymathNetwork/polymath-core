import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { error } from 'util';
const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const CountTransferManagerFactory = artifacts.require('./CountTransferManagerFactory.sol');
const CountTransferManager = artifacts.require('./CountTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('CountTransferManager', accounts => {

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
    let P_CountTransferManagerFactory;
    let P_CountTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_CountTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_CountTransferManager;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_STVersion;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const swarmHash = "dagwrgwgvwergwrvwrg";
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
    const initRegFee = 250 * Math.pow(10, 18);

    // CountTransferManager details
    const holderCount = 2;           // Maximum number of token holders

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
        name: 'configure',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_maxHolderCount'
        }
        ]
    }, [holderCount]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];

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

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the CountTransferManager
        I_CountTransferManagerFactory = await CountTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_CountTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CountTransferManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy Paid the CountTransferManager
        P_CountTransferManagerFactory = await CountTransferManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {from:account_polymath});
        assert.notEqual(
            P_CountTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CountTransferManagerFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the CountTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_CountTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_CountTransferManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the Paid CountTransferManagerFactory
        await I_ModuleRegistry.registerModule(P_CountTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(P_CountTransferManagerFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, initRegFee, { from: account_polymath });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolymathRegistry.address,
            I_STVersion.address,
            initRegFee,
            {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        await I_SecurityTokenRegistry.updateFromRegistry({from: account_polymath});
        await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
        await I_TickerRegistry.updateFromRegistry({from: account_polymath});

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            CountTransferManagerFactory: ${I_CountTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, contact, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 85000000 });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(2, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_CountTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the CountTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_CountTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._type.toNumber(), transferManagerKey, "CountTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "CountTransferManager",
                "CountTransferManagerFactory module was not added"
            );
            P_CountTransferManager = CountTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the CountTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "CountTransferManager",
                "CountTransferManager module was not added"
            );
            I_CountTransferManager = CountTransferManager.at(tx.logs[2].args._module);
        });
    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should fail to buy some more tokens (more than 2 holders)", async() => {
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor3.toLowerCase(), "Failed in adding the investor in whitelist");

            let errorThrown = false;
            try {
                // Mint some tokens
                await I_SecurityToken.mint(account_investor3, web3.utils.toWei('3', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Too many holders`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });


        it("Should still be able to add to original token holders", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('4', 'ether')
            );
        });

        it("Should still be able to transfer between existing token holders before count change", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor2 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should fail in modifying the holder count", async() => {
            let errorThrown = false;
            try {
                await I_CountTransferManager.changeHolderCount(1, { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to change the holder count`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Modify holder count to 1", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_CountTransferManager.changeHolderCount(1, { from: token_owner });

            assert.equal(
                (await I_CountTransferManager.maxHolderCount()).toNumber(),
                1
            );
        });

        it("Should still be able to transfer between existing token holders after count change", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('2', 'ether'), { from: account_investor1 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('4', 'ether')
            );
        });

        // it("Should not be able to transfer to a token holder", async() => {
        //     let errorThrown = false;

        //     await I_CountTransferManager.pause({from: token_owner});
        //     assert.isTrue(await I_CountTransferManager.paused.call());

        //     try {
        //         // Mint some tokens
        //         await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
        //     } catch(error) {
        //         console.log(`Failed due to transfers are paused`);
        //         ensureException(error);
        //         errorThrown = true;
        //     }
        //     assert.ok(errorThrown, message);
        //   });


        it("Should not be able to transfer to a new token holder", async() => {
          let errorThrown = false;
          // await I_CountTransferManager.unpause({from: token_owner});
          try {
              // Mint some tokens
              await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('2', 'ether'), { from: account_investor2 });
          } catch(error) {
              console.log(`         tx revert -> Too many holders`.grey);
              ensureException(error);
              errorThrown = true;
          }
          assert.ok(errorThrown, message);

        });

        it("Should be able to consolidate balances", async() => {
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
        });

        it("Should get the permission list", async() => {
            let perm = await I_CountTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

        describe("Test cases for the factory", async() => {
            it("should get the exact details of the factory", async() => {
                assert.equal(await I_CountTransferManagerFactory.setupCost.call(),0);
                assert.equal(await I_CountTransferManagerFactory.getType.call(),2);
                assert.equal(web3.utils.toAscii(await I_CountTransferManagerFactory.getName.call())
                            .replace(/\u0000/g, ''),
                            "CountTransferManager",
                            "Wrong Module added");
                assert.equal(await I_CountTransferManagerFactory.getDescription.call(),
                            "Restrict the number of investors",
                            "Wrong Module added");
                assert.equal(await I_CountTransferManagerFactory.getTitle.call(),
                            "Count Transfer Manager",
                            "Wrong Module added");
                assert.equal(await I_CountTransferManagerFactory.getInstructions.call(),
                            "Allows an issuer to restrict the total number of non-zero token holders",
                            "Wrong Module added");

            });

            it("Should get the tags of the factory", async() => {
                let tags = await I_CountTransferManagerFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Count");
            });
        });

    });

});
