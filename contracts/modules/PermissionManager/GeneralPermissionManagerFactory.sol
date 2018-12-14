pragma solidity ^0.4.24;

import "./GeneralPermissionManager.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralPermissionManager module
 */
contract GeneralPermissionManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_setupCost, _usageCost, _subscriptionCost)
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
    function deploy(bytes /* _data */) external returns(address) {
        _takeFee();
        address permissionManager = new GeneralPermissionManager(msg.sender);
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(permissionManager), getName(), address(this), msg.sender, setupCost, now);
        return permissionManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 1;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        /*solium-disable-next-line max-len*/
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values and attached using withPerm modifier to relevant functions. No initFunction required.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](0);
        return availableTags;
    }
}
