pragma solidity ^0.5.0;

import "../interfaces/ISecurityToken.sol";
import "../interfaces/IOwnable.sol";
import "./DataStoreStorage.sol";

contract DataStore is DataStoreStorage {

    modifier onlyDataModuleWithValidKey(bytes32 _key) {
        require(_key != bytes32(0), "Missing key");
        require(associatedToken.isModule(msg.sender, DATA_KEY), "Unauthorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == IOwnable(address(associatedToken)).owner(), "Unauthorized");
        _;
    }

    function setSecurityToken(address _securityToken) public {
        if(address(associatedToken) != address(0)) {
            require(msg.sender == IOwnable(address(associatedToken)).owner(), "Unauthorized");
        }
        associatedToken = ISecurityToken(_securityToken);
    } 

    function setData(bytes32 _key, uint256 _data) external onlyDataModuleWithValidKey(_key) {
        uintData[_key] = _data;
    }

    function setData(bytes32 _key, bytes32 _data) external onlyDataModuleWithValidKey(_key) {
        bytes32Data[_key] = _data;
    }

    function setData(bytes32 _key, address _data) external onlyDataModuleWithValidKey(_key) {
        addressData[_key] = _data;
    }

    function setData(bytes32 _key, string calldata _data) external onlyDataModuleWithValidKey(_key) {
        stringData[_key] = _data;
    }

    function setData(bytes32 _key, bytes calldata _data) external onlyDataModuleWithValidKey(_key) {
        bytesData[_key] = _data;
    }

    function setData(bytes32 _key, bool _data) external onlyDataModuleWithValidKey(_key) {
        boolData[_key] = _data;
    }

    function setData(bytes32 _key, uint256[] calldata _data) external onlyDataModuleWithValidKey(_key) {
        uintArrayData[_key] = _data;
    }

    function setData(bytes32 _key, bytes32[] calldata _data) external onlyDataModuleWithValidKey(_key) {
        bytes32ArrayData[_key] = _data;
    }

    function setData(bytes32 _key, address[] calldata _data) external onlyDataModuleWithValidKey(_key) {
        addressArrayData[_key] = _data;
    }

    function setData(bytes32 _key, bool[] calldata _data) external onlyDataModuleWithValidKey(_key) {
        boolArrayData[_key] = _data;
    }

    function insertData(bytes32 _key, uint256 _data) external onlyDataModuleWithValidKey(_key) {
        uintArrayData[_key].push(_data);
    }

    function insertData(bytes32 _key, bytes32 _data) external onlyDataModuleWithValidKey(_key) {
        bytes32ArrayData[_key].push(_data);
    }

    function insertData(bytes32 _key, address _data) external onlyDataModuleWithValidKey(_key) {
        addressArrayData[_key].push(_data);
    }

    function insertData(bytes32 _key, bool _data) external onlyDataModuleWithValidKey(_key) {
        boolArrayData[_key].push(_data);
    }

    function deleteUint(bytes32 _key, uint256 _index) external onlyDataModuleWithValidKey(_key) {
        require(uintArrayData[_key].length > _index, "Invalid Index"); //Also prevents undeflow
        if(uintArrayData[_key].length - 1 != _index) {
            uintArrayData[_key][_index] = uintArrayData[_key][uintArrayData[_key].length - 1];
        }
        uintArrayData[_key].length--;
    }

    function deleteBytes32(bytes32 _key, uint256 _index) external onlyDataModuleWithValidKey(_key) {
        require(bytes32ArrayData[_key].length > _index, "Invalid Index"); //Also prevents undeflow
        if(bytes32ArrayData[_key].length - 1 != _index) {
            bytes32ArrayData[_key][_index] = bytes32ArrayData[_key][uintArrayData[_key].length - 1];
        }
        bytes32ArrayData[_key].length--;
    }

    function deleteAddress(bytes32 _key, uint256 _index) external onlyDataModuleWithValidKey(_key) {
        require(addressArrayData[_key].length > _index, "Invalid Index"); //Also prevents undeflow
        if(addressArrayData[_key].length - 1 != _index) {
            addressArrayData[_key][_index] = addressArrayData[_key][uintArrayData[_key].length - 1];
        }
        addressArrayData[_key].length--;
    }

    function deleteBool(bytes32 _key, uint256 _index) external onlyDataModuleWithValidKey(_key) {
        require(boolArrayData[_key].length > _index, "Invalid Index"); //Also prevents undeflow
        if(boolArrayData[_key].length - 1 != _index) {
            boolArrayData[_key][_index] = boolArrayData[_key][uintArrayData[_key].length - 1];
        }
        boolArrayData[_key].length--;
    }

    function getUint(bytes32 _key) external view returns(uint256) {
        return uintData[_key];
    }

    function getBytes32(bytes32 _key) external view returns(bytes32) {
        return bytes32Data[_key];
    }

    function getAddress(bytes32 _key) external view returns(address) {
        return addressData[_key];
    }

    function getString(bytes32 _key) external view returns(string memory) {
        return stringData[_key];
    }

    function getBytes(bytes32 _key) external view returns(bytes memory) {
        return bytesData[_key];
    }

    function getBool(bytes32 _key) external view returns(bool) {
        return boolData[_key];
    }

    function getUintArray(bytes32 _key) external view returns(uint256[] memory) {
        return uintArrayData[_key];
    }

    function getBytes32Array(bytes32 _key) external view returns(bytes32[] memory) {
        return bytes32ArrayData[_key];
    }

    function getAddressArray(bytes32 _key) external view returns(address[] memory) {
        return addressArrayData[_key];
    }

    function getBoolArray(bytes32 _key) external view returns(bool[] memory) {
        return boolArrayData[_key];
    }

    function getUintArrayLength(bytes32 _key) external view returns(uint256) {
        return uintArrayData[_key].length;
    }

    function getBytes32ArrayLength(bytes32 _key) external view returns(uint256) {
        return bytes32ArrayData[_key].length;
    }

    function getAddressArrayLength(bytes32 _key) external view returns(uint256) {
        return addressArrayData[_key].length;
    }

    function getBoolArrayLength(bytes32 _key) external view returns(uint256) {
        return boolArrayData[_key].length;
    }

    function getUintArrayElement(bytes32 _key, uint256 _index) external view returns(uint256) {
        return uintArrayData[_key][_index];
    }

    function getBytes32ArrayElement(bytes32 _key, uint256 _index) external view returns(bytes32) {
        return bytes32ArrayData[_key][_index];
    }

    function getAddressArrayElement(bytes32 _key, uint256 _index) external view returns(address) {
        return addressArrayData[_key][_index];
    }

    function getBoolArrayElement(bytes32 _key, uint256 _index) external view returns(bool) {
        return boolArrayData[_key][_index];
    }
}
