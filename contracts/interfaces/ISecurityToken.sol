pragma solidity ^0.4.18;

import './IST20.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract ISecurityToken is IST20, Ownable {

    function checkPermission(address _module, address _delegate, bytes32 _perm) public returns(bool);

}
