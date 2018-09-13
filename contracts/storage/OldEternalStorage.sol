pragma solidity ^0.4.24;

/**
 * @title EternalStorage
 * @dev This contract holds all the necessary state variables to carry out the storage of any contract.
 */
contract OldEternalStorage {

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

  //////////////////
  //// set functions
  //////////////////
  /// @notice Set the key values using the Overloaded `set` functions
  /// Ex- string version = "0.0.1"; replace to 
  /// set("version", "0.0.1");
  /// same for the other variables as well some more example listed below
  /// ex1 - address securityTokenAddress = 0x123; replace to 
  /// set("securityTokenAddress", 0x123);
  /// ex2 - bytes32 tokenDetails = "I am ST20"; replace to  
  /// set("tokenDetails", "I am ST20");

  function set(string _key, address _value) internal {
      addressStorage[keccak256(abi.encodePacked(_key))] = _value;
  }

  function set(string _key, string _value) internal {
      stringStorage[keccak256(abi.encodePacked(_key))] = _value;
  }

  function set(string _key, bytes32 _value) internal {
      bytes32Storage[keccak256(abi.encodePacked(_key))] = _value;
  }

  function set(string _key, uint256 _value) internal {
      uintStorage[keccak256(abi.encodePacked(_key))] = _value;
  }

  function set(string _key, bool _value) internal {
      boolStorage[keccak256(abi.encodePacked(_key))] = _value;
  }

  function set(string _key, int _value) internal {
      intStorage[keccak256(abi.encodePacked(_key))] = _value;
  }
  
  function set(string _key, bytes _value) internal {
      bytesStorage[keccak256(abi.encodePacked(_key))] = _value;
  }

  ////////////////////
  /// get functions
  ////////////////////
  /// @notice Get function use to get the value of the singleton state variables
  /// Ex1- string public version = "0.0.1";
  /// string _version = getString("version");
  /// Ex2 - assert(temp1 == temp2); replace to
  /// assert(getUint(temp1) == getUint(temp2));
  
  function getUint(string _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_key))];
  }

  function getAddress(string _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_key))];
  }

  function getBytes32(string _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_key))];
  }

  function getString(string _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_key))];
  }

  function getBool(string _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_key))];
  }

  function getInt(string _key) internal view returns (int) {
      return intStorage[keccak256(abi.encodePacked(_key))];
  }

  
  //////////////////////
  //// setMap functions
  /////////////////////
  /// @notice Below are the overloaded `setMap` functions use for one-level mapping data structure
  /// Ex1 - mapping(string => uint) tokenIndex; 
  /// tokenIndex["TOKEN"] = 1; replace to setMap("tokenIndex", "TOKEN", 1);
  /// Ex2 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
  /// {uint256 date, string name, address owner} etc.
  /// registeredSymbols["TOKEN"].name = "MyFristToken"; replace to setMap("registeredSymbols_name", "TOKEN", "MyFirstToken");
  /// More generalized- setMap("registeredSymbols_<struct variable>", "keyname", "value");

  // setMap(_name, _key(address), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, address _key, uint256 _value) internal {
      uintStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, address _key, bool _value) internal {
      boolStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, address _key, bytes32 _value) internal {
      bytes32Storage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, address _key, string _value) internal {
      stringStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, address _key, address _value) internal {
      addressStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }
  
  // setMap(_name, _key(string), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, string _key, uint256 _value) internal {
      uintStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, string _key, bool _value) internal {
      boolStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, string _key, bytes32 _value) internal {
      bytes32Storage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, string _key, string _value) internal {
      stringStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, string _key, address _value) internal {
      addressStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  // setMap(_name, _key(uint256), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, uint256 _key, uint256 _value) internal {
      uintStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, uint256 _key, bool _value) internal {
      boolStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, uint256 _key, bytes32 _value) internal {
      bytes32Storage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, uint256 _key, string _value) internal {
      stringStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, uint256 _key, address _value) internal {
      addressStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }
 
  // setMap(_name, _key(bytes32), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, bytes32 _key, uint256 _value) internal {
      uintStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, bytes32 _key, bool _value) internal {
      boolStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, bytes32 _key, bytes32 _value) internal {
      bytes32Storage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, bytes32 _key, string _value) internal {
      stringStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  function setMap(string _name, bytes32 _key, address _value) internal {
      addressStorage[keccak256(abi.encodePacked(_name, _key))] = _value;
  }

  /////////////////////
  //// getMap functions
  /////////////////////
  /// @notice Get functions to get the data of one-level mapping - `getMapAddress()`, `getMapUint()`...
  /// Ex1- mapping(string => uint) tokenIndex;
  /// uint256 temp = getMapUint("Token");
  /// Ex2 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
  /// {uint256 date, string name, address owner} etc.
  /// string _name = getMapString("registeredSymbols_name", "TOKEN");

  /// @notice getMapAddress(_name, _key[uint256, bool, address, bytes32])
  /// @return address   
  function getMapAddress(string _name, uint256 _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapAddress(string _name, address _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapAddress(string _name, string _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapAddress(string _name, bytes32 _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapAddress(string _name, bool _key) internal view returns (address) {
      return addressStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  /// @notice getMapUint(_name, _key[uint256, bool, address, bytes32])
  /// @return uint256   
  function getMapUint(string _name, uint256 _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapUint(string _name, address _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapUint(string _name, string _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapUint(string _name, bytes32 _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapUint(string _name, bool _key) internal view returns (uint256) {
      return uintStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  /// @notice getMapBytes32(_name, _key[uint256, bool, address, bytes32])
  /// @return bytes32   
  function getMapBytes32(string _name, uint256 _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBytes32(string _name, address _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBytes32(string _name, string _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBytes32(string _name, bytes32 _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBytes32(string _name, bool _key) internal view returns (bytes32) {
      return bytes32Storage[keccak256(abi.encodePacked(_name, _key))];
  }

  /// @notice getMapBool(_name, _key[uint256, bool, address, bytes32])
  /// @return bool   
  function getMapBool(string _name, uint256 _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBool(string _name, address _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBool(string _name, string _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBool(string _name, bytes32 _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapBool(string _name, bool _key) internal view returns (bool) {
      return boolStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  /// @notice getMapString(_name, _key[uint256, bool, address, bytes32])
  /// @return string   
  function getMapString(string _name, uint256 _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapString(string _name, address _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapString(string _name, string _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapString(string _name, bytes32 _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  function getMapString(string _name, bool _key) internal view returns (string) {
      return stringStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  ////////////////////////////
  //// pushMapArray functions
  ///////////////////////////
  /// @notice Below are the helper functions to facilitate the storing the arrays of different data types.
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByTicker;
  /// tokensOwnedByTicker[owner] = tokensOwnedByTicker[owner].push("xyz"); replace with
  /// pushMapArray("tokensOwnedByTicker", owner, "xyz");

  /// @notice use to store the values for the bytes32 array
  /// @param _name string type
  /// @param _key [uint256, string, bytes32, address] any of the data type in array
  /// @param _value bytes32 type

  // Adds to mapping(uint256 => bytes32[])
  function pushMapArray(string _name, uint256 _key, bytes32 _value) internal {
      bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(string => bytes32[])
  function pushMapArray(string _name, string _key, bytes32 _value) internal {
      bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(bytes32 => bytes32[])
  function pushMapArray(string _name, bytes32 _key, bytes32 _value) internal {
      bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(address => bytes32[])
  function pushMapArray(string _name, address _key, bytes32 _value) internal {
      bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  /// @notice use to store the values for the address array
  /// @param _name string type
  /// @param _key [uint256, string, bytes32, address] any of the data type in array
  /// @param _value address type

  // Adds to mapping(uint256 => address[])
  function pushMapArray(string _name, uint256 _key, address _value) internal {
      addressArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(string => address[])
  function pushMapArray(string _name, string _key, address _value) internal {
      addressArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(bytes32 => address[])
  function pushMapArray(string _name, bytes32 _key, address _value) internal {
      addressArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(address => address[])
  function pushMapArray(string _name, address _key, address _value) internal {
      addressArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }
  
  /// @notice use to store the values for the string array
  /// @param _name string type
  /// @param _key [uint256, string, bytes32, address] any of the data type in array
  /// @param _value string type

  // Adds to mapping(uint256 => string[])
  function pushMapArray(string _name, uint256 _key, string _value) internal {
      stringArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(string => string[])
  function pushMapArray(string _name, string _key, string _value) internal {
      stringArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(bytes32 => string[])
  function pushMapArray(string _name, bytes32 _key, string _value) internal {
      stringArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(address => string[])
  function pushMapArray(string _name, address _key, string _value) internal {
      stringArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }


  /// @notice use to store the values for the uint256 array
  /// @param _name string type
  /// @param _key [uint256, string, bytes32, address] any of the data type in array
  /// @param _value uint256 type

  // Adds to mapping(uint256 => uint256[])
  function pushMapArray(string _name, uint256 _key, uint256 _value) internal {
      uintArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(string => uint256[])
  function pushMapArray(string _name, string _key, uint256 _value) internal {
      uintArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(bytes32 => uint256[])
  function pushMapArray(string _name, bytes32 _key, uint256 _value) internal {
      uintArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }

  // Adds to mapping(address => uint256[])
  function pushMapArray(string _name, address _key, uint256 _value) internal {
      uintArrayStorage[keccak256(abi.encodePacked(_name, _key))].push(_value);
  }
  

  /////////////////////////
  /// getMapArray functions
  /////////////////////////
  /// @notice Get functions to get the array of the required data type
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
  /// getMapArrayBytes32("tokensOwnedByOwner", 0x1); It return the bytes32 array
  /// Ex2- uint256 _len =  tokensOwnedByOwner[0x1].length; replace with
  /// getMapArrayBytes32("tokensOwnedByOwner", 0x1).length;

  /// @notice Get function to get the bytes32 array
  /// @param _name string
  /// @param _key [uint256, address, bytes32, string]
  /// @return bytes32[]
  // Gets from mapping(uint256 => bytes32[])
  function getMapArrayBytes32(string _name, uint256 _key) internal view returns (bytes32[]) {
      return bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(address => bytes32[])
  function getMapArrayBytes32(string _name, address _key) internal view returns (bytes32[]) {
      return bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  // Gets from mapping(string => bytes32[])
  function getMapArrayBytes32(string _name, string _key) internal view returns (bytes32[]) {
      return bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(bytes32 => bytes32[])
  function getMapArrayBytes32(string _name, bytes32 _key) internal view returns (bytes32[]) {
      return bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }


  /// @notice Get function to get the uint256 array
  /// @param _name string
  /// @param _key [uint256, address, bytes32, string]
  /// @return uint256[]
  // Gets from mapping(uint256 => uint256[])
  function getMapArrayUint(string _name, uint256 _key) internal view returns (uint256[]) {
      return uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(address => uint256[])
  function getMapArrayUint(string _name, address _key) internal view returns (uint256[]) {
      return uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  // Gets from mapping(string => uint256[])
  function getMapArrayUint(string _name, string _key) internal view returns (uint256[]) {
      return uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(bytes32 => uint256[])
  function getMapArrayUint(string _name, bytes32 _key) internal view returns (uint256[]) {
      return uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  

  /// @notice Get function to get the address array
  /// @param _name string
  /// @param _key [uint256, address, bytes32, string]
  /// @return address[]
  // Gets from mapping(uint256 => address[])
  function getMapArrayAddress(string _name, uint256 _key) internal view returns (address[]) {
      return addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(address => address[])
  function getMapArrayAddress(string _name, address _key) internal view returns (address[]) {
      return addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  // Gets from mapping(string => address[])
  function getMapArrayAddress(string _name, string _key) internal view returns (address[]) {
      return addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(bytes32 => address[])
  function getMapArrayAddress(string _name, bytes32 _key) internal view returns (address[]) {
      return addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }


  /// @notice Get function to get the string array
  /// @param _name string
  /// @param _key [uint256, address, bytes32, string]
  /// @return string[]
  // Gets from mapping(uint256 => string[])
  function getMapArrayString(string _name, uint256 _key) internal view returns (string[]) {
      return stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(address => string[])
  function getMapArrayString(string _name, address _key) internal view returns (string[]) {
      return stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }

  // Gets from mapping(string => string[])
  function getMapArrayString(string _name, string _key) internal view returns (string[]) {
      return stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }
  
  // Gets from mapping(bytes32 => string[])
  function getMapArrayString(string _name, bytes32 _key) internal view returns (string[]) {
      return stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
  }



  ////////////////////////////
  // deleteMapArray functions
  ////////////////////////////
  /// @notice Function use to delete the array element.
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
  /// For deleting the item from array developers needs to create a funtion for that similarly 
  /// in this case we have the helper function deleteMapArrayBytes32() which will do it for us
  /// deleteMapArrayBytes32("tokensOwnedByOwner", 0x1);
  
  /// @notice Function use to delete the bytes32 array element
  /// @param _name string
  /// @param _key [string, uint256, address, bytes32]
  /// @param _index uint256
  //Deletes from mapping (address => bytes32[]) at index _index
  function deleteMapArrayBytes32(string _name, address _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (uint256 => bytes32[]) at index _index
  function deleteMapArrayBytes32(string _name, uint256 _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (string => bytes32[]) at index _index
  function deleteMapArrayBytes32(string _name, string _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (bytes32 => bytes32[]) at index _index
  function deleteMapArrayBytes32(string _name, bytes32 _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  /// @notice Function use to delete the uint256 array element
  /// @param _name string
  /// @param _key [string, uint256, address, bytes32]
  /// @param _index uint256
  //Deletes from mapping (address => uint256[]) at index _index
  function deleteMapArrayUint(string _name, address _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (uint256 => uint256[]) at index _index
  function deleteMapArrayUint(string _name, uint256 _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (string => uint256[]) at index _index
  function deleteMapArrayUint(string _name, string _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (bytes32 => uint256[]) at index _index
  function deleteMapArrayUint(string _name, bytes32 _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

   
  /// @notice Function use to delete the string array element
  /// @param _name string
  /// @param _key [string, uint256, address, bytes32]
  /// @param _index uint256
  //Deletes from mapping (address => string[]) at index _index
  function deleteMapArrayString(string _name, address _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (uint256 => string[]) at index _index
  function deleteMapArrayString(string _name, uint256 _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (string => string[]) at index _index
  function deleteMapArrayString(string _name, string _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (bytes32 => string[]) at index _index
  function deleteMapArrayString(string _name, bytes32 _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }


  /// @notice Function use to delete the address array element
  /// @param _name string
  /// @param _key [string, uint256, address, bytes32]
  /// @param _index uint256
  //Deletes from mapping (address => address[]) at index _index
  function deleteMapArrayAddress(string _name, address _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (uint256 => address[]) at index _index
  function deleteMapArrayAddress(string _name, uint256 _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (string => address[]) at index _index
  function deleteMapArrayAddress(string _name, string _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (bytes32 => address[]) at index _index
  function deleteMapArrayAddress(string _name, bytes32 _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[keccak256(abi.encodePacked(_name, _key))];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }



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