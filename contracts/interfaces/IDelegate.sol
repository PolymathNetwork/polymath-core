pragma solidity ^0.4.18;

import './IModule.sol';

contract IDelegate is IModule {

    function checkPermission(address _delgate, address _module, bytes32 _perm) external returns(bool);

    function changePermission(address _delgate, address _module, bytes32 _perm, bool _valid) external returns(bool);

    function delegateDetails(address _delgate) external returns(bool);

}
