pragma solidity ^0.4.21;

import "./GeneralPermissionManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract GeneralPermissionManagerFactory is IModuleFactory {

    function GeneralPermissionManagerFactory(address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes /* _data */) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()));
        return address(new GeneralPermissionManager(msg.sender));
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 1;
    }

    function getName() public view returns(bytes32) {
        return "GeneralPermissionManager";
    }

    function getDescription() public view returns(string) {
        return "Manage permissions within the Security Token and attached modules";
    }

    function getTitle() public  view returns(string) {
        return "General Permission Manager";
    }

    function getInstructions() public view returns(string) {
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.";
    }

}
