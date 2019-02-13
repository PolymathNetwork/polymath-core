pragma solidity ^0.5.0;

import "./ModuleFactory.sol";
import "../proxy/OwnedUpgradeabilityProxy.sol";

/**
 * @title Factory for deploying upgradable modules
 */
contract UpgradableModuleFactory is ModuleFactory {

    struct LogicContract {
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
    uint256 public currentVersion;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        require(_logicContract != address(0), "Invalid address");
        logicContracts[currentVersion].logicContract = _logicContract;
    }

    function setLogicContract(address _logicContract, bytes calldata _logicData) external onlyOwner {
        currentVersion++;
        require(_logicContract != address(0), "Invalid address");
        logicContracts[currentVersion].logicContract = _logicContract;
        logicContracts[currentVersion].logicData = _logicData;
    }

    event LogB(bytes _log);

    function upgrade() external {
        // Only allow issuers to upgrade in single step verisons to preserve upgradeToAndCall semantics
        uint256 newVersion = moduleVersions[msg.sender] + 1;
        require(newVersion <= currentVersion, "Incorrect version");
        emit LogB(logicContracts[newVersion].logicData);
        OwnedUpgradeabilityProxy(address(uint160(modules[msg.sender]))).upgradeToAndCall("", logicContracts[newVersion].logicContract, logicContracts[newVersion].logicData);
        moduleVersions[msg.sender] = newVersion;
    }

}
