pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external returns(bool);

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external returns(uint256);

    function registerModule(address _moduleFactory) external returns(bool);

}

//Simple interface that any module contracts should implement
interface IModuleFactory {

    //TODO: Add delegates to this
    //Should create an instance of the Module, or throw
    function deploy(address _owner, bytes _data) external returns(address);

    function getType() external returns(uint8);

    function getName() external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() external returns(uint256);

}

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
    function checkModule(address _moduleFactory) external returns(bool) {
        return (registry[_moduleFactory].moduleType != 0);
    }

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external returns(uint256) {
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