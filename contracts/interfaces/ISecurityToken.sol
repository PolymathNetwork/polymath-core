pragma solidity ^0.4.18;

import './IST20.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract ISecurityToken is IST20, Ownable {

    //TODO: Factor out more stuff here
    function checkPermission(address _delegate, address _module, bytes32 _perm) public returns(bool);

}
