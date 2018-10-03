pragma solidity ^0.4.24;

import "./IPermissionManager.sol";
import "../Module.sol";

/**
 * @title Permission Manager module for core permissioning functionality
 */
contract GeneralPermissionManager is IPermissionManager, Module {

    // Mapping used to hold the permissions on the modules provided to delegate, delegate add => modules add => permission uint8 => bool 
    mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;
    // Mapping hold the delagate details
    mapping (address => bytes32) public delegateDetails;
    // Array to track all delegates
    address[] public allDelegates;


    // Permission flag
    bytes32 public constant CHANGE_PERMISSION = "CHANGE_PERMISSION";

    /// Event emitted after any permission get changed for the delegate
    event ChangePermission(address _delegate, address _module, bytes32 _perm, bool _valid, uint256 _timestamp);
    /// Use to notify when delegate is added in permission manager contract
    event LogAddDelegate(address _delegate, bytes32 _details, uint256 _timestamp);


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
        }else
            return false;
    }

    /**
    * @notice Use to add a delegate
    * @param _delegate Ethereum address of the delegate
    * @param _details Details about the delegate i.e `Belongs to financial firm`
    */
    function addDelegate(address _delegate, bytes32 _details) public withPerm(CHANGE_PERMISSION) {
        require(_details != bytes32(0), "Delegate details not set");
        delegateDetails[_delegate] = _details;
        allDelegates.push(_delegate);
        emit LogAddDelegate(_delegate, _details, now);
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
    external
    withPerm(CHANGE_PERMISSION)
    returns(bool)
    {
        require(delegateDetails[_delegate] != bytes32(0), "Delegate details not set");
        perms[_module][_delegate][_perm] = _valid;
        emit ChangePermission(_delegate, _module, _perm, _valid, now);
        return true;
    }

    /**
    * @notice Use to get the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = CHANGE_PERMISSION;
        return allPermissions;
    }

    /**
    * @notice use to get all delegates
    * @return address[]
    */
    function getAllDelegates() public view returns(address[]) {
        return allDelegates;
    }

    /**
    * @notice use to check if an address is a delegate or not
    * @param _potentialDelegate the address of potential delegate
    * @return bool
    */
    function isDelegate(address _potentialDelegate) public view returns(bool) {

        require(_potentialDelegate != address(0));

        if (delegateDetails[_potentialDelegate] != bytes32(0)) {
            return true;
        }else{
            return false;
        }
    }

    /**
    * @notice Use to change one or more permissions for a single delegate at once
    * @param _delegate Ethereum address of the delegate
    * @param _multiModules Multiple module matching the multiperms, needs to be same length
    * @param _multiPerms Multiple permission flag needs to be changed
    * @return nothing
    */
    function changePermissionBulk(
        address _delegate,
        address[] _multiModules,
        bytes32[] _multiPerms
    )
    external
    withPerm(CHANGE_PERMISSION)
    {
        require(delegateDetails[_delegate] != bytes32(0), "Delegate details not set");
        require(_multiModules.length != 0 && _multiPerms.length !=0);
        
        for(uint8 i=0;i<_multiPerms.length;i++){
            bool _currentPerm = !perms[_multiModules[i]][_delegate][_multiPerms[i]];
            perms[_multiModules[i]][_delegate][_multiPerms[i]] = _currentPerm;
            emit ChangePermission(_delegate, _multiModules[i], _multiPerms[i], _currentPerm, now);
        }
    }

    /**
    * @notice use to return all delegates with a given permission and module
    * @param _module Ethereum contract address of the module
    * @param _perm Permission flag
    * @return address[]
    */

    address[] allDelegatesWithPerm;

    function getAllDelegatesWithPerm(address _module, bytes32 _perm) public returns(address[]) {

        require(_module != address(0) && _perm != bytes32(0));

        for(uint8 i=0;i<allDelegates.length;i++){
            if (perms[_module][allDelegates[i]][_perm]){
                allDelegatesWithPerm.push(allDelegates[i]);
            } else {}
        }

        return allDelegatesWithPerm;
    }

    /**
    * @notice use to return all permission of a signle or multiple module
    * @param _delegate Ethereum address of the delegate
    * @param _tokenAddress Ethereum address of the security token
    * @param _types uint8[] of types
    * @return address[] the address array of Modules this delegate has permission
    * @return bytes32[] the permission array of the corresponding Modules
    */

    address[] _allModules;
    bytes32[] _allPerms;

    function getAllModulesAndPerms(address _delegate, uint8[] _types, address _tokenAddress) public returns(address[], bytes32[]) {

        require(delegateDetails[_delegate] != bytes32(0), "Delegate details not set");
        require(_tokenAddress!= address(0) && _types.length !=0);
        
        // loop through _types and get their modules from securityToken->getModulesByType
        for(uint8 i=0; i<_types.length; i++){
            address[] memory _currentTypeModules = ISecurityToken(_tokenAddress).getModulesByType(_types[i]);
          
            // loop through each modules to get their perms from iModule->getPermissions
            for(uint8 a=0; a<_currentTypeModules.length; a++){
                bytes32[] memory _allModulePerms = IModule(_currentTypeModules[a]).getPermissions();

                // loop through each perm, if it is true, push results into arrays
                for (uint8 b=0; b<_allModulePerms.length; b++){
                    if(perms[_currentTypeModules[a]][_delegate][_allModulePerms[b]]){
                        _allModules.push(_currentTypeModules[a]);
                        _allPerms.push(_allModulePerms[b]);
                    }
                }
            }
        }

        return(_allModules, _allPerms);
    }



}
