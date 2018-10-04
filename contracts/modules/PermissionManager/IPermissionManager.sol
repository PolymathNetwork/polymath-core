pragma solidity ^0.4.24;

/**
 * @title Interface to be implemented by all permission manager modules
 */
interface IPermissionManager {

    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool);

    function getPermissions() external view returns(bytes32[]);

    function getAllDelegates() external view returns(address[]);

    function checkDelegate(address _potentialDelegate) external view returns(bool);

    function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view returns(address[]);

    function getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types, address _tokenAddress) public view returns(address[], bytes32[]);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) external returns(bool);

}
