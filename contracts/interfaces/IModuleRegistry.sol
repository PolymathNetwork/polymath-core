pragma solidity ^0.5.0;

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
    function registerModule(address _moduleFactory) external;

    /**
     * @notice Called by the ModuleFactory owner or registry curator to delete a ModuleFactory
     * @param _moduleFactory is the address of the module factory to be deleted
     */
    function removeModule(address _moduleFactory) external;

    /**
    * @notice Called by Polymath to verify modules for SecurityToken to use.
    * @notice A module can not be used by an ST unless first approved/verified by Polymath
    * @notice (The only exception to this is that the author of the module is the owner of the ST - Only if enabled by the FeatureRegistry)
    * @param _moduleFactory is the address of the module factory to be registered
    */
    function verifyModule(address _moduleFactory, bool _verified) external;

    /**
     * @notice Used to get the reputation of a Module Factory
     * @param _factoryAddress address of the Module Factory
     * @return address array which has the list of securityToken's uses that module factory
     */
    function getReputationByFactory(address _factoryAddress) external view returns(address[] memory);

    /**
     * @notice Returns all the tags related to the a module type which are valid for the given token
     * @param _moduleType is the module type
     * @param _securityToken is the token
     * @return list of tags
     * @return corresponding list of module factories
     */
    function getTagsByTypeAndToken(uint8 _moduleType, address _securityToken) external view returns(bytes32[] memory, address[] memory);

    /**
     * @notice Returns all the tags related to the a module type which are valid for the given token
     * @param _moduleType is the module type
     * @return list of tags
     * @return corresponding list of module factories
     */
    function getTagsByType(uint8 _moduleType) external view returns(bytes32[] memory, address[] memory);

    /**
     * @notice Returns the list of addresses of Module Factory of a particular type
     * @param _moduleType Type of Module
     * @return address array that contains the list of addresses of module factory contracts.
     */
    function getModulesByType(uint8 _moduleType) external view returns(address[] memory);

    /**
     * @notice Returns the list of available Module factory addresses of a particular type for a given token.
     * @param _moduleType is the module type to look for
     * @param _securityToken is the address of SecurityToken
     * @return address array that contains the list of available addresses of module factory contracts.
     */
    function getModulesByTypeAndToken(uint8 _moduleType, address _securityToken) external view returns(address[] memory);

    /**
     * @notice Use to get the latest contract address of the regstries
     */
    function updateFromRegistry() external;

    /**
     * @notice Get the owner of the contract
     * @return address owner
     */
    function owner() external view returns(address);

    /**
     * @notice Check whether the contract operations is paused or not
     * @return bool 
     */
    function isPaused() external view returns(bool);

}
