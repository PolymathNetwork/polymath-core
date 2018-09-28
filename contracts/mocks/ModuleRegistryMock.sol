pragma solidity ^0.4.24;

import "../ModuleRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract ModuleRegistryMock is ModuleRegistry {
    
    /// @notice It is dummy functionality
    /// Alert! Alert! Do not use it for the mainnet release
    function addMoreTags(uint8 _moduleType, bytes32[] _tag) public onlyOwner {
       for (uint8 i = 0; i < _tag.length; i++) {
             pushArray(Encoder.getKey('availableTags', uint256(_moduleType)), _tag[i]);
         }
    } 
    
}