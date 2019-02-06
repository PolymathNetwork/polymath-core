pragma solidity ^0.5.0;

import "./TransferManager.sol";
import "./CountTransferManagerStorage.sol";

/**
 * @title Transfer Manager for limiting maximum number of token holders
 */
contract CountTransferManager is CountTransferManagerStorage, TransferManager {

    event ModifyHolderCount(uint256 _oldHolderCount, uint256 _newHolderCount);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /** @notice Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount Amount to send
     */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata /* _data */,
        bool /* _isTransfer */
    )
        external
        returns(Result)
    {
        if (!paused) {
            if (maxHolderCount < ISecurityToken(securityToken).getInvestorCount()) {
                // Allow transfers to existing maxHolders
                if (ISecurityToken(securityToken).balanceOf(_to) != 0 || ISecurityToken(securityToken).balanceOf(_from) == _amount) {
                    return Result.NA;
                }
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    /**
     * @notice Used to initialize the variables of the contract
     * @param _maxHolderCount Maximum no. of holders this module allows the SecurityToken to have
     */
    function configure(uint256 _maxHolderCount) public onlyFactory {
        maxHolderCount = _maxHolderCount;
    }

    /**
    * @notice Sets the cap for the amount of token holders there can be
    * @param _maxHolderCount is the new maximum amount of token holders
    */
    function changeHolderCount(uint256 _maxHolderCount) public withPerm(ADMIN) {
        emit ModifyHolderCount(maxHolderCount, _maxHolderCount);
        maxHolderCount = _maxHolderCount;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
     * @notice Returns the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
