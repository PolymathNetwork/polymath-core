pragma solidity ^0.4.18;

import './AclHelpers.sol';

contract Delegable is AclHelpers {

    address public authority;
    bytes32 constant public EMPTY_PARAM_HASH = keccak256(uint256(0));

    mapping(bytes32 => bytes32) public delegatesAcl;
    mapping(address => bytes32) public modulePerm;

    event LogGrantPermissions(address _delegate, address _module, uint256 _timestamp);
    event LogAddPermForModule(address indexed _module, bool _permission);

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
    }

    // Here this function is restricted and only be called by the securityToken
    function addModulePerm(uint256[] _permission, address _module) internal {
        require(_module != address(0));
        bytes32 paramsHash = _permission.length > 0 ? _savePermissions(_permission) : EMPTY_PARAM_HASH;
        modulePerm[_module] = paramsHash;
        LogAddPermForModule(_module, paramsHash != bytes32(0));
    }

    // _delegate address of the delegate whom permission will be provided
    function grantPermission(address _delegate, address _module) public {
        require(modulePerm[_module] != bytes32(0));
        require(delegatesAcl[permissionHash(_delegate, _module)] == bytes32(0));
        delegatesAcl[permissionHash(_delegate, _module)] = modulePerm[_module];
        LogGrantPermissions(_delegate, _module, now);
    }

    // _module will be the address of the module as per the Adam's branch
    // TODO:  Verify the permission granted to the delegates as per the module
    function checkPermissions(address _module, address _delegate) public {
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