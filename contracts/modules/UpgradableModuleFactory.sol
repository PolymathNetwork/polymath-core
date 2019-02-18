pragma solidity ^0.5.0;

import "./ModuleFactory.sol";
import "../proxy/OwnedUpgradeabilityProxy.sol";

/**
 * @title Factory for deploying upgradable modules
 */
contract UpgradableModuleFactory is ModuleFactory {

    event LogicContractSet(string _version, address _logicContract, bytes _logicData);

    struct LogicContract {
        string version;
        address logicContract;
        bytes logicData;
    }

    // Mapping from version to logic contract
    mapping (uint256 => LogicContract) logicContracts;

    // Mapping from Security Token address to module version
    mapping (address => uint256) moduleVersions;

    // Mapping from Security Token address to module address
    mapping (address => address) modules;

    // Current version
    uint256 public latestVersion;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        string memory _version,
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        require(_logicContract != address(0), "Invalid address");
        logicContracts[latestVersion].logicContract = _logicContract;
        logicContracts[latestVersion].version = _version;
    }

    function setLogicContract(string calldata _version, address _logicContract, bytes calldata _logicData) external onlyOwner {
        require(keccak256(abi.encodePacked(_version)) != keccak256(abi.encodePacked(logicContracts[latestVersion].version)), "Same version");
        require(_logicContract != logicContracts[latestVersion].logicContract, "Same version");
        require(_logicContract != address(0), "Invalid address");
        latestVersion++;
        logicContracts[latestVersion].logicContract = _logicContract;
        logicContracts[latestVersion].logicData = _logicData;
        logicContracts[latestVersion].version = _version;
        emit LogicContractSet(_version, _logicContract, _logicData);
    }

    function upgrade() external {
        // Only allow issuers to upgrade in single step verisons to preserve upgradeToAndCall semantics
        uint256 newVersion = moduleVersions[msg.sender] + 1;
        require(newVersion <= latestVersion, "Incorrect version");
        OwnedUpgradeabilityProxy(address(uint160(modules[msg.sender]))).upgradeToAndCall(logicContracts[newVersion].version, logicContracts[newVersion].logicContract, logicContracts[newVersion].logicData);
        moduleVersions[msg.sender] = newVersion;
    }

    /**
     * @notice Used to initialize the module
     * @param _module Address of module
     * @param _data Data used for the intialization of the module factory variables
     */
    function _initializeModule(address _module, bytes memory _data) internal {
        super._initializeModule(_module, _data);
        modules[msg.sender] = _module;
    }

    /**
     * @notice Get the version related to the module factory
     */
    function version() external view returns(string memory) {
        return logicContracts[latestVersion].version;
    }

}
