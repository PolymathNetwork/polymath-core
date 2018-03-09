pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external returns(bool);

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external returns(uint256);

    function registerModule(address _moduleFactory) external returns(bool);

}
