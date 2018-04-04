pragma solidity ^0.4.18;

import "./interfaces/IModuleRegistry.sol";
import "./interfaces/IModuleFactory.sol";
import "./interfaces/ISecurityToken.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
* @title ModuleRegistry
* @notice Stores registered modules
* Could initially be centrally controlled (only Polymath can register modules)
* and then over time move to a more decentralised version (modules can be registerd provided POLY holders agree)
*/

contract ModuleRegistry is IModuleRegistry, Ownable {

    mapping (address => uint8) public registry;
    mapping (address => address[]) public reputation;
    mapping (uint8 => address[]) public moduleList;
    mapping (address => bool) public verified;

    address public securityTokenRegistry;

    event LogModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
    event LogModuleRegistered(address indexed _moduleFactory, address indexed _owner);
    event LogModuleVerified(address indexed _moduleFactory, bool _verified);

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external {
        //msg.sender must be a security token - below will throw if not
        ISecurityTokenRegistry(securityTokenRegistry).getSecurityTokenData(msg.sender);
        require(registry[_moduleFactory] != 0);
        //To use a module, either it must be verified, or owned by the ST owner
        require(verified[_moduleFactory]||(IModuleFactory(_moduleFactory).owner() == ISecurityToken(msg.sender).owner()));
        reputation[_moduleFactory].push(msg.sender);
        LogModuleUsed(_moduleFactory, msg.sender);
    }

    /**
    * @dev Called by moduleFactory owner to register new modules for SecurityToken to use
    * @param _moduleFactory is the address of the module factory to be registered
    */
    function registerModule(address _moduleFactory) external returns(bool) {
        require(registry[_moduleFactory] == 0);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(moduleFactory.getType() != 0);
        registry[_moduleFactory] = moduleFactory.getType();
        moduleList[moduleFactory.getType()].push(_moduleFactory);
        reputation[_moduleFactory] = new address[](0);
        LogModuleRegistered(_moduleFactory, moduleFactory.owner());
        return true;
    }

    /**
    * @dev Called by Polymath to verify modules for SecurityToken to use
    * @param _moduleFactory is the address of the module factory to be registered
    */
    function verifyModule(address _moduleFactory, bool _verified) external onlyOwner returns(bool) {
        //Must already have been registered
        require(registry[_moduleFactory] != 0);
        verified[_moduleFactory] = _verified;
        LogModuleVerified(_moduleFactory, _verified);
        return true;
    }

    //Sets the securityTokenRegistry so that moduleRegistry can validate security tokens are genuine
    function setTokenRegistry(address _securityTokenRegistry) public onlyOwner {
        require(_securityTokenRegistry != address(0));
        securityTokenRegistry = _securityTokenRegistry;
    }

}
