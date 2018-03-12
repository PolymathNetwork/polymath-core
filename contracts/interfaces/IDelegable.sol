pragma solidity ^0.4.18;

interface IDelegable {

    function grantPermission(address _delegate, address _module) public;

    /// WIP
    function checkPermissions(address _module, address _delegate) public;

}