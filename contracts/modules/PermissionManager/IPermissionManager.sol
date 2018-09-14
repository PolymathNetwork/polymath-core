pragma solidity ^0.4.24;

/**
 * @title Interface to be implemented by all permission manager modules
 */
interface IPermissionManager {

    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) external returns(bool);

}
