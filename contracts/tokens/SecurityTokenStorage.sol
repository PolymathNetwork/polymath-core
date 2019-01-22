pragma solidity ^0.5.0;

contract SecurityTokenStorage {

    uint8 constant PERMISSION_KEY = 1;
    uint8 constant TRANSFER_KEY = 2;
    uint8 constant MINT_KEY = 3;
    uint8 constant CHECKPOINT_KEY = 4;
    uint8 constant BURN_KEY = 5;

    uint256 public granularity;

    // Used to permanently halt controller actions
    bool public controllerDisabled = false;

    // Used to temporarily halt all transactions
    bool public transfersFrozen;

    // Value of current checkpoint
    uint256 public currentCheckpointId;

    // Records added modules - module list should be order agnostic!
    mapping(uint8 => address[]) modules;

    // Records information about the module
    mapping(address => ModuleData) modulesToData;

    // Records added module names - module list should be order agnostic!
    mapping(bytes32 => address[]) names;

    // Map each investor to a series of checkpoints
    mapping(address => Checkpoint[]) checkpointBalances;

    // List of checkpoints that relate to total supply
    Checkpoint[] checkpointTotalSupply;

    // Times at which each checkpoint was created
    uint256[] checkpointTimes;

    //////////////////////////
    /// Document datastructure
    //////////////////////////

    struct Document {
        bytes32 docHash; // Hash of the document
        uint256 lastModified; // Timestamp at which document details was last modified
        string uri; // URI of the document that exist off-chain
    }

    // Used to hold the semantic version data
    struct SemanticVersion {
        uint8 major;
        uint8 minor;
        uint8 patch;
    }

    // Struct for module data
    struct ModuleData {
        bytes32 name;
        address module;
        address moduleFactory;
        bool isArchived;
        uint8[] moduleTypes;
        uint256[] moduleIndexes;
        uint256 nameIndex;
        bytes32 label;
    }

    // Structures to maintain checkpoints of balances for governance / dividends
    struct Checkpoint {
        uint256 checkpointId;
        uint256 value;
    }

    struct InvestorDataStorage {
        // List of investors who have ever held a non-zero token balance
        mapping(address => bool) investorListed;
        // List of token holders
        address[] investors;
        // Total number of non-zero token holders
        uint256 investorCount;
    }

    InvestorDataStorage investorData;

    SemanticVersion securityTokenVersion;

    // off-chain data
    string public tokenDetails;

    // mapping to store the documents details in the document
    mapping(bytes32 => Document) internal _documents;
    // mapping to store the document name indexes
    mapping(bytes32 => uint256) internal _docIndexes;
    // Array use to store all the document name present in the contracts
    bytes32[] _docNames;
    
    
    // Variable which tells whether issuance is ON or OFF forever
    // Implementers need to implement one more function to reset the value of `issuance` variable
    // to false. That function is not a part of the standard (EIP-1594) as it is depend on the various factors
    // issuer, followed compliance rules etc. So issuers have the choice how they want to close the issuance. 
    bool internal issuance = true;

    // Address of the controller which is a delegated entity
    // set by the issuer/owner of the token
    address public controller;

    address public polymathRegistry;
    address public moduleRegistry;
    address public securityTokenRegistry;
    address public featureRegistry;
    address public polyToken;

    address public delegate;

    bytes32 constant LOCKED = "LOCKED";
    bytes32 constant UNLOCKED = "UNLOCKED";

}