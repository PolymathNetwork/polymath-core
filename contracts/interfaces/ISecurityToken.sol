pragma solidity ^0.4.21;

import "./IST20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract ISecurityToken is IST20, Ownable {

    uint8 public constant PERMISSIONMANAGER_KEY = 1;
    uint8 public constant TRANSFERMANAGER_KEY = 2;
    uint8 public constant STO_KEY = 3;

    //TODO: Factor out more stuff here
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool);

    function getModule(uint8 _moduleType, uint _moduleIndex) public view returns (bytes32, address, bool);

    function getModuleByName(uint8 _moduleType, bytes32 _name) public view returns (bytes32, address, bool);
}
