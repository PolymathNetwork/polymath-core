pragma solidity ^0.5.0;

import "../UpgradableModuleFactory.sol";
import "../../proxy/GeneralPermissionManagerProxy.sol";

/**
 * @title Factory for deploying GeneralPermissionManager module
 */
contract GeneralPermissionManagerFactory is UpgradableModuleFactory {

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
        public
        UpgradableModuleFactory(_setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        version = "1.0.0";
        name = "GeneralPermissionManager";
        title = "General Permission Manager";
        description = "Manage permissions within the Security Token and attached modules";
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
        address permissionManager = address(new GeneralPermissionManagerProxy(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(permissionManager, _data);
        return permissionManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 1;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](0);
        return availableTags;
    }
}
