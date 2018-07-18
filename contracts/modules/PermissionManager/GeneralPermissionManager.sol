pragma solidity ^0.4.24;

import "./IPermissionManager.sol";

/////////////////////
// Module permissions
/////////////////////
//                          Owner       CHANGE_PERMISSION
// addPermission              X               X
// changePermission           X               X
//

/**
 * @title Permission Manager module for core permissioning functionality
 */
contract GeneralPermissionManager is IPermissionManager {

    // Mapping used to hold the permissions on the modules provided to delegate
    mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;
    // Mapping hold the delagate details
    mapping (address => bytes32) public delegateDetails;
    // Permission flag
    bytes32 public constant CHANGE_PERMISSION = "CHANGE_PERMISSION";

    /// Event emitted after any permission get changed for the delegate
    event LogChangePermission(address _delegate, address _module, bytes32 _perm, bool _valid, uint256 _timestamp);
    /// Use to notify when delegate is added in permission manager contract
    event LogAddPermission(address _delegate, bytes32 _details, uint256 _timestamp);

    /// @notice constructor
    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
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
    * @notice use to check the permission on delegate corresponds to module contract address
    * @param _delegate Ethereum address of the delegate
    * @param _module Ethereum contract address of the module
    * @param _perm Permission flag
    * @return bool
    */
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool) {
        if (delegateDetails[_delegate] != bytes32(0)) {
            return perms[_module][_delegate][_perm];
        }else
            return false;
    }

    /**
    * @notice use to add the details of the delegate
    * @param _delegate Ethereum address of the delegate
    * @param _details Details about the delegate i.e `Belongs to financial firm`
    */
    function addPermission(address _delegate, bytes32 _details) public withPerm(CHANGE_PERMISSION) {
        delegateDetails[_delegate] = _details;
        emit LogAddPermission(_delegate, _details, now);
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
    returns(bool)
    {
        require(delegateDetails[_delegate] != bytes32(0), "Delegate details not set");
        perms[_module][_delegate][_perm] = _valid;
        emit LogChangePermission(_delegate, _module, _perm, _valid, now);
        return true;
    }

    /**
    * @notice Use to get the details of the delegate
    * @param _delegate Ethereum address of the delegate
    * @return Details of the delegate
    */
    function getDelegateDetails(address _delegate) public view returns(bytes32) {
        return delegateDetails[_delegate];
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

}
