pragma solidity ^0.4.24;

import "../SecurityTokenRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistryMock is SecurityTokenRegistry {
    
    /// @notice It is dummy functionality
    /// Alert! Alert! Do not use it for the mainnet release
    function changeTheDeployedAddress(string _ticker, address _newSecurityTokenAddress) public {
        set(Encoder.getKey("tickerToSecurityToken", _ticker), _newSecurityTokenAddress);
    } 
    
}
