pragma solidity 0.5.8;

import "../ModuleRegistry.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract MockModuleRegistry is ModuleRegistry {
    /// @notice It is dummy functionality
    /// Alert! Alert! Do not use it for the mainnet release
    function addMoreReputation(address _moduleFactory, address[] memory _tokens) public onlyOwner {
        for (uint8 i = 0; i < _tokens.length; i++) {
            pushArray(Encoder.getKey("reputation", _moduleFactory), _tokens[i]);
        }
    }

}
