pragma solidity ^0.4.18;

interface IDelegable {

     /**
     * @dev Grant the permission to the delegate corresponds to the particular module
     * @param _delegate Ethereum address of the delegate
     * @param _module Address of the module contract
     * @param _signatures Function signatures of the module contract function. 
     */
    function grantPermission(address _delegate, address _module, bytes4[] _signatures) public;

    /**
     * @dev Revoke the permissions from the delegate
     * @param _delegate Ethereum address of the delegate from whom the permission will get revoked
     * @param _module Contract address of the module
     */
    function revokePermission(address _delegate, address _module) public;

     /**
     * @dev Check the permissions granted to the given delegate
     * @param _delegate Ethereum address of the delegate
     * @param _module Contract address of the module
     * @param _signature Function signature of the contract
     */
    function checkPermissions(address _delegate, address _module, bytes4 _signature) view public returns(bool);

}