pragma solidity ^0.4.18;

import '../../interfaces/IDelegate.sol';

contract PermissionedDelegate is IDelegate {

  mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;

  mapping (address => bytes32) public delegateDetails;

  bytes32 public CHANGE_PERMISSION = "CHANGE_PERMISSION";

  function PermissionedDelegate(address _securityToken) public
  IModule(_securityToken)
  {
  }

  function getInitFunction() public returns(bytes4) {
    return bytes4(0);
  }

  function checkPermission(address _delegate, address _module, bytes32 _perm) public returns(bool) {
    require(delegateDetails[_delegate] != bytes32(0));
    return perms[_module][_delegate][_perm];
  }

  function addDelegate(address _delegate, bytes32 _details) public {
    delegateDetails[_delegate] = _details;
  }

  function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public withPerm(CHANGE_PERMISSION) returns(bool) {
    require(delegateDetails[_delegate] != bytes32(0));
    perms[_module][_delegate][_perm] = _valid;
  }

  function delegateDetails(address _delegate) public returns(bytes32) {
    return delegateDetails[_delegate];
  }

  function permissions() public returns(bytes32[]) {
    bytes32[] memory allPermissions = new bytes32[](1);
    allPermissions[0] = CHANGE_PERMISSION;
    return allPermissions;
  }

}
