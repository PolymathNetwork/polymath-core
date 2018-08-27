pragma solidity ^0.4.24;

import "./GeneralPermissionManager.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralPermissionManager module
 */
contract GeneralPermissionManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {   
        version = "1.0.0";
        name = "GeneralPermissionManager";
        title = "General Permission Manager";
        description = "Manage permissions within the Security Token and attached modules";
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        address permissionManager = new GeneralPermissionManager(msg.sender, address(polyToken));
        emit LogGenerateModuleFromFactory(address(permissionManager), getName(), address(this), msg.sender, setupCost, now);
        return permissionManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 1;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return name;
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return description;
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public  view returns(string) {
        return title;
    }

    /**
     * @notice Get the version of the Module
     */
    function getVersion() public view returns(string) {
        return version;
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](0);
        return availableTags;
    }
}
