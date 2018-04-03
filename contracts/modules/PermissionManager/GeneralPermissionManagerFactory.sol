pragma solidity ^0.4.18;

import './GeneralPermissionManager.sol';
import '../../interfaces/IModuleFactory.sol';

contract GeneralPermissionManagerFactory is IModuleFactory {

  function deploy(bytes /* _data */) external returns(address) {
    //polyToken.transferFrom(msg.sender, owner, getCost());
    return address(new GeneralPermissionManager(msg.sender));
  }

  function getCost() view external returns(uint256) {
    return 0;
  }

  function getType() view external returns(uint8) {
      return 1;
  }

  function getName() view external returns(bytes32) {
    return "GeneralPermissionManager";
  }

  function getDescription() view external returns(string) {
    return "Manage permissions within the Security Token and attached modules";
  }

  function getTitle() view external returns(string) {
    return "General Permission Manager";
  }

  function getInstructions() public view returns(string) {
    return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions. No initFunction required.";
  }

}
