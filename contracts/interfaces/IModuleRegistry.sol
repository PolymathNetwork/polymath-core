pragma solidity ^0.4.24;

/**
 * @title Interface for the polymath module registry contract
 */
contract IModuleRegistry {

    /**
     * @notice Called by a security token to notify the registry it is using a module
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external;

    /**
     * @notice Called by moduleFactory owner to register new modules for SecurityToken to use
     * @param _moduleFactory is the address of the module factory to be registered
     */
    function registerModule(address _moduleFactory) external returns(bool);

    /**
     * @notice Use to get all the tags releated to the functionality of the Module Factory.
     * @param _moduleType Type of module
     */
    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]);

    /**
     * @notice Use to get the reputation of the Module factory
     * @param _factoryAddress Ethereum contract address of the module factory
     * @return address array which have the list of securityToken's uses that module factory 
     */
    function getReputationOfFactory(address _factoryAddress) public view returns(address[]);

    /**
     * @notice Use to get the list of addresses of Module factory for a particular type
     * @param _moduleType Type of Module
     * @return address array thal contains the lis of addresses of module factory contracts.
     */
    function getModuleListOfType(uint8 _moduleType) public view returns(address[]);

}
