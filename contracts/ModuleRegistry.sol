pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IModuleRegistry.sol";
import "./interfaces/IModuleFactory.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./interfaces/IPolymathRegistry.sol";
import "./interfaces/IFeatureRegistry.sol";
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
    // Emit when ownership gets transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    ///////////////
    //// Modifiers
    ///////////////

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner(), "sender must be owner");
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPausedOrOwner() {
        if (msg.sender == owner()) _;
        else {
            require(!isPaused(), "Already paused");
            _;
        }
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.
     */
    modifier whenNotPaused() {
        require(!isPaused(), "Already paused");
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(isPaused(), "Should not be paused");
        _;
    }

    /////////////////////////////
    // Initialization
    /////////////////////////////

    // Constructor
    constructor() public {

    }

    function initialize(address _polymathRegistry, address _owner) external payable {
        require(!getBoolValue(Encoder.getKey("initialised")), "already initialized");
        require(_owner != address(0) && _polymathRegistry != address(0), "0x address is invalid");
        set(Encoder.getKey("polymathRegistry"), _polymathRegistry);
        set(Encoder.getKey("owner"), _owner);
        set(Encoder.getKey("paused"), false);
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
        if (ISecurityTokenRegistry(getAddressValue(Encoder.getKey("securityTokenRegistry"))).isSecurityToken(msg.sender)) {
            if (IFeatureRegistry(getAddressValue(Encoder.getKey("featureRegistry"))).getFeatureStatus("customModulesAllowed")) {
                require(
                    getBoolValue(Encoder.getKey("verified", _moduleFactory)) || IOwnable(_moduleFactory).owner() == IOwnable(msg.sender).owner(),
                    "ModuleFactory must be verified or SecurityToken owner must be ModuleFactory owner"
                );
            } else {
                require(getBoolValue(Encoder.getKey("verified", _moduleFactory)), "ModuleFactory must be verified");
            }
            require(_isCompatibleModule(_moduleFactory, msg.sender), "Version should within the compatible range of ST");
            pushArray(Encoder.getKey("reputation", _moduleFactory), msg.sender);
            emit ModuleUsed(_moduleFactory, msg.sender);
        }
    }

    function _isCompatibleModule(address _moduleFactory, address _securityToken) internal view returns(bool) {
        uint8[] memory _latestVersion = ISecurityToken(_securityToken).getVersion();
        uint8[] memory _lowerBound = IModuleFactory(_moduleFactory).getLowerSTVersionBounds();
        uint8[] memory _upperBound = IModuleFactory(_moduleFactory).getUpperSTVersionBounds();
        bool _isLowerAllowed = VersionUtils.compareLowerBound(_lowerBound, _latestVersion);
        bool _isUpperAllowed = VersionUtils.compareUpperBound(_upperBound, _latestVersion);
        return (_isLowerAllowed && _isUpperAllowed);
    }

    /**
     * @notice Called by the ModuleFactory owner to register new modules for SecurityTokens to use
     * @param _moduleFactory is the address of the module factory to be registered
     */
    function registerModule(address _moduleFactory) external whenNotPausedOrOwner {
        if (IFeatureRegistry(getAddressValue(Encoder.getKey("featureRegistry"))).getFeatureStatus("customModulesAllowed")) {
            require(
                msg.sender == IOwnable(_moduleFactory).owner() || msg.sender == owner(),
                "msg.sender must be the Module Factory owner or registry curator"
            );
        } else {
            require(msg.sender == owner(), "Only owner allowed to register modules");
        }
        require(getUintValue(Encoder.getKey("registry", _moduleFactory)) == 0, "Module factory should not be pre-registered");
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        //Enforce type uniqueness
        uint256 i;
        uint256 j;
        uint8[] memory moduleTypes = moduleFactory.getTypes();
        for (i = 1; i < moduleTypes.length; i++) {
            for (j = 0; j < i; j++) {
                require(moduleTypes[i] != moduleTypes[j], "Type mismatch");
            }
        }
        require(moduleTypes.length != 0, "Factory must have type");
        // NB - here we index by the first type of the module.
        uint8 moduleType = moduleFactory.getTypes()[0];
        set(Encoder.getKey("registry", _moduleFactory), uint256(moduleType));
        set(
            Encoder.getKey("moduleListIndex", _moduleFactory),
            uint256(getArrayAddress(Encoder.getKey("moduleList", uint256(moduleType))).length)
        );
        pushArray(Encoder.getKey("moduleList", uint256(moduleType)), _moduleFactory);
        emit ModuleRegistered(_moduleFactory, IOwnable(_moduleFactory).owner());
    }

    /**
     * @notice Called by the ModuleFactory owner or registry curator to delete a ModuleFactory from the registry
     * @param _moduleFactory is the address of the module factory to be deleted from the registry
     */
    function removeModule(address _moduleFactory) external whenNotPausedOrOwner {
        uint256 moduleType = getUintValue(Encoder.getKey("registry", _moduleFactory));

        require(moduleType != 0, "Module factory should be registered");
        require(
            msg.sender == IOwnable(_moduleFactory).owner() || msg.sender == owner(),
            "msg.sender must be the Module Factory owner or registry curator"
        );
        uint256 index = getUintValue(Encoder.getKey("moduleListIndex", _moduleFactory));
        uint256 last = getArrayAddress(Encoder.getKey("moduleList", moduleType)).length - 1;
        address temp = getArrayAddress(Encoder.getKey("moduleList", moduleType))[last];

        // pop from array and re-order
        if (index != last) {
            // moduleList[moduleType][index] = temp;
            setArrayIndexValue(Encoder.getKey("moduleList", moduleType), index, temp);
            set(Encoder.getKey("moduleListIndex", temp), index);
        }
        deleteArrayAddress(Encoder.getKey("moduleList", moduleType), last);

        // delete registry[_moduleFactory];
        set(Encoder.getKey("registry", _moduleFactory), uint256(0));
        // delete reputation[_moduleFactory];
        setArray(Encoder.getKey("reputation", _moduleFactory), new address[](0));
        // delete verified[_moduleFactory];
        set(Encoder.getKey("verified", _moduleFactory), false);
        // delete moduleListIndex[_moduleFactory];
        set(Encoder.getKey("moduleListIndex", _moduleFactory), uint256(0));
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
    function verifyModule(address _moduleFactory, bool _verified) external onlyOwner {
        require(getUintValue(Encoder.getKey("registry", _moduleFactory)) != uint256(0), "Module factory must be registered");
        set(Encoder.getKey("verified", _moduleFactory), _verified);
        emit ModuleVerified(_moduleFactory, _verified);
    }

    /**
     * @notice Returns all the tags related to the a module type which are valid for the given token
     * @param _moduleType is the module type
     * @param _securityToken is the token
     * @return list of tags
     * @return corresponding list of module factories
     */
    function getTagsByTypeAndToken(uint8 _moduleType, address _securityToken) external view returns(bytes32[] memory, address[] memory) {
        address[] memory modules = getModulesByTypeAndToken(_moduleType, _securityToken);
        return _tagsByModules(modules);
    }

    /**
     * @notice Returns all the tags related to the a module type which are valid for the given token
     * @param _moduleType is the module type
     * @return list of tags
     * @return corresponding list of module factories
     */
    function getTagsByType(uint8 _moduleType) external view returns(bytes32[] memory, address[] memory) {
        address[] memory modules = getModulesByType(_moduleType);
        return _tagsByModules(modules);
    }

    /**
     * @notice Returns all the tags related to the modules provided
     * @param _modules modules to return tags for
     * @return list of tags
     * @return corresponding list of module factories
     */
    function _tagsByModules(address[] memory _modules) internal view returns(bytes32[] memory, address[] memory) {
        uint256 counter = 0;
        uint256 i;
        uint256 j;
        for (i = 0; i < _modules.length; i++) {
            counter = counter + IModuleFactory(_modules[i]).getTags().length;
        }
        bytes32[] memory tags = new bytes32[](counter);
        address[] memory modules = new address[](counter);
        bytes32[] memory tempTags;
        counter = 0;
        for (i = 0; i < _modules.length; i++) {
            tempTags = IModuleFactory(_modules[i]).getTags();
            for (j = 0; j < tempTags.length; j++) {
                tags[counter] = tempTags[j];
                modules[counter] = _modules[i];
                counter++;
            }
        }
        return (tags, modules);
    }

    /**
     * @notice Returns the reputation of the entered Module Factory
     * @param _factoryAddress is the address of the module factory
     * @return address array which contains the list of securityTokens that use that module factory
     */
    function getReputationByFactory(address _factoryAddress) external view returns(address[] memory) {
        return getArrayAddress(Encoder.getKey("reputation", _factoryAddress));
    }

    /**
     * @notice Returns the list of addresses of Module Factory of a particular type
     * @param _moduleType Type of Module
     * @return address array that contains the list of addresses of module factory contracts.
     */
    function getModulesByType(uint8 _moduleType) public view returns(address[] memory) {
        return getArrayAddress(Encoder.getKey("moduleList", uint256(_moduleType)));
    }

    /**
     * @notice Returns the list of available Module factory addresses of a particular type for a given token.
     * @param _moduleType is the module type to look for
     * @param _securityToken is the address of SecurityToken
     * @return address array that contains the list of available addresses of module factory contracts.
     */
    function getModulesByTypeAndToken(uint8 _moduleType, address _securityToken) public view returns(address[] memory) {
        uint256 _len = getArrayAddress(Encoder.getKey("moduleList", uint256(_moduleType))).length;
        address[] memory _addressList = getArrayAddress(Encoder.getKey("moduleList", uint256(_moduleType)));
        bool _isCustomModuleAllowed = IFeatureRegistry(getAddressValue(Encoder.getKey("featureRegistry"))).getFeatureStatus(
            "customModulesAllowed"
        );
        uint256 counter = 0;
        for (uint256 i = 0; i < _len; i++) {
            if (_isCustomModuleAllowed) {
                if (IOwnable(_addressList[i]).owner() == IOwnable(_securityToken).owner() || getBoolValue(
                    Encoder.getKey("verified", _addressList[i])
                )) if (_isCompatibleModule(_addressList[i], _securityToken)) counter++;
            } else if (getBoolValue(Encoder.getKey("verified", _addressList[i]))) {
                if (_isCompatibleModule(_addressList[i], _securityToken)) counter++;
            }
        }
        address[] memory _tempArray = new address[](counter);
        counter = 0;
        for (uint256 j = 0; j < _len; j++) {
            if (_isCustomModuleAllowed) {
                if (IOwnable(_addressList[j]).owner() == IOwnable(_securityToken).owner() || getBoolValue(
                    Encoder.getKey("verified", _addressList[j])
                )) {
                    if (_isCompatibleModule(_addressList[j], _securityToken)) {
                        _tempArray[counter] = _addressList[j];
                        counter++;
                    }
                }
            } else if (getBoolValue(Encoder.getKey("verified", _addressList[j]))) {
                if (_isCompatibleModule(_addressList[j], _securityToken)) {
                    _tempArray[counter] = _addressList[j];
                    counter++;
                }
            }
        }
        return _tempArray;
    }

    /**
    * @notice Reclaims all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0), "0x address is invalid");
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "token transfer failed");
    }

    /**
     * @notice Called by the owner to pause, triggers stopped state
     */
    function pause() external whenNotPaused onlyOwner {
        set(Encoder.getKey("paused"), true);
        /*solium-disable-next-line security/no-block-members*/
        emit Pause(now);
    }

    /**
     * @notice Called by the owner to unpause, returns to normal state
     */
    function unpause() external whenPaused onlyOwner {
        set(Encoder.getKey("paused"), false);
        /*solium-disable-next-line security/no-block-members*/
        emit Unpause(now);
    }

    /**
     * @notice Stores the contract addresses of other key contracts from the PolymathRegistry
     */
    function updateFromRegistry() external onlyOwner {
        address _polymathRegistry = getAddressValue(Encoder.getKey("polymathRegistry"));
        set(Encoder.getKey("securityTokenRegistry"), IPolymathRegistry(_polymathRegistry).getAddress("SecurityTokenRegistry"));
        set(Encoder.getKey("featureRegistry"), IPolymathRegistry(_polymathRegistry).getAddress("FeatureRegistry"));
        set(Encoder.getKey("polyToken"), IPolymathRegistry(_polymathRegistry).getAddress("PolyToken"));
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner(), _newOwner);
        set(Encoder.getKey("owner"), _newOwner);
    }

    /**
     * @notice Gets the owner of the contract
     * @return address owner
     */
    function owner() public view returns(address) {
        return getAddressValue(Encoder.getKey("owner"));
    }

    /**
     * @notice Checks whether the contract operations is paused or not
     * @return bool
     */
    function isPaused() public view returns(bool) {
        return getBoolValue(Encoder.getKey("paused"));
    }
}
