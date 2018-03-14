pragma solidity ^0.4.18;

import './interfaces/IModuleRegistry.sol';
import './interfaces/IModuleFactory.sol';

//Store registered modules
//Could initially be centrally controlled (only Polymath can register modules)
//and then over time move to a more decentralised version (modules can be registerd provided POLY holders agree)
contract ModuleRegistry is IModuleRegistry {

    struct ModuleReputation {
        uint8 score;
    }

    struct ModuleData {
        uint8 moduleType;
        bytes32 name;
        uint256 cost;
    }

    mapping (address => ModuleData) public registry;
    mapping (address => ModuleReputation) public reputation;

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external view returns(bool) {
        return (registry[_moduleFactory].moduleType != 0);
    }

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external view returns(uint256) {
        return registry[_moduleFactory].cost;
    }

    function registerModule(address _moduleFactory) external returns(bool) {
        require(registry[_moduleFactory].moduleType == 0);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(moduleFactory.getType() != 0);
        registry[_moduleFactory] = ModuleData(moduleFactory.getType(), moduleFactory.getName(), moduleFactory.getCost());
        return true;
    }
}
