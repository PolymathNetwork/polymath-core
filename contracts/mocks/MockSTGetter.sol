pragma solidity 0.5.8;

import "../tokens/STGetter.sol";

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
contract MockSTGetter is STGetter {
    using SafeMath for uint256;

    event UpgradeEvent(uint256 _upgrade);

    function newGetter(uint256 _upgrade) public {
        emit UpgradeEvent(_upgrade);
    }

}
