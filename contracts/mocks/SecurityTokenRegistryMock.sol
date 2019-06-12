pragma solidity ^0.5.0;

import "../SecurityTokenRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistryMock is SecurityTokenRegistry {
    /// @notice It is a dummy function
    /// Alert! Alert! Do NOT use it for the mainnet release

    modifier onlyOwnerOrSelf() {
        require(msg.sender == owner() || msg.sender == address(this), "Only owner or self");
        _;
    }

    uint256 public someValue;
    
    function changeTheDeployedAddress(string memory _ticker, address _newSecurityTokenAddress) public {
        set(Encoder.getKey("tickerToSecurityToken", _ticker), _newSecurityTokenAddress);
    }

    function configure(uint256 _someValue) public onlyOwnerOrSelf {
        someValue = _someValue;
    }

}
