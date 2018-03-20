pragma solidity ^0.4.18;

import './PermissionedDelegateManager.sol';
import '../../interfaces/IModuleFactory.sol';

contract PermissionedDelegateFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
    return address(new PermissionedDelegateManager(_owner, _data, msg.sender));
  }

  function getCost() view external returns(uint256) {
    return 0;
  }

  function getType() view external returns(uint8) {
      return 0;
  }

  function getName() view external returns(bytes32) {
    return "PermissionedDelegateManager";
  }


}
