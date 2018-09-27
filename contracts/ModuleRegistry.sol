pragma solidity ^0.4.24;

import "./interfaces/IModuleRegistry.sol";
import "./interfaces/IModuleFactory.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./interfaces/IPolymathRegistry.sol";
import "./interfaces/IFeatureRegistry.sol";
import "./interfaces/IERC20.sol";
import "./libraries/VersionUtils.sol";
import "./storage/EternalStorage.sol";
import "./libraries/Encoder.sol";
import "./interfaces/IOwnable.sol";
import "./interfaces/ISecurityToken.sol";

/**
* @title Registry contract to store registered modules
* @notice Only Polymath can register and verify module factories to make them available for issuers to attach.
*/
contract ModuleRegistry is IModuleRegistry, EternalStorage {
    /*
        // Mapping used to hold the type of module factory corresponds to the address of the Module factory contract
        mapping (address => uint8) public registry;

        // Mapping used to hold the reputation of the factory
        mapping (address => address[]) public reputation;

        // Mapping containing the list of addresses of Module Factories of a particular type
        mapping (uint8 => address[]) public moduleList;

        // Mapping to store the index of the Module Factory in the moduleList
        mapping(address => uint8) private moduleListIndex;

        // contains the list of verified modules
        mapping (address => bool) public verified;

        // Contains the list of the available tags corresponding to each module type
        mapping (uint8 => bytes32[]) public availableTags;
    */

    ///////////
    // Events
    //////////

    // Emit when network becomes paused
    event Pause(uint256 _timestammp);
     // Emit when network becomes unpaused
    event Unpause(uint256 _timestamp);
    // Emit when Module is used by the SecurityToken
    event ModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
    // Emit when the Module Factory gets registered on the ModuleRegistry contract
    event ModuleRegistered(address indexed _moduleFactory, address indexed _owner);
    // Emit when the module gets verified by Polymath
    event ModuleVerified(address indexed _moduleFactory, bool _verified);
    // Emit when a ModuleFactory is removed by Polymath
    event ModuleRemoved(address indexed _moduleFactory, address indexed _decisionMaker);

    ///////////////
    //// Modifiers
    ///////////////

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == getAddress(Encoder.getKey("owner")));
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        if (msg.sender == getAddress(Encoder.getKey("owner"))) 
          _;
        else {
            require(!getBool(Encoder.getKey("paused")), "Already paused");
            _;
        }
    }

    /**
     * @notice Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(getBool(Encoder.getKey("paused")), "Should not be paused");
        _;
    }

    /////////////////////////////
    // Initialization
    /////////////////////////////

    // Constructor
    constructor () public
    {

    }

    function initialize(address _polymathRegistry, address _owner) external payable {
        require(!getBool(Encoder.getKey("initialised")));
        require(_owner != address(0) && _polymathRegistry != address(0), "0x address is in-valid");
        set(Encoder.getKey("polymathRegistry"), _polymathRegistry);
        set(Encoder.getKey("owner"), _owner);
        set(Encoder.getKey("initialised"), true);
    }

    /**
     * @notice Called by a SecurityToken to check if the ModuleFactory is verified or appropriate custom module
     * @dev ModuleFactory reputation increases by one every time it is deployed(used) by a ST.
     * @dev Any module can be added during token creation without being registered if it is defined in the token proxy deployment contract
     * @dev The feature switch for custom modules is labelled "customModulesAllowed"
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external {
        // This if statement is required to be able to add modules from the token proxy contract during deployment
        if (ISecurityTokenRegistry(getAddress(Encoder.getKey('securityTokenRegistry'))).isSecurityToken(msg.sender)) {
            if (IFeatureRegistry(getAddress(Encoder.getKey('featureRegistry'))).getFeatureStatus("customModulesAllowed")) {
                require(getBool(Encoder.getKey('verified', _moduleFactory)) || IOwnable(_moduleFactory).owner() == IOwnable(msg.sender).owner(),
                "ModuleFactory must be verified or SecurityToken owner must be ModuleFactory owner");
            } else {
                require(getBool(Encoder.getKey('verified', _moduleFactory)), "ModuleFactory must be verified");
            }
            uint8[] memory _latestVersion = ISecurityToken(msg.sender).getVersion();
            uint8[] memory _lowerBound = IModuleFactory(_moduleFactory).getLowerSTVersionBounds();
            uint8[] memory _upperBound = IModuleFactory(_moduleFactory).getUpperSTVersionBounds();
            require(VersionUtils.compareLowerBound(_lowerBound, _latestVersion), "Version should not be below the lower bound of ST version requirement");
            require(VersionUtils.compareUpperBound(_upperBound, _latestVersion), "Version should not be above the upper bound of ST version requirement");
            require(getUint(Encoder.getKey('registry',_moduleFactory)) != 0, "ModuleFactory type should not be 0");
            pushArray(Encoder.getKey('reputation', _moduleFactory), msg.sender);
            emit ModuleUsed(_moduleFactory, msg.sender);
        }
    }

    /**
     * @notice Called by the ModuleFactory owner to register new modules for SecurityTokens to use
     * @param _moduleFactory is the address of the module factory to be registered
     */
    function registerModule(address _moduleFactory) external whenNotPaused {
        require(getUint(Encoder.getKey('registry', _moduleFactory)) == 0, "Module factory should not be pre-registered");
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8 moduleType = moduleFactory.getType();
        require(moduleType != 0, "Factory moduleType should not equal to 0");
        set(Encoder.getKey('registry', _moduleFactory), uint256(moduleType));
        set(Encoder.getKey('moduleListIndex', _moduleFactory), uint256(getArrayAddress(Encoder.getKey('moduleList', uint256(moduleType))).length));
        pushArray(Encoder.getKey('moduleList', uint256(moduleType)), _moduleFactory);
        emit ModuleRegistered (_moduleFactory, IOwnable(_moduleFactory).owner());
    }

    /**
     * @notice Called by the ModuleFactory owner or registry curator to delete a ModuleFactory from the registry
     * @param _moduleFactory is the address of the module factory to be deleted from the registry
     */
    function removeModule(address _moduleFactory) external whenNotPaused {
        uint256 moduleType = getUint(Encoder.getKey('registry', _moduleFactory));

        require(moduleType != 0, "Module factory should be registered");
        require(msg.sender == IOwnable(_moduleFactory).owner() || msg.sender == getAddress(Encoder.getKey('owner')),
        "msg.sender must be the Module Factory owner or registry curator");

        uint256 index = getUint(Encoder.getKey('moduleListIndex', _moduleFactory));
        uint256 last = getArrayAddress(Encoder.getKey('moduleList', moduleType)).length - 1;
        address temp = getArrayAddress(Encoder.getKey('moduleList', moduleType))[last];

        // pop from array and re-order
        if (index != last) {
            // moduleList[moduleType][index] = temp;
            setArrayIndexValue(Encoder.getKey('moduleList', moduleType), index, temp); 
            set(Encoder.getKey('moduleListIndex', temp), index);
        }
        deleteArrayAddress(Encoder.getKey('moduleList', moduleType), last);

        // delete registry[_moduleFactory];
        set(Encoder.getKey('registry', _moduleFactory), uint256(0));
        // delete reputation[_moduleFactory];
        setArray(Encoder.getKey('reputation', _moduleFactory), new address[](0));
        // delete verified[_moduleFactory];
        set(Encoder.getKey('verified', _moduleFactory), false);
        // delete moduleListIndex[_moduleFactory];
        set(Encoder.getKey('moduleListIndex', _moduleFactory), uint256(0));
        emit ModuleRemoved(_moduleFactory, msg.sender);
    }

    /**
    * @notice Called by Polymath to verify Module Factories for SecurityTokens to use.
    * @notice A module can not be used by an ST unless first approved/verified by Polymath
    * @notice (The only exception to this is that the author of the module is the owner of the ST)
    * @notice -> Only if Polymath enabled the feature.
    * @param _moduleFactory is the address of the module factory to be verified
    * @return bool
    */
    function verifyModule(address _moduleFactory, bool _verified) external onlyOwner returns(bool) {
        require(getUint(Encoder.getKey('registry', _moduleFactory)) != uint256(0), "Module factory must be registered");
        set(Encoder.getKey('verified', _moduleFactory), _verified);
        emit ModuleVerified(_moduleFactory, _verified);
        return true;
    }

    /**
     * @notice Adds a list of tags for the specified Module Factory
     * @dev This function is susceptible to hit the block gas limit if too many tags get added.
     * @param _moduleType is the module type.
     * @param _tag is the list of tags to add.
     */
    function addTagByModuleType(uint8 _moduleType, bytes32[] _tag) external onlyOwner {
         for (uint8 i = 0; i < _tag.length; i++) {
             pushArray(Encoder.getKey('availableTags', uint256(_moduleType)), _tag[i]);
         }
     }

    /**
     * @notice Removes the tag for specified Module Factory
     * @dev This function is susceptible to hit the block gas limit if too many tags get removed.
     * @param _moduleType is the module type.
     * @param _removedTags is the list of tags to remove
     */
    function removeTagByModuleType(uint8 _moduleType, bytes32[] _removedTags) external onlyOwner {
        for (uint8 i = 0; i < getArrayBytes32(Encoder.getKey('availableTags', uint256(_moduleType))).length; i++) {
            for (uint8 j = 0; j < _removedTags.length; j++) {
                if (getArrayBytes32(Encoder.getKey('availableTags', uint256(_moduleType)))[i] == _removedTags[j]) {
                    deleteArrayBytes32(Encoder.getKey('availableTags', uint256(_moduleType)), uint256(i));
                }
            }
        }
    }

    /**
     * @notice Returns all the tags related to the functionality of the entered Module Factory.
     * @param _moduleType is the module type
     * @return bytes32 array
     */
    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]) {
        return getArrayBytes32(Encoder.getKey('availableTags', uint256(_moduleType)));
    }

    /**
     * @notice Returns the reputation of the entered Module Factory
     * @param _factoryAddress is the address of the module factory
     * @return address array which contains the list of securityTokens that use that module factory
     */
    function getReputationOfFactory(address _factoryAddress) external view returns(address[]) {
        return getArrayAddress(Encoder.getKey('reputation', _factoryAddress));
    }

    /**
     * @notice Returns the list of addresses of Module Factory of a particular type
     * @param _moduleType Type of Module
     * @return address array that contains the list of addresses of module factory contracts.
     */
    function getModuleListOfType(uint8 _moduleType) external view returns(address[]) {
        return getArrayAddress(Encoder.getKey('moduleList', uint256(_moduleType)));
    }

    /**
     * @notice Returns the list of available Module factory addresses of a particular type for a given token.
     * @param _moduleType is the module type to look for
     * @param _securityToken is the address of SecurityToken
     * @return address array that contains the list of available addresses of module factory contracts.
     */
    function getAvailableModulesOfType(uint8 _moduleType, address _securityToken) external view returns (address[]) {
        uint256 _len = getArrayAddress(Encoder.getKey('moduleList', uint256(_moduleType))).length;
        address[] memory _addressList = getArrayAddress(Encoder.getKey('moduleList', uint256(_moduleType)));
        uint256 counter = 0;
        for (uint256 i = 0; i < _len; i++) {
            if (IFeatureRegistry(getAddress(Encoder.getKey('featureRegistry'))).getFeatureStatus("customModulesAllowed")) {
                if (IOwnable(_addressList[i]).owner() == IOwnable(_securityToken).owner() || getBool(Encoder.getKey('verified', _addressList[i])))
                    counter++;
            }
            else if (getBool(Encoder.getKey('verified', _addressList[i]))) {
                counter ++;
            }
        }
        address[] memory _tempArray = new address[](counter);
        counter = 0;
        for (uint256 j = 0; j < _len; j++) {
            if (IFeatureRegistry(getAddress(Encoder.getKey('featureRegistry'))).getFeatureStatus("customModulesAllowed")) {
                if (IOwnable(_addressList[j]).owner() == IOwnable(_securityToken).owner() || getBool(Encoder.getKey('verified', _addressList[j]))) {
                    _tempArray[counter] = _addressList[j];
                    counter ++;
                }
            }
            else if (getBool(Encoder.getKey('verified', _addressList[j]))) {
                _tempArray[counter] = _addressList[j];
                counter ++;
            }
        }
        return _tempArray;
    }

    /**
    * @notice Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(getAddress(Encoder.getKey("owner")), balance));
    }

    /**
     * @notice Called by the owner to pause, triggers stopped state
     */
    function pause() external onlyOwner {
        set(Encoder.getKey("paused"), true);
        emit Pause(now);
    }

    /**
     * @notice Called by the owner to unpause, returns to normal state
     */
    function unpause() external whenPaused onlyOwner {
        set(Encoder.getKey("paused"), false);
        emit Unpause(now);
    }

    /**
     * @notice Stores the contract addresses of other key contracts from the PolymathRegistry
     */
    function updateFromRegistry() onlyOwner external {
        address _polymathRegistry = getAddress(Encoder.getKey('polymathRegistry'));
        set(Encoder.getKey('securityTokenRegistry'), IPolymathRegistry(_polymathRegistry).getAddress("SecurityTokenRegistry"));
        set(Encoder.getKey('featureRegistry'), IPolymathRegistry(_polymathRegistry).getAddress("FeatureRegistry"));
        set(Encoder.getKey('polyToken'), IPolymathRegistry(_polymathRegistry).getAddress("PolyToken"));
    }

}
