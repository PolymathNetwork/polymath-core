pragma solidity ^0.5.0;

/**
 * @title Interface to be implemented by all Transfer Manager modules
 */
interface ITransferManager {
    enum Result {INVALID, NA, VALID, FORCE_VALID}

    /**
     * @notice Determines if the transfer between these two accounts can happen
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data, bool _isTransfer) external returns(Result);
}
