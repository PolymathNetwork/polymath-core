pragma solidity ^0.5.0;

/**
 * @title Interface to be implemented by all Transfer Manager modules
 */
interface ITransferManager {
    //  If verifyTransfer returns:
    //  FORCE_VALID, the transaction will always be valid, regardless of other TM results
    //  INVALID, then the transfer should not be allowed regardless of other TM results
    //  VALID, then the transfer is valid for this TM
    //  NA, then the result from this TM is ignored
    enum Result {INVALID, NA, VALID, FORCE_VALID}

    /**
     * @notice Determines if the transfer between these two accounts can happen
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data, bool _isTransfer) external returns(Result);

    function executeTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view returns(Result, byte);

    /**
     * @notice return the amount of tokens for a given user as per the partition
     * @param _owner Whom token amount need to query
     * @param _partition Identifier
     */
    function getTokensByPartition(address _owner, bytes32 _partition) external view returns(uint256);
}
