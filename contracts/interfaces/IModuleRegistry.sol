pragma solidity ^0.4.23;


//Simple interface that any module contracts should implement
contract IModuleRegistry {

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external;

    function registerModule(address _moduleFactory) external returns(bool);

    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]);

}
