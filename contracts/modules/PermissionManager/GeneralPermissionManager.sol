pragma solidity 0.5.8;

import "./IPermissionManager.sol";
import "../Module.sol";
import "./GeneralPermissionManagerStorage.sol";
import "../../interfaces/ISecurityToken.sol";

/**
 * @title Permission Manager module for core permissioning functionality
 */
contract GeneralPermissionManager is GeneralPermissionManagerStorage, IPermissionManager, Module {

    /// Event emitted after any permission get changed for the delegate
    event ChangePermission(address indexed _delegate, address _module, bytes32 _perm, bool _valid);
    /// Used to notify when delegate is added in permission manager contract
    event AddDelegate(address indexed _delegate, bytes32 _details);

    /// @notice constructor
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice Init function i.e generalise function to maintain the structure of the module contract
     * @return bytes4
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Used to check the permission on delegate corresponds to module contract address
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return bool
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool) {
        if (delegateDetails[_delegate] != bytes32(0)) {
            return perms[_module][_delegate][_perm];
        } else return false;
    }

    /**
     * @notice Used to add a delegate
     * @param _delegate Ethereum address of the delegate
     * @param _details Details about the delegate i.e `Belongs to financial firm`
     */
    function addDelegate(address _delegate, bytes32 _details) external withPerm(ADMIN) {
        require(_delegate != address(0), "Invalid address");
        require(_details != bytes32(0), "0 value not allowed");
        require(delegateDetails[_delegate] == bytes32(0), "Already present");
        delegateDetails[_delegate] = _details;
        allDelegates.push(_delegate);
        /*solium-disable-next-line security/no-block-members*/
        emit AddDelegate(_delegate, _details);
    }

    /**
     * @notice Used to delete a delegate
     * @param _delegate Ethereum address of the delegate
     */
    function deleteDelegate(address _delegate) external withPerm(ADMIN) {
        require(delegateDetails[_delegate] != bytes32(0), "delegate does not exist");
        uint256 delegateLen = allDelegates.length;
        for (uint256 i = 0; i < delegateLen; i++) {
            if (allDelegates[i] == _delegate) {
                allDelegates[i] = allDelegates[delegateLen - 1];
                allDelegates.length--;
                break;
            }
        }
        delete delegateDetails[_delegate];
    }

    /**
     * @notice Used to check if an address is a delegate or not
     * @param _potentialDelegate the address of potential delegate
     * @return bool
     */
    function checkDelegate(address _potentialDelegate) external view returns(bool) {
        require(_potentialDelegate != address(0), "Invalid address");

        if (delegateDetails[_potentialDelegate] != bytes32(0)) {
            return true;
        } else return false;
    }

    /**
     * @notice Used to provide/change the permission to the delegate corresponds to the module contract
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @param _valid Bool flag use to switch on/off the permission
     * @return bool
     */
    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public withPerm(ADMIN) {
        require(_delegate != address(0), "invalid address");
        _changePermission(_delegate, _module, _perm, _valid);
    }

    /**
     * @notice Used to change one or more permissions for a single delegate at once
     * @param _delegate Ethereum address of the delegate
     * @param _modules Multiple module matching the multiperms, needs to be same length
     * @param _perms Multiple permission flag needs to be changed
     * @param _valids Bool array consist the flag to switch on/off the permission
     * @return nothing
     */
    function changePermissionMulti(
        address _delegate,
        address[] memory _modules,
        bytes32[] memory _perms,
        bool[] memory _valids
    )
        public
        withPerm(ADMIN)
    {
        require(_delegate != address(0), "invalid address");
        require(_modules.length > 0, "0 length is not allowed");
        require(_modules.length == _perms.length && _valids.length == _perms.length, "Array length mismatch");
        for (uint256 i = 0; i < _perms.length; i++) {
            _changePermission(_delegate, _modules[i], _perms[i], _valids[i]);
        }
    }

    /**
     * @notice Used to return all delegates with a given permission and module
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return address[]
     */
    function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view returns(address[] memory) {
        uint256 counter = 0;
        uint256 i = 0;
        for (i = 0; i < allDelegates.length; i++) {
            if (perms[_module][allDelegates[i]][_perm]) {
                counter++;
            }
        }
        address[] memory allDelegatesWithPerm = new address[](counter);
        counter = 0;
        for (i = 0; i < allDelegates.length; i++) {
            if (perms[_module][allDelegates[i]][_perm]) {
                allDelegatesWithPerm[counter] = allDelegates[i];
                counter++;
            }
        }
        return allDelegatesWithPerm;
    }

    /**
     * @notice Used to return all permission of a single or multiple module
     * @dev possible that function get out of gas is there are lot of modules and perm related to them
     * @param _delegate Ethereum address of the delegate
     * @param _types uint8[] of types
     * @return address[] the address array of Modules this delegate has permission
     * @return bytes32[] the permission array of the corresponding Modules
     */
    function getAllModulesAndPermsFromTypes(address _delegate, uint8[] calldata _types) external view returns(
        address[] memory,
        bytes32[] memory
    ) {
        uint256 counter = 0;
        // loop through _types and get their modules from securityToken->getModulesByType
        for (uint256 i = 0; i < _types.length; i++) {
            address[] memory _currentTypeModules = securityToken.getModulesByType(_types[i]);
            // loop through each modules to get their perms from IModule->getPermissions
            for (uint256 j = 0; j < _currentTypeModules.length; j++) {
                bytes32[] memory _allModulePerms = IModule(_currentTypeModules[j]).getPermissions();
                // loop through each perm, if it is true, push results into arrays
                for (uint256 k = 0; k < _allModulePerms.length; k++) {
                    if (perms[_currentTypeModules[j]][_delegate][_allModulePerms[k]]) {
                        counter++;
                    }
                }
            }
        }

        address[] memory _allModules = new address[](counter);
        bytes32[] memory _allPerms = new bytes32[](counter);
        counter = 0;

        for (uint256 i = 0; i < _types.length; i++) {
            address[] memory _currentTypeModules = securityToken.getModulesByType(_types[i]);
            for (uint256 j = 0; j < _currentTypeModules.length; j++) {
                bytes32[] memory _allModulePerms = IModule(_currentTypeModules[j]).getPermissions();
                for (uint256 k = 0; k < _allModulePerms.length; k++) {
                    if (perms[_currentTypeModules[j]][_delegate][_allModulePerms[k]]) {
                        _allModules[counter] = _currentTypeModules[j];
                        _allPerms[counter] = _allModulePerms[k];
                        counter++;
                    }
                }
            }
        }

        return (_allModules, _allPerms);
    }

    /**
     * @notice Used to provide/change the permission to the delegate corresponds to the module contract
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @param _valid Bool flag use to switch on/off the permission
     * @return bool
     */
    function _changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) internal {
        perms[_module][_delegate][_perm] = _valid;
        /*solium-disable-next-line security/no-block-members*/
        emit ChangePermission(_delegate, _module, _perm, _valid);
    }

    /**
     * @notice Used to get all delegates
     * @return address[]
     */
    function getAllDelegates() external view returns(address[] memory) {
        return allDelegates;
    }

    /**
    * @notice Returns the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
