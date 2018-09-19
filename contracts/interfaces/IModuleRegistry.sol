pragma solidity ^0.4.24;

/**
 * @title Interface for the Polymath Module Registry contract
 */
interface IModuleRegistry {

    /**
     * @notice Called by a security token to notify the registry it is using a module
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external;

    /**
     * @notice Called by the ModuleFactory owner to register new modules for SecurityToken to use
     * @param _moduleFactory is the address of the module factory to be registered
     */
    function registerModule(address _moduleFactory) external returns(bool);

    /**
     * @notice Called by the ModuleFactory owner or registry curator to delete a ModuleFactory
     * @param _moduleFactory is the address of the module factory to be deleted
     * @return bool
     */
    function removeModule(address _moduleFactory) external returns(bool);

    /**
     * @notice Use to get all the tags releated to the functionality of the Module Factory.
     * @param _moduleType Type of module
     */
    function getTagByModuleType(uint8 _moduleType) external view returns(bytes32[]);

    /**
    * @notice Called by Polymath to verify modules for SecurityToken to use.
    * @notice A module can not be used by an ST unless first approved/verified by Polymath
    * @notice (The only exception to this is that the author of the module is the owner of the ST)
    * @param _moduleFactory is the address of the module factory to be registered
    * @return bool
    */
    function verifyModule(address _moduleFactory, bool _verified) external returns(bool);

    /**
     * @notice Add the tag for specified Module Factory
     * @param _moduleType Type of module.
     * @param _tag List of tags
     */
    function addTagByModuleType(uint8 _moduleType, bytes32[] _tag) external;

     /**
      * @notice remove a tag for a Module Factory
      * @param _moduleType Type of module.
      * @param _removedTags List of tags
      */
    function removeTagByModuleType(uint8 _moduleType, bytes32[] _removedTags) external;

    /**
     * @notice Used to get the reputation of a Module Factory
     * @param _factoryAddress address of the Module Factory
     * @return address array which has the list of securityToken's uses that module factory
     */
    function getReputationOfFactory(address _factoryAddress) external view returns(address[]);

    /**
     * @notice Use to get the list of Module Factory addresses for a given module type
     * @param _moduleType Type of Module
     * @return address array thal contains the list of addresses of module factory contracts.
     */
    function getModuleListOfType(uint8 _moduleType) external view returns(address[]);

     /**
     * @notice Use to get the list of available Module factory addresses for a particular type
     * @param _moduleType Type of Module
     * @param _securityToken Address of securityToken
     * @return address array that contains the list of available addresses of module factory contracts.
     */
     function getAvailableModulesOfType(uint8 _moduleType, address _securityToken) external view returns (address[]);

}
