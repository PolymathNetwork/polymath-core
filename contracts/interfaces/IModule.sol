pragma solidity ^0.4.18;

import './ISecurityToken.sol';
import './IModuleFactory.sol';

//Simple interface that any module contracts should implement
contract IModule {

    function getInitFunction() public returns (bytes4);

    address public factory;

    address public securityToken;

    function IModule(address _securityToken) public {
      securityToken = _securityToken;
      factory = msg.sender;
    }

    //Allows owner, factory or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == ISecurityToken(securityToken).owner();
        bool isFactory = msg.sender == factory;
        require(isOwner || isFactory || ISecurityToken(securityToken).checkPermission(msg.sender, address(this), _perm));
        _;
    }

    modifier onlyOwner {
      require(msg.sender == ISecurityToken(securityToken).owner());
      _;
    }

    modifier onlyFactory {
      require(msg.sender == factory);
      _;
    }

    modifier onlyFactoryOwner {
      require(msg.sender == IModuleFactory(factory).owner());
      _;
    }

    function permissions() public returns(bytes32[]);
}
