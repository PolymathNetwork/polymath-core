pragma solidity ^0.4.24;

import "./interfaces/IModuleRegistry.sol";
import "./interfaces/IModuleFactory.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./interfaces/IFeatureRegistry.sol";
import "./interfaces/IERC20.sol";
import "./storage/EternalStorage.sol";
import "./libraries/Encoder.sol";
import "./interfaces/IOwner.sol";

/**
* @title Registry contract to store registered modules
* @notice Anyone can register modules, but only those "approved" by Polymath will be available for issuers to add
*/
contract ModuleRegistryV2 is IModuleRegistry, EternalStorage {
    /*
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
    */

    ///////////
    // Events
    //////////

    // Emit when ecosystem get paused
    event Pause(uint256 _timestammp);
     // Emit when ecosystem get unpaused
    event Unpause(uint256 _timestamp);
    // Emit when Module been used by the securityToken
    event LogModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
    // Emit when the Module Factory get registered with the ModuleRegistry contract
    event LogModuleRegistered(address indexed _moduleFactory, address indexed _owner);
    // Emit when the module get verified by the Polymath team
    event LogModuleVerified(address indexed _moduleFactory, bool _verified);
    // Emit when a moduleFactory is removed by Polymath or moduleFactory owner
    event LogModuleRemoved(address indexed _moduleFactory, address indexed _decisionMaker);

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
        require(!getBool(Encoder.getKey("paused")), "Already paused");
        _;
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
     * @notice Called by a security token to check if the ModuleFactory is verified or appropriate custom module
     * @dev ModuleFactory reputation increases by one every time it is deployed
     * @dev Any module can be added during token creation without being registered if it is defined in the token proxy deployment contract
     * @dev The feature switch for custom modules is labelled "customModulesAllowed"
     * @param _moduleFactory is the address of the relevant module factory
     */
    function useModule(address _moduleFactory) external {
        // This if statement is required to be able to add modules from the token proxy contract during deployment
        if (ISecurityTokenRegistry(getAddress(Encoder.getKey('securityTokenRegistry'))).isSecurityToken(msg.sender)) {
            if (IFeatureRegistry(getAddress(Encoder.getKey('featureRegistry'))).getFeatureStatus("customModulesAllowed")) {
                require(getBool(Encoder.getKey('verified', _moduleFactory)) || IOwner(_moduleFactory).owner() == IOwner(msg.sender).owner(),
                "ModuleFactory must be verified or SecurityToken owner must be ModuleFactory owner");
            } else {
                require(getBool(Encoder.getKey('verified', _moduleFactory)), "ModuleFactory must be verified");
            }
            require(getUint(Encoder.getKey('registry',_moduleFactory)) != 0, "ModuleFactory type should not be 0");
            pushArray(Encoder.getKey('reputation', _moduleFactory), msg.sender);
            emit LogModuleUsed(_moduleFactory, msg.sender);
        }
    }

    /**
     * @notice Called by moduleFactory owner to register new modules for SecurityToken to use
     * @param _moduleFactory is the address of the module factory to be registered
     * @return bool
     */
    function registerModule(address _moduleFactory) external whenNotPaused returns(bool) {
        require(getUint(Encoder.getKey('registry', _moduleFactory)) == 0, "Module factory should not be pre-registered");
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8 moduleType = moduleFactory.getType();
        require(moduleType != 0, "Factory moduleType should not equal to 0");
        set(Encoder.getKey('registry', _moduleFactory), uint256(moduleType));
        set(Encoder.getKey('moduleListIndex', _moduleFactory), getArrayAddress(Encoder.getKey('moduleList', uint256(moduleType))).length);
        pushArray(Encoder.getKey('moduleList', uint256(moduleType)), _moduleFactory);
        setArray(Encoder.getKey('reputation', _moduleFactory), new address[](0));
        emit LogModuleRegistered (_moduleFactory, IOwner(_moduleFactory).owner());
        return true;
    }

    /**
     * @notice Called by moduleFactory owner or registry curator to delete a moduleFactory
     * @param _moduleFactory is the address of the module factory to be deleted
     * @return bool
     */
    function removeModule(address _moduleFactory) external whenNotPaused returns(bool) {
        uint256 moduleType = getUint(Encoder.getKey('registry', _moduleFactory));

        require(moduleType != 0, "Module factory should be registered");
        require(msg.sender == IOwner(_moduleFactory).owner() || msg.sender == getAddress(Encoder.getKey('owner')),
        "msg.sender must be moduleFactory owner or registry curator");

        uint256 index = getUint(Encoder.getKey('moduleListIndex', _moduleFactory));
        uint256 last = getArrayAddress(Encoder.getKey('moduleList', moduleType)).length - 1;
        address temp = getArrayAddress(Encoder.getKey('moduleList', moduleType))[last];

        // pop from array and re-order
        if (index != last) {
            // moduleList[moduleType][index] = temp;
            addressArrayStorage[Encoder.getKey('moduleList', moduleType)][index] = temp;
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
        require(getUint(Encoder.getKey('registry', _moduleFactory)) != uint256(0), "Module factory should have been already registered");
        set(Encoder.getKey('verified', _moduleFactory), _verified);
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
             pushArray(Encoder.getKey('availableTags', uint256(_moduleType)), _tag[i]);
         }
     }

    /**
     * @notice remove the tag for specified Module Factory
     * @param _moduleType Type of module.
     * @param _removedTags List of tags
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
     * @notice Use to get all the tags releated to the functionality of the Module Factory.
     * @param _moduleType Type of module
     * @return bytes32 array
     */
    function getTagByModuleType(uint8 _moduleType) public view returns(bytes32[]) {
        return getArrayBytes32(Encoder.getKey('availableTags', uint256(_moduleType)));
    }

    /**
     * @notice Use to get the reputation of the Module factory
     * @param _factoryAddress Ethereum contract address of the module factory
     * @return address array which have the list of securityToken's uses that module factory
     */
    function getReputationOfFactory(address _factoryAddress) external view returns(address[]) {
        return getArrayAddress(Encoder.getKey('reputation', _factoryAddress));
    }

    /**
     * @notice Use to get the list of addresses of Module factory for a particular type
     * @param _moduleType Type of Module
     * @return address array thal contains the lis of addresses of module factory contracts.
     */
    function getModuleListOfType(uint8 _moduleType) external view returns(address[]) {
        return getArrayAddress(Encoder.getKey('moduleList', uint256(_moduleType)));
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
     * @notice called by the owner to pause, triggers stopped state
     */
    function pause() external whenNotPaused onlyOwner {
        set(Encoder.getKey("paused"), true);
        emit Pause(now);
    }

    /**
     * @notice called by the owner to unpause, returns to normal state
     */
    function unpause() external whenPaused onlyOwner {
        set(Encoder.getKey("paused"), false);
        emit Unpause(now);
    }


}
