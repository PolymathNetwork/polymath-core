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

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "LockUp";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
