pragma solidity ^0.4.18;

import './GeneralPermissionManager.sol';
import '../../interfaces/IModuleFactory.sol';

contract GeneralPermissionManagerFactory is IModuleFactory {

  function deploy(bytes /* _data */) external returns(address) {
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


}
