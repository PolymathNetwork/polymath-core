pragma solidity ^0.4.18;

import './interfaces/IModuleRegistry.sol';
import './interfaces/IModuleFactory.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

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

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external returns(bool) {
        bool inRegistry = registry[_moduleFactory] != 0;
        if (inRegistry) {
          reputation[_moduleFactory].push(msg.sender);
        }
        return inRegistry;
    }

    /**
    * @dev Called by Polymath to register new modules for SecurityToken to use
    * @param _moduleFactory is the address of the module factory to be registered
    */
    function registerModule(address _moduleFactory) external onlyOwner returns(bool) {
        require(registry[_moduleFactory] == 0);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(moduleFactory.getType() != 0);
        registry[_moduleFactory] = moduleFactory.getType();
        moduleList[moduleFactory.getType()].push(_moduleFactory);
        reputation[_moduleFactory] = new address[](0);
        return true;
    }


}
