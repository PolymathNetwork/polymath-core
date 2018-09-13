pragma solidity ^0.4.24;


library Encoder {
    
    function getHash(string _key) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key)));
    }

    function getHash(string _key1, address _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }
  
    function getHash(string _key1, string _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }
    
    function getHash(string _key1, uint256 _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }
    
    function getHash(string _key1, bytes32 _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }
    
    function getHash(string _key1, bool _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

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

  function set(string _key) internal pure returns (bytes32) {
      return getHash(_key);
  }


  ////////////////////
  /// get functions
  ////////////////////
  /// @notice Get function use to get the value of the singleton state variables
  /// Ex1- string public version = "0.0.1";
  /// string _version = getString("version");
  /// Ex2 - assert(temp1 == temp2); replace to
  /// assert(getUint(temp1) == getUint(temp2));

    function get(string _key) internal pure returns (bytes32) {
        return getHash(_key);
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
  function setMap(string _name, address _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }
  
  // setMap(_name, _key(string), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, string _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  // setMap(_name, _key(uint256), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, uint256 _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }
 
  // setMap(_name, _key(bytes32), _value[uint256, bool, bytes32, string, address])
  function setMap(string _name, bytes32 _key) internal pure returns(bytes32) {
     return getHash(_name, _key);
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
  /// @return bytes32   
    function getMap(string _name, uint256 _key) internal pure returns (bytes32) {
        return getHash(_name, _key);
    }

    function getMap(string _name, address _key) internal pure returns (bytes32) {
        return getHash(_name, _key);
    }

    function getMap(string _name, string _key) internal pure returns (bytes32) {
        return getHash(_name, _key);
    }

    function getMap(string _name, bytes32 _key) internal pure returns (bytes32) {
        return getHash(_name, _key);
    }

    function getMap(string _name, bool _key) internal pure returns (bytes32) {
        return getHash(_name, _key);
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

  // Adds to mapping(uint256 => bytes32[])
  function pushMapArray(string _name, uint256 _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  // Adds to mapping(string => bytes32[])
  function pushMapArray(string _name, string _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  // Adds to mapping(bytes32 => bytes32[])
  function pushMapArray(string _name, bytes32 _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  // Adds to mapping(address => bytes32[])
  function pushMapArray(string _name, address _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
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
  /// @return bytes32
  // Gets from mapping(uint256 => bytes32[])

  function getMapArray(string _name, uint256 _key) internal pure returns (bytes32) {
      return getHash(_name, _key);
  }

  function getMapArray(string _name, address _key) internal pure returns (bytes32) {
      return getHash(_name, _key);
  }

  function getMapArray(string _name, string _key) internal pure returns (bytes32) {
      return getHash(_name, _key);
  }

  function getMapArray(string _name, bytes32 _key) internal pure returns (bytes32) {
      return getHash(_name, _key);
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
  //Deletes from mapping (address => bytes32[]) at index _index
  function deleteMapArray(string _name, address _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  //Deletes from mapping (uint256 => bytes32[]) at index _index
  function deleteMapArray(string _name, uint256 _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  //Deletes from mapping (string => bytes32[]) at index _index
  function deleteMapArray(string _name, string _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

  //Deletes from mapping (bytes32 => bytes32[]) at index _index
  function deleteMapArray(string _name, bytes32 _key) internal pure returns(bytes32) {
      return getHash(_name, _key);
  }

}