pragma solidity ^0.4.24;

import "./IPermissionManager.sol";
import "../Module.sol";

/**
 * @title Permission Manager module for core permissioning functionality
 */
contract GeneralPermissionManager is IPermissionManager, Module {

    // Mapping used to hold the permissions on the modules provided to delegate, module add => delegate add => permission uint8 => bool 
    mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;
    // Mapping hold the delagate details
    mapping (address => bytes32) public delegateDetails;
    // Array to track all delegates
    address[] public allDelegates;


    // Permission flag
    bytes32 public constant CHANGE_PERMISSION = "CHANGE_PERMISSION";

    /// Event emitted after any permission get changed for the delegate
    event ChangePermission(address indexed _delegate, address _module, bytes32 _perm, bool _valid, uint256 _timestamp);
    /// Use to notify when delegate is added in permission manager contract
    event AddDelegate(address indexed _delegate, bytes32 _details, uint256 _timestamp);


    /// @notice constructor
    constructor (address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice Init function i.e generalise function to maintain the structure of the module contract
     * @return bytes4
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Use to check the permission on delegate corresponds to module contract address
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return bool
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool) {
        if (delegateDetails[_delegate] != bytes32(0)) {
            return perms[_module][_delegate][_perm];
        } else
            return false;
    }

    /**
     * @notice Use to add a delegate
     * @param _delegate Ethereum address of the delegate
     * @param _details Details about the delegate i.e `Belongs to financial firm`
     */
    function addDelegate(address _delegate, bytes32 _details) external withPerm(CHANGE_PERMISSION) {
        require(_details != bytes32(0), "0 value not allowed");
        delegateDetails[_delegate] = _details;
        allDelegates.push(_delegate);
        emit AddDelegate(_delegate, _details, now);
    }

    /**
     * @notice use to check if an address is a delegate or not
     * @param _potentialDelegate the address of potential delegate
     * @return bool
     */
    function checkDelegate(address _potentialDelegate) external view returns(bool) {
        require(_potentialDelegate != address(0));

        if (delegateDetails[_potentialDelegate] != bytes32(0)) {
            return true;
        } else
            return false;
    }

    /**
     * @notice Use to provide/change the permission to the delegate corresponds to the module contract
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @param _valid Bool flag use to switch on/off the permission
     * @return bool
     */
    function changePermission(
        address _delegate,
        address _module,
        bytes32 _perm,
        bool _valid
    )
    public
    withPerm(CHANGE_PERMISSION)
    {
        require(delegateDetails[_delegate] != bytes32(0), "Delegate is not exists");
        perms[_module][_delegate][_perm] = _valid;
        emit ChangePermission(_delegate, _module, _perm, _valid, now);
    }

    /**
     * @notice Use to change one or more permissions for a single delegate at once
     * @param _delegate Ethereum address of the delegate
     * @param _modules Multiple module matching the multiperms, needs to be same length
     * @param _perms Multiple permission flag needs to be changed
     * @param _valids Bool array consist the flag to switch on/off the permission
     * @return nothing
     */
    function changePermissionMulti(
        address _delegate,
        address[] _modules,
        bytes32[] _perms,
        bool[] _valids
    )
    external
    withPerm(CHANGE_PERMISSION)
    {
        require(_modules.length > 0 && _perms.length > 0, "0 length is not allowed");
        require(_modules.length == _perms.length, "Array length mismatch");
        require(_valids.length == _perms.length, "Array length mismatch");
        for(uint8 i = 0; i < _perms.length; i++) {
            changePermission(_delegate, _modules[i], _perms[i], _valids[i]);
        }
    }

    /**
     * @notice use to return all delegates with a given permission and module
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return address[]
     */
    function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view returns(address[]) {
        uint256 counter = 0;
        uint8 i = 0;
        for (i = 0; i < allDelegates.length; i++) {
            if (perms[_module][allDelegates[i]][_perm]) {
               counter++;
            }
        }
        address[] memory allDelegatesWithPerm = new address[](counter);
        counter = 0;
        for (i = 0; i < allDelegates.length; i++) {
            if (perms[_module][allDelegates[i]][_perm]){
                allDelegatesWithPerm[counter] = allDelegates[i];
                counter++;
            }
        }
        return allDelegatesWithPerm;
    }

    /**
     * @notice use to return all permission of a single or multiple module
     * @dev possible that function get out of gas is there are lot of modules and perm related to them
     * @param _delegate Ethereum address of the delegate
     * @param _tokenAddress Ethereum address of the security token
     * @param _types uint8[] of types
     * @return address[] the address array of Modules this delegate has permission
     * @return bytes32[] the permission array of the corresponding Modules
     */
    function getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types, address _tokenAddress) external view returns(address[], bytes32[]) {
        uint256 counter = 0;
        // loop through _types and get their modules from securityToken->getModulesByType
        for (uint8 i = 0; i < _types.length; i++) {
            address[] memory _currentTypeModules = ISecurityToken(_tokenAddress).getModulesByType(_types[i]);
            // loop through each modules to get their perms from IModule->getPermissions
            for (uint8 j = 0; j < _currentTypeModules.length; j++){
                bytes32[] memory _allModulePerms = IModule(_currentTypeModules[j]).getPermissions();
                // loop through each perm, if it is true, push results into arrays
                for (uint8 k = 0; k < _allModulePerms.length; k++) {
                    if (perms[_currentTypeModules[j]][_delegate][_allModulePerms[k]]) {
                        counter ++;
                    }
                }
            }
        }

        address[] memory _allModules = new address[](counter);
        bytes32[] memory _allPerms = new bytes32[](counter);
        counter = 0;

        for (i = 0; i < _types.length; i++){
            _currentTypeModules = ISecurityToken(_tokenAddress).getModulesByType(_types[i]);
            for (j = 0; j < _currentTypeModules.length; j++) {
                _allModulePerms = IModule(_currentTypeModules[j]).getPermissions();
                for (k = 0; k < _allModulePerms.length; k++) {
                    if (perms[_currentTypeModules[j]][_delegate][_allModulePerms[k]]) {
                        _allModules[counter]= _currentTypeModules[j];
                        _allPerms[counter]=_allModulePerms[k];
                        counter++;
                    }
                }
            }
        }

        return(_allModules, _allPerms);
    }

    /**
     * @notice use to get all delegates
     * @return address[]
     */
    function getAllDelegates() external view returns(address[]) {
        return allDelegates;
    }
    
    /**
    * @notice Returns the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = CHANGE_PERMISSION;
        return allPermissions;
    }

}
