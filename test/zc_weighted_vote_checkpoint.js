import latestTime from "./helpers/latestTime";
import {duration, promisifyLogWatch} from "./helpers/utils";
import { takeSnapshot,increaseTime, revertToSnapshot} from "./helpers/time";
import {catchRevert} from "./helpers/exceptions";
import {deployWeightedVoteCheckpoint, setUpPolymathNetwork} from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const WeightedVoteCheckpoint = artifacts.require("./WeightedVoteCheckpoint");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("WeightedVoteCheckpoint", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_temp;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_WeightedVoteCheckpointFactory;
    let P_WeightedVoteCheckpointFactory;
    let I_WeightedVoteCheckpoint;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_MRProxied;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    let snapId;
    
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const burnKey = 5;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];

        // ----------- POLYMATH NETWORK Configuration ------------

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


        // STEP 4: Deploy the WeightedVoteCheckpoint
        [I_WeightedVoteCheckpointFactory] = await deployWeightedVoteCheckpoint(account_polymath, I_MRProxied, 0);
        [P_WeightedVoteCheckpointFactory] = await deployWeightedVoteCheckpoint(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

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

        WeightedVoteCheckpointFactory:          ${I_WeightedVoteCheckpointFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("\t\t Test case for Weighted Vote Checkpoint module \n", async() => {

        describe("\t\t Attaching the Weighted vote checkpoint module \n", async() => {

            it("\t\t Should register the ticker before the generation of the security token \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._ticker, symbol);
            });
    
            it("\t\t Should generate the new security token with the same symbol as registered above \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
    
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, 0, { from: token_owner });
    
                // Verify the successful generation of the security token
                assert.equal(tx.logs[2].args._ticker, symbol, "SecurityToken doesn't get deployed");
    
                I_SecurityToken = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);
                stGetter = await STGetter.at(I_SecurityToken.address);
                const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
            });
    
            it("\t\t Should intialize the auto attached modules \n", async () => {
                let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
            });
        })

    })


});