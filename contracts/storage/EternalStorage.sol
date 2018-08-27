pragma solidity ^0.4.24;

/**
 * @title EternalStorage
 * @dev This contract holds all the necessary state variables to carry out the storage of any contract.
 */
contract EternalStorage {

  mapping(bytes32 => uint256) internal uintStorage;
  mapping(bytes32 => string) internal stringStorage;
  mapping(bytes32 => address) internal addressStorage;
  mapping(bytes32 => bytes) internal bytesStorage;
  mapping(bytes32 => bool) internal boolStorage;
  mapping(bytes32 => int256) internal intStorage;
  mapping(bytes32 => bytes32) internal bytes32Storage;

  function getUintValues(bytes32 _variable) public view returns(uint256) {
      return uintStorage[_variable];
  }

  function getBoolValues(bytes32 _variable) public view returns(bool) {
      return boolStorage[_variable];
  }

  function getStringValues(bytes32 _variable) public view returns(string) {
      return stringStorage[_variable];
  }

  function getAddressValues(bytes32 _variable) public view returns(address) {
      return addressStorage[_variable];
  }

  function getBytes32Values(bytes32 _variable) public view returns(bytes32) {
      return bytes32Storage[_variable];
  }

  function getBytesValues(bytes32 _variable) public view returns(bytes) {
      return bytesStorage[_variable];
  }

}