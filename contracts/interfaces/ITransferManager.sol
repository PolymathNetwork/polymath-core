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
     * @notice return the amount of locked tokens for a given user
     * @param _owner whom token amount need to query
     */
    function getLockedToken(address _owner) external view returns(uint256);

    /**
     * @notice return the amount of un locked tokens for a given user
     * @param _owner whom token amount need to query
     */
    function getUnLockedToken(address _owner) external view returns(uint256);

}
