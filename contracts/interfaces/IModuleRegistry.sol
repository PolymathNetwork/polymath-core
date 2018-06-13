pragma solidity ^0.4.23;


//Simple interface that any module contracts should implement
contract IModuleRegistry {

    /**
     * @dev Called by a security token to notify the registry it is using a module
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external;

    /**
    * @dev Called by a security token to notify the registry it is using a module
    * @param _moduleFactory is the address of the relevant module factory
    * @param _callingAddress is the address of the Security Token
    */
    function _useModule(address _moduleFactory, address _callingAddress) public;

    /**
     * @dev Called by moduleFactory owner to register new modules for SecurityToken to use
     * @param _moduleFactory is the address of the module factory to be registered
     */
    function registerModule(address _moduleFactory) external returns(bool);

    /**
     * @dev Use to get all the tags releated to the functionality of the Module Factory.
     * @param _moduleType Type of module
     */
    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]);

}
