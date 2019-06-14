pragma solidity 0.5.8;

import "../SecurityTokenRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistryMock is SecurityTokenRegistry {
    /// @notice It is a dummy function
    /// Alert! Alert! Do NOT use it for the mainnet release

    uint256 public someValue;

    function changeTheFee(uint256 _newFee) public {
        set(STLAUNCHFEE, _newFee);
    }

    function configure(uint256 _someValue) public {
        someValue = _someValue;
    }

}
