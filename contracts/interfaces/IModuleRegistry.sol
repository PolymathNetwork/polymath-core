pragma solidity ^0.4.18;


//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external;

    function registerModule(address _moduleFactory) external returns(bool);

}
