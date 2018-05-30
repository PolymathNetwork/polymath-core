pragma solidity ^0.4.23;

import "./GeneralPermissionManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract GeneralPermissionManagerFactory is IModuleFactory {

    /**
     * @dev Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress) public
    IModuleFactory(_polyAddress)
    {

    }

    /**
     * @dev used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new GeneralPermissionManager(msg.sender, address(polyToken)));
    }

    /**
     * @dev Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 1;
    }

    /**
     * @dev Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "GeneralPermissionManager";
    }

    /**
     * @dev Get the description of the Module 
     */
    function getDescription() public view returns(string) {
        return "Manage permissions within the Security Token and attached modules";
    }

    /**
     * @dev Get the title of the Module
     */
    function getTitle() public  view returns(string) {
        return "General Permission Manager";
    }

    /**
     * @dev Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.";
    }

    /**
     * @dev Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](1);
        return availableTags;
    }
}
