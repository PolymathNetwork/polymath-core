pragma solidity ^0.5.0;

import "./TransferManagerEnums.sol";

/**
 * @title Interface to be implemented by all Transfer Manager modules
 */
interface ITransferManager {
    /**
     * @notice Determines if the transfer between these two accounts can happen
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data, bool _isTransfer) external returns(
        TransferManagerEnums.Result
    );

    function executeTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view returns(
        TransferManagerEnums.Result, byte
    );

    /**
     * @notice return the amount of tokens for a given user as per the partition
     * @param _owner Whom token amount need to query
     * @param _partition Identifier
     */
    function getTokensByPartition(address _owner, bytes32 _partition) external view returns(uint256);

}
