pragma solidity ^0.5.0;

import "../tokens/SecurityToken.sol";

/**
 * @title Security Token contract (mock)
 * @notice SecurityToken is an ERC1400 token with added capabilities:
 * @notice - Implements the ERC1400 Interface
 * @notice - Transfers are restricted
 * @notice - Modules can be attached to it to control its behaviour
 * @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
 * @notice - ST does not inherit from ISecurityToken due to:
 * @notice - https://github.com/ethereum/solidity/issues/4847
 */
contract MockSecurityTokenLogic is SecurityToken {

    event UpgradeEvent(uint256 _upgrade);

    /**
     * @notice Initialization function
     * @dev Expected to be called atomically with the proxy being created, by the owner of the token
     * @dev Can only be called once
     */
    function upgrade(address _getterDelegate, uint256 _upgrade) external {
        require(msg.sender == address(this));
        //Expected to be called atomically with the proxy being created
        getterDelegate = _getterDelegate;
        //securityTokenVersion = SemanticVersion(3, 1, 0);
        emit UpgradeEvent(_upgrade);
    }

    function newFunction(uint256 _upgrade) external {
        emit UpgradeEvent(_upgrade);
    }

}
