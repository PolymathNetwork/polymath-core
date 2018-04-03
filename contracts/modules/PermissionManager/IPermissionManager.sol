pragma solidity ^0.4.18;

import '../../interfaces/IModule.sol';

contract IPermissionManager is IModule {

    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public returns(bool);

    function getDelegateDetails(address _delegate) view public returns(bytes32);

}
