pragma solidity ^0.4.24;

contract EternalStorage {
    
    /// @notice Internal mappings use to store all kind on data into the contract  
  mapping(bytes32 => uint256) internal uintStorage;
  mapping(bytes32 => string) internal stringStorage;
  mapping(bytes32 => address) internal addressStorage;
  mapping(bytes32 => bytes) internal bytesStorage;
  mapping(bytes32 => bool) internal boolStorage;
  mapping(bytes32 => int256) internal intStorage;
  mapping(bytes32 => bytes32) internal bytes32Storage;

  /// @notice Internal mappings use to store the array of different data types
  mapping(bytes32 => bytes32[]) internal bytes32ArrayStorage;
  mapping(bytes32 => uint256[]) internal uintArrayStorage;
  mapping(bytes32 => address[]) internal addressArrayStorage;
  mapping(bytes32 => string[]) internal stringArrayStorage;
  
  function set(bytes32 _key, uint256 _value) internal {
      uintStorage[_key] = _value;
  }
  
  function set(bytes32 _key, address _value) internal {
      addressStorage[_key] = _value;
  }
  
  function set(bytes32 _key, bool _value) internal {
      boolStorage[_key] = _value;
  }
  
  function set(bytes32 _key, bytes32 _value) internal {
      bytes32Storage[_key] = _value;
  }

  function set(bytes32 _key, string _value) internal {
      stringStorage[_key] = _value;
  }
  
  function getBool(bytes32 _key) internal view returns (bool) {
      return boolStorage[_key];
  }
  
  function getUint(bytes32 _key) internal view returns (uint256) {
      return uintStorage[_key];
  }
  
  function getAddress(bytes32 _key) internal view returns (address) {
      return addressStorage[_key];
  }
  
  function getString(bytes32 _key) internal view returns (string) {
      return stringStorage[_key];
  }
  
  function getBytes32(bytes32 _key) internal view returns (bytes32) {
      return bytes32Storage[_key];
  }

  function deleteMapArrayAddress(bytes32 _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  function deleteMapArrayBytes32(bytes32 _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  function deleteMapArrayUint(bytes32 _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  function deleteMapArrayString(bytes32 _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  function pushMapArray(bytes32 _key, address _value) internal {
      addressArrayStorage[_key].push(_value);
  }

  function pushMapArray(bytes32 _key, bytes32 _value) internal {
      bytes32ArrayStorage[_key].push(_value);
  }

  function pushMapArray(bytes32 _key, string _value) internal {
      stringArrayStorage[_key].push(_value);
  }

  function pushMapArray(bytes32 _key, uint256 _value) internal {
      uintArrayStorage[_key].push(_value);
  }

  function getMapArrayAddress(bytes32 _key) internal returns(address[]) {
      return addressArrayStorage[_key];
  }

  function getMapArrayBytes32(bytes32 _key) internal returns(bytes32[]) {
      return bytes32ArrayStorage[_key];
  }

  function getMapArrayString(bytes32 _key) internal returns(string[]) {
      return stringArrayStorage[_key];
  }

  function getMapArrayUint(bytes32 _key) internal returns(uint[]) {
      return uintArrayStorage[_key];
  }
  
}