pragma solidity ^0.4.18;

import '../interfaces/IDelegable.sol';

contract Delegable is IDelegable {
    
    // Below mapping Contains the permission hash granted to a delegate corresponds to a module 
    mapping(bytes32 => bytes32) delegatesAcl;
    // It represent modulePermission[address of the module][signature_of_function] = bool
    mapping(address => mapping(bytes4 => bool)) modulePermission;
    // @notice function signatures corresponds to the granted signatures hashes 
    mapping(bytes32 => bytes4[]) grantedPerm;
    
    bytes32 EMPTY_HASH = keccak256("");
    
    // Emit at the time of permission granted to the delegate
    event LogPermissionGranted(address _delegate, address _module, uint256 _timestamp);
    // Emit when new module get added to the delegable
    event LogAddModule(address _module, bool _signatureHash);
    // Emit when permission get revoked fromt the delegate
    event LogPermissionRevoked(address _delegate, address _module, uint256 _timestamp);
    
    /**
     * @dev `addModuleSig` use to add the funtion signature of the module contract
     * @param _module Contract address of the module
     * @param _signatures function signatures of the module contract
     */
    function addModuleSig(address _module, bytes4[] _signatures) internal {
        require(_module != address(0));
        bytes32 _sigHash = _signatures.length > 0 ? _savePermission(_module, _signatures): EMPTY_HASH;
        LogAddModule(_module, _sigHash != bytes32(0));
    }
    
    /**
     * @dev Grant the permission to the delegate corresponds to the particular module
     * @param _delegate Ethereum address of the delegate
     * @param _signatures Function signatures of the module contract function. 
     */
    function grantPermission(address _delegate, bytes4[] _signatures) public {
        require(_delegate != address(0));
        require(_checkPermissions(_delegate, msg.sender));
        bytes32 hash = _checkSignature(msg.sender, _signatures);
        delegatesAcl[_permissionHash(_delegate, msg.sender)] = hash;
        LogPermissionGranted(_delegate, msg.sender, now);
    }
    
    /**
     * @dev Revoke the permissions from the delegate
     * @param _delegate Ethereum address of the delegate from whom the permission will get revoke
     */
    function revokePermission(address _delegate) public {
        require(_delegate != address(0) && msg.sender == address(0));
        delegatesAcl[_permissionHash(_delegate, msg.sender)] = bytes32(0);
    }
    
    /**
     * @dev Check the permissions granted to the given delegate
     * @param _delegate Ethereum address of the delegate
     * @param _module Contract address of the module
     * @param _signature Function signature of the contract
     */
    function checkPermissions(address _delegate, address _module, bytes4 _signature) view public returns(bool) {
        require(_delegate != address(0) && _module == address(0));
        require(_signature != bytes4(0));
        bytes4[] storage _sig = grantedPerm[delegatesAcl[_permissionHash(_delegate, _module)]];
        require(_sig.length > 0);
        for (uint i = 0; i < _sig.length; i++) {
            if (_sig[i] == _signature) {
                return true;
            }
        }
        return false;
    }

     /**
     * @notice save the permission 
     */
    function _savePermission(address _module, bytes4[] _signatures) internal returns(bytes32) {
        for (uint16 i = 0 ; i < _signatures.length; i++ ) {
            modulePermission[_module][_signatures[i]] = true;
        }
        return keccak256(_signatures);
    }
    
    /**
     * @notice Internal function use to set the permission
     */
    function _setPermission(bytes32 _paramHash, bytes4[] _sig) internal {
        for (uint i = 0; i < _sig.length; i++) {
            grantedPerm[_paramHash].push(_sig[i]);
        }
    }
    
    /**
     * @notice Return the hash of the two entity
     */
    function _permissionHash(address _delegate, address _module) pure internal returns(bytes32) {
        return keccak256(_delegate, _module);
    }
    
    /**
     * @notice validate whether the permission already granted to the delegate or not
     */
    function _checkPermissions(address _delegate, address _module) view internal returns (bool) {
         return delegatesAcl[_permissionHash(_delegate, _module)] == bytes32(0);
    }
    
    /**
     * @notice check the signature validity 
     */
    function _checkSignature(address _module, bytes4[] _sig) internal returns(bytes32) {
        for (uint i = 0; i < _sig.length; i++) {
            require(modulePermission[_module][_sig[i]]);
        }
        bytes32 paramHash = keccak256(_sig);
        if (grantedPerm[paramHash].length == 0)
            _setPermission(paramHash, _sig);
        return paramHash;
    }
    
}