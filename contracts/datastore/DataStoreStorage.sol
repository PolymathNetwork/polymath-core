pragma solidity 0.5.8;

import "../interfaces/ISecurityToken.sol";

contract DataStoreStorage {
    // Address of the current implementation
    address internal __implementation;

    ISecurityToken public securityToken;

    mapping (bytes32 => uint256) internal uintData;
    mapping (bytes32 => bytes32) internal bytes32Data;
    mapping (bytes32 => address) internal addressData;
    mapping (bytes32 => string) internal stringData;
    mapping (bytes32 => bytes) internal bytesData;
    mapping (bytes32 => bool) internal boolData;
    mapping (bytes32 => uint256[]) internal uintArrayData;
    mapping (bytes32 => bytes32[]) internal bytes32ArrayData;
    mapping (bytes32 => address[]) internal addressArrayData;
    mapping (bytes32 => bool[]) internal boolArrayData;

    uint8 internal constant DATA_KEY = 6;
    bytes32 internal constant MANAGEDATA = "MANAGEDATA";
}
