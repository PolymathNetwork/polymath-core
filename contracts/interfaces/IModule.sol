pragma solidity ^0.4.18;

import './ISecurityToken.sol';

//Simple interface that any module contracts should implement
contract IModule {

    function getInitFunction() public returns (bytes4);

    address public factory;

    address public securityToken;

    function IModule(address _securityToken) public {
      securityToken = _securityToken;
    }

    //Allows owner or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == ISecurityToken(securityToken).owner();
        require(isOwner || ISecurityToken(securityToken).checkPermission(address(this), msg.sender, _perm));
        _;
    }

    modifier onlyOwner {
      require(msg.sender == ISecurityToken(securityToken).owner());
      _;
    }

    function permissions() public returns(bytes32[]);
}
