pragma solidity ^0.4.18;

import './AclHelpers.sol';

contract Delegable is AclHelpers {

    address public authority;
    bytes32 constant public EMPTY_PARAM_HASH = keccak256(uint256(0));

    mapping(bytes32 => bytes32) public delegatesAcl;

    event LogGrantPermissions(address _delegate, address _entity, bool _permission);

    enum Op { NONE, EQ, NEQ, GT, LT, GTE, LTE, NOT, AND, OR, XOR, IF_ELSE, RET } // op types

    struct Permission {
        uint8 id;
        uint8 op;
        uint240 value; // even though value is an uint240 it can store addresses
        // in the case of 32 byte hashes losing 2 bytes precision isn't a huge deal
        // op and id take less than 1 byte each so it can be kept in 1 sstore
    }

    modifier onlyAuthority() {
        require(msg.sender == authority);
        _;
    }

    function Delegable() {
        authority = msg.sender;
    }

    // _entity will be the address of the module as per the Adam's branch
    // _delegate address of the delegate whom permission will be provided
    // _permission permission granted the delegate 
    function grantPermission(uint256[] _permission, address _entity, address _delegate) onlyAuthority {
        require(delegatesAcl[permissionHash(_delegate, _entity)] == bytes32(0));
        bytes32 paramsHash = _permission.length > 0 ? _savePermissions(_permission) : EMPTY_PARAM_HASH;
        delegatesAcl[permissionHash(_delegate, _entity)] = paramsHash;
        LogGrantPermissions(_delegate, _entity, paramsHash != bytes32(0));
    }

    // _entity will be the address of the module as per the Adam's branch
    function _checkPermissions(address _entity, bytes32 _permission) {
        ///  WIP
    }

    function _savePermissions(uint256[] _encodedParams) internal returns (bytes32) {
        bytes32 paramHash = keccak256(_encodedParams);
        Permission[] storage params;

        if (params.length == 0) { // params not saved before
            for (uint256 i = 0; i < _encodedParams.length; i++) {
                uint256 encodedParam = _encodedParams[i];
                Permission memory param = Permission(decodeParamId(encodedParam), decodeParamOp(encodedParam), uint240(encodedParam));
                params.push(param);
            }
        }

        return paramHash;
    }

}