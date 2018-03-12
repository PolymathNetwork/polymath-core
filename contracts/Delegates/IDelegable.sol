pragma solidity ^0.4.18;

interface IDelegable {

    function grantPermission(uint256[] _permission, address _entity, address _delegate);

    /// WIP
    function _checkPermissions(address _entity, bytes32 _permission);

}