pragma solidity 0.5.8;

import "../STRGetter.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract MockSTRGetter is STRGetter {
    /// @notice It is a dummy function
    /// Alert! Alert! Do NOT use it for the mainnet release

    function newFunction() public pure returns (uint256) {
        return 99;
    }

}
