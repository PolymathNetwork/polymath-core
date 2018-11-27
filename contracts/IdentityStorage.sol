pragma solidity ^0.4.24;

import "./interfaces/ISecurityToken.sol";

contract IdentityStorage {
    ISecurityToken[] public associatedTokens;

    mapping (bytes32 => uint256) internal uintData;
    mapping (bytes32 => bytes32) internal bytes32Data; //Optional
    mapping (bytes32 => address) internal addressData;
    mapping (bytes32 => string) internal stringData; //Optional
    mapping (bytes32 => bytes) internal bytesData;
    mapping (bytes32 => bool) internal boolData;
    mapping (bytes32 => uint256[]) internal uintArrayData;
    mapping (bytes32 => bytes32[]) internal bytes32ArrayData;
    mapping (bytes32 => address[]) internal addressArrayData;
    mapping (bytes32 => bool[]) internal boolArrayData;

    uint8 constant DATA_KEY = 10;

    modifier onlySecurityToken() {
        bool canSet;
        if (associatedTokens.length > 0) {
            for(uint256 i; i < associatedTokens.length; i++) {
                if(msg.sender == address(associatedTokens[i])) {
                    canSet = true;
                    break;
                }
            }
            require(canSet);
        }
        _;
    }

    modifier canSetData() {
        // We can change it to anything like onlyModule(Data_key) or owner 
        // or delegateWithPermission("IDENTITY") or a combination of those 
        bool canSet;
        for(uint256 i; i < associatedTokens.length; i++) {
            if(associatedTokens[i].isModule(msg.sender, DATA_KEY)) {
                canSet = true;
                break;
            }
        }
        require(canSet);
        _;
    }

    function setData(bytes32 _key, bool _data) public canSetData {
        require(_key != bytes32(0), "Missing key");
        boolData[_key] = _data;
    }

    function getBoolData(bytes32 _key) public view returns(bool) {
        return boolData[_key];
    } 

    function addAuthorizedToken(address _securityToken) public onlySecurityToken {
        associatedTokens.push(ISecurityToken(_securityToken));
    }
}