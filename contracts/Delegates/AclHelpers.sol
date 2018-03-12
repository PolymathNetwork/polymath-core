pragma solidity ^0.4.18;

contract AclHelpers {

    function decodeParamOp(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 30));
    }

    function decodeParamId(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 31));
    }

    function permissionHash(address _entity, address _delegate) internal pure returns (bytes32) {
        return keccak256(_entity, _delegate);
    }
}