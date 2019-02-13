pragma solidity ^0.5.0;

import "../ModuleFactory.sol";
import "../../proxy/GeneralPermissionManagerProxy.sol";

/**
 * @title Factory for deploying GeneralPermissionManager module
 */
contract GeneralPermissionManagerFactory is ModuleFactory {

    address public logicContract;

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
        ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        require(_logicContract != address(0), "Invalid address");
        version = "1.0.0";
        name = "GeneralPermissionManager";
        title = "General Permission Manager";
        description = "Manage permissions within the Security Token and attached modules";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata /* _data */
    )
        external
        returns(address)
    {
        address polyToken = _takeFee();
        address permissionManager = address(new GeneralPermissionManagerProxy(msg.sender, polyToken, logicContract));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(permissionManager, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return permissionManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 1;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        /*solium-disable-next-line max-len*/
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values and attached using withPerm modifier to relevant functions. No initFunction required.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](0);
        return availableTags;
    }
}
