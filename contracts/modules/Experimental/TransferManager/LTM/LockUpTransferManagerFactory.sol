pragma solidity ^0.5.0;

import "./LockUpTransferManagerProxy.sol";
import "../../../UpgradableModuleFactory.sol";
import "./LockUpTransferManager.sol";

/**
 * @title Factory for deploying LockUpTransferManager module
 */
contract LockUpTransferManagerFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "LockUpTransferManager";
        title = "LockUp Transfer Manager";
        description = "Manage transfers using lock ups over time";
        typesData.push(2);
        tagsData.push("Lockup");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address lockUpTransferManager = address(new LockUpTransferManagerProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(lockUpTransferManager, _data);
        return lockUpTransferManager;
    }

}
