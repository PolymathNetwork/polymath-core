pragma solidity ^0.4.24;

/**
 * @title Interface for the polymath module registry contract
 */
interface IModuleRegistry {

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
      * @notice remove the tag for specified Module Factory
      * @param _moduleType Type of module.
      * @param _removedTags List of tags
      */
    function removeTagByModuleType(uint8 _moduleType, bytes32[] _removedTags) external;

    /**
     * @notice Indicate if minting can be frozen permanently by issuers
     * @return bool
     */
    function freezeMintingAllowed() external view returns(bool);

}
