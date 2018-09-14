pragma solidity ^0.4.24;

import "../SecurityTokenRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistryMock is SecurityTokenRegistry {
    
    /// @notice It is dummy functionality
    /// Alert do not use it for the mainnet release
    function changeTheDeployedAddress(string _ticker, address _newSecurityTokenAddress) public onlyOwner {
        string memory __ticker = Util.upper(_ticker);
        set(Encoder.getKey("tickerToSecurityTokens", __ticker), _newSecurityTokenAddress);
    } 
    
}
