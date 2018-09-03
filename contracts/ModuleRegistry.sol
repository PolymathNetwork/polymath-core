pragma solidity ^0.4.24;

import "./interfaces/IModuleRegistry.sol";
import "./interfaces/IModuleFactory.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./interfaces/IFeatureRegistry.sol";
import "./Pausable.sol";
import "./RegistryUpdater.sol";
import "./ReclaimTokens.sol";

/**
* @title Registry contract to store registered modules
* @notice Anyone can register modules, but only those "approved" by Polymath will be available for issuers to add
*/
contract ModuleRegistry is IModuleRegistry, Pausable, RegistryUpdater, ReclaimTokens {

    // Mapping used to hold the type of module factory corresponds to the address of the Module factory contract
    mapping (address => uint8) public registry;
    // Mapping used to hold the reputation of the factory
    mapping (address => address[]) public reputation;
    // Mapping contain the list of addresses of Module factory for a particular type
    mapping (uint8 => address[]) public moduleList;
    // Mapping to store the index of the moduleFactory in the moduleList
    mapping(address => uint8) private moduleListIndex;
    // contains the list of verified modules
    mapping (address => bool) public verified;
    // Contains the list of the available tags corresponds to the module type
    mapping (uint8 => bytes32[]) public availableTags;

    // Emit when Module been used by the securityToken
    event LogModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
    // Emit when the Module Factory get registered with the ModuleRegistry contract
    event LogModuleRegistered(address indexed _moduleFactory, address indexed _owner);
    // Emit when the module get verified by the Polymath team
    event LogModuleVerified(address indexed _moduleFactory, bool _verified);
    // Emit when a moduleFactory is removed by Polymath or moduleFactory owner
    event LogModuleRemoved(address indexed _moduleFactory, address indexed _decisionMaker);

    constructor (address _polymathRegistry) public
        RegistryUpdater(_polymathRegistry)
    {
    }

    /**
     * @notice Called by a security token to check if the ModuleFactory is verified or appropriate custom module
     * @dev ModuleFactory reputation increases by one every time it is deployed
     * @dev Any module can be added during token creation without being registered if it is defined in the token proxy deployment contract
     * @dev The feature switch for custom modules is labelled "customModulesAllowed"
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external {
        // This if statement is required to be able to add modules from the token proxy contract during deployment
        if (ISecurityTokenRegistry(securityTokenRegistry).isSecurityToken(msg.sender)) {
            if (IFeatureRegistry(featureRegistry).getFeatureStatus("customModulesAllowed")) {
                require(verified[_moduleFactory]||(Ownable(_moduleFactory).owner() == Ownable(msg.sender).owner()),
                  "ModuleFactory must be verified or SecurityToken owner must be ModuleFactory owner");
            } else {
                require(verified[_moduleFactory], "ModuleFactory must be verified");
            }
            require(registry[_moduleFactory] != 0, "ModuleFactory type should not be 0");
            reputation[_moduleFactory].push(msg.sender);
            emit LogModuleUsed(_moduleFactory, msg.sender);
        }
    }

    /**
     * @notice Called by moduleFactory owner to register new modules for SecurityToken to use
     * @param _moduleFactory is the address of the module factory to be registered
     * @return bool
     */
    function registerModule(address _moduleFactory) external whenNotPaused returns(bool) {
        require(registry[_moduleFactory] == 0, "Module factory should not be pre-registered");
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8 moduleType = moduleFactory.getType();
        require(moduleType != 0, "Factory moduleType should not equal to 0");
        registry[_moduleFactory] = moduleType;
        moduleListIndex[_moduleFactory] = uint8(moduleList[moduleType].length);
        moduleList[moduleType].push(_moduleFactory);
        reputation[_moduleFactory] = new address[](0);
        emit LogModuleRegistered (_moduleFactory, Ownable(_moduleFactory).owner());
        return true;
    }

    /**
     * @notice Called by moduleFactory owner or registry curator to delete a moduleFactory
     * @param _moduleFactory is the address of the module factory to be deleted
     * @return bool
     */
    function removeModule(address _moduleFactory) external whenNotPaused returns(bool) {
        uint8 moduleType = registry[_moduleFactory];

        require(moduleType != 0, "Module factory should be registered");
        require(msg.sender == Ownable(_moduleFactory).owner() || msg.sender == owner,
            "msg.sender must be moduleFactory owner or registry curator");

        uint8 index = moduleListIndex[_moduleFactory];
        uint8 last = uint8(moduleList[moduleType].length - 1);
        address temp = moduleList[moduleType][last];

        // pop from array and re-order
        if (index != last) {
            moduleList[moduleType][index] = temp;
            moduleListIndex[temp] = index;
        }
        delete moduleList[moduleType][last];
        moduleList[moduleType].length--;

        delete registry[_moduleFactory];
        delete reputation[_moduleFactory];
        delete verified[_moduleFactory];
        delete moduleListIndex[_moduleFactory];

        emit LogModuleRemoved (_moduleFactory, msg.sender);
        return true;
    }

    /**
    * @notice Called by Polymath to verify modules for SecurityToken to use.
    * @notice A module can not be used by an ST unless first approved/verified by Polymath
    * @notice (The only exception to this is that the author of the module is the owner of the ST)
    * @param _moduleFactory is the address of the module factory to be registered
    * @return bool
    */
    function verifyModule(address _moduleFactory, bool _verified) external onlyOwner returns(bool) {
        //Must already have been registered
        require(registry[_moduleFactory] != 0, "Module factory should have been already registered");
        verified[_moduleFactory] = _verified;
        emit LogModuleVerified(_moduleFactory, _verified);
        return true;
    }

    /**
     * @notice Add the tag for specified Module Factory
     * @param _moduleType Type of module.
     * @param _tag List of tags
     */
    function addTagByModuleType(uint8 _moduleType, bytes32[] _tag) external onlyOwner {
         for (uint8 i = 0; i < _tag.length; i++) {
             availableTags[_moduleType].push(_tag[i]);
         }
     }

    /**
     * @notice remove the tag for specified Module Factory
     * @param _moduleType Type of module.
     * @param _removedTags List of tags
     */
    function removeTagByModuleType(uint8 _moduleType, bytes32[] _removedTags) external onlyOwner {
        for (uint8 i = 0; i < availableTags[_moduleType].length; i++) {
            for (uint8 j = 0; j < _removedTags.length; j++) {
                if (availableTags[_moduleType][i] == _removedTags[j]) {
                    delete availableTags[_moduleType][i];
                }
            }
        }
    }

    /**
     * @notice Use to get all the tags releated to the functionality of the Module Factory.
     * @param _moduleType Type of module
     * @return bytes32 array
     */
    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]) {
        return availableTags[_moduleType];
    }

    /**
     * @notice Use to get the reputation of the Module factory
     * @param _factoryAddress Ethereum contract address of the module factory
     * @return address array which have the list of securityToken's uses that module factory
     */
    function getReputationOfFactory(address _factoryAddress) public view returns(address[]) {
        return reputation[_factoryAddress];
    }

    /**
     * @notice Use to get the list of addresses of Module factory for a particular type
     * @param _moduleType Type of Module
     * @return address array thal contains the lis of addresses of module factory contracts.
     */
    function getModuleListOfType(uint8 _moduleType) public view returns(address[]) {
        return moduleList[_moduleType];
    }

    /**
     * @notice pause registration function
     */
    function unpause() public onlyOwner  {
        _unpause();
    }

    /**
     * @notice unpause registration function
     */
    function pause() public onlyOwner {
        _pause();
    }


}
