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

   //////////////////
   //// set functions
   //////////////////
   /// @notice Set the key values using the Overloaded `set` functions
   /// Ex- string version = "0.0.1"; replace to 
   /// set(keccak256(abi.encodePacked("version"), "0.0.1");
   /// same for the other variables as well some more example listed below
   /// ex1 - address securityTokenAddress = 0x123; replace to 
   /// set(keccak256(abi.encodePacked("securityTokenAddress"), 0x123);
   /// ex2 - bytes32 tokenDetails = "I am ST20"; replace to  
   /// set(keccak256(abi.encodePacked("tokenDetails"), "I am ST20");
   /// ex3 - mapping(string => address) ownedToken;
   /// set(keccak256(abi.encodePacked("ownedToken", "Chris")), 0x123);
   /// ex4 - mapping(string => uint) tokenIndex; 
   /// tokenIndex["TOKEN"] = 1; replace to set(keccak256(abi.encodePacked("tokenIndex", "TOKEN"), 1);
   /// ex5 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
   /// {uint256 date, string name, address owner} etc.
   /// registeredSymbols["TOKEN"].name = "MyFristToken"; replace to set(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"), "MyFirstToken");
   /// More generalized- set(keccak256(abi.encodePacked("registeredSymbols_<struct variable>", "keyname"), "value");
  
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

  ////////////////////
  /// get functions
  ////////////////////
  /// @notice Get function use to get the value of the singleton state variables
  /// Ex1- string public version = "0.0.1";
  /// string _version = getString(keccak256(abi.encodePacked("version"));
  /// Ex2 - assert(temp1 == temp2); replace to
  /// assert(getUint(keccak256(abi.encodePacked(temp1)) == getUint(keccak256(abi.encodePacked(temp2));
  /// Ex3 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
  /// {uint256 date, string name, address owner} etc.
  /// string _name = getString(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"));
  
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


  ////////////////////////////
  // deleteArray functions
  ////////////////////////////
  /// @notice Function use to delete the array element.
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
  /// For deleting the item from array developers needs to create a funtion for that similarly 
  /// in this case we have the helper function deleteArrayBytes32() which will do it for us
  /// deleteArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1), 3); -- it will delete the index 3
  
 
  //Deletes from mapping (bytes32 => array[]) at index _index
  function deleteArrayAddress(bytes32 _key, uint256 _index) internal {
      address[] storage array = addressArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

   //Deletes from mapping (bytes32 => bytes32[]) at index _index
  function deleteArrayBytes32(bytes32 _key, uint256 _index) internal {
      bytes32[] storage array = bytes32ArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  //Deletes from mapping (bytes32 => uint[]) at index _index
  function deleteArrayUint(bytes32 _key, uint256 _index) internal {
      uint256[] storage array = uintArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }
  
  //Deletes from mapping (bytes32 => string[]) at index _index
  function deleteArrayString(bytes32 _key, uint256 _index) internal {
      string[] storage array = stringArrayStorage[_key];
      require(_index < array.length, "Index should less than length of the array");
      array[_index] = array[array.length - 1];
      array.length = array.length - 1;
  }

  ////////////////////////////
  //// pushArray functions
  ///////////////////////////
  /// @notice Below are the helper functions to facilitate the storing the arrays of different data types.
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByTicker;
  /// tokensOwnedByTicker[owner] = tokensOwnedByTicker[owner].push("xyz"); replace with
  /// pushArray(keccak256(abi.encodePacked("tokensOwnedByTicker", owner), "xyz");
  
  /// @notice use to store the values for the array
  /// @param _key bytes32 type
  /// @param _value [uint256, string, bytes32, address] any of the data type in array
  function pushArray(bytes32 _key, address _value) internal {
      addressArrayStorage[_key].push(_value);
  }

  function pushArray(bytes32 _key, bytes32 _value) internal {
      bytes32ArrayStorage[_key].push(_value);
  }

  function pushArray(bytes32 _key, string _value) internal {
      stringArrayStorage[_key].push(_value);
  }

  function pushArray(bytes32 _key, uint256 _value) internal {
      uintArrayStorage[_key].push(_value);
  }

  /////////////////////////
  /// getArray functions
  /////////////////////////
  /// @notice Get functions to get the array of the required data type
  /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
  /// getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)); It return the bytes32 array
  /// Ex2- uint256 _len =  tokensOwnedByOwner[0x1].length; replace with
  /// getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)).length;

  function getArrayAddress(bytes32 _key) internal returns(address[]) {
      return addressArrayStorage[_key];
  }

  function getArrayBytes32(bytes32 _key) internal returns(bytes32[]) {
      return bytes32ArrayStorage[_key];
  }

  function getArrayString(bytes32 _key) internal returns(string[]) {
      return stringArrayStorage[_key];
  }

  function getArrayUint(bytes32 _key) internal returns(uint[]) {
      return uintArrayStorage[_key];
  }


    /////////////////////////////
    /// Public getters functions
    /////////////////////////////

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