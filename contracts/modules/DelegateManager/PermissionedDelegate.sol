pragma solidity ^0.4.18;

import '../../interfaces/IDelegate.sol';

contract PermissionedDelegate is IDelegate {

  mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;

  function PermissionedDelegate(address _securityToken)
    IModule(_securityToken)
  {
  }

  function checkPermission(address _delgate, address _module, bytes32 _perm) external returns(bool);

  function changePermission(address _delgate, address _module, bytes32 _perm, bool _valid) external onlyOwner returns(bool) {
    perms[_module][_delegate][_permission] = true;
  }

  function delegateDetails(address _delgate) external returns(bool);

}
