pragma solidity 0.5.8;

import "../TransferManager.sol";
import "./CountTransferManagerStorage.sol";
import "../../../interfaces/ISecurityToken.sol";

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
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata /*_data*/
    )
        external
        returns(Result)
    {
        (Result success, ) = _verifyTransfer(_from, _to, _amount, securityToken.holderCount());
        return success;
    }

    /**
     * @notice Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders
     * @dev module.verifyTransfer is called by SecToken.canTransfer and does not receive the updated holderCount therefore
     *      verifyTransfer has to manually account for pot. tokenholder changes (by mimicking TokenLib.adjustInvestorCount).
     *      module.executeTransfer is called by SecToken.transfer|issue|others and receives an updated holderCount 
     *      as sectoken calls TokenLib.adjustInvestorCount before executeTransfer.
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount Amount to send
     */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes memory /* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        uint256 holderCount = securityToken.holderCount();
        if (_amount != 0 && _from != _to) {
            // Check whether receiver is a new token holder
            if (_to != address(0) && securityToken.balanceOf(_to) == 0) {
                holderCount++;
            }
            // Check whether sender is moving all of their tokens
            if (_amount == securityToken.balanceOf(_from)) {
                holderCount--;
            }
        }

        return _verifyTransfer(_from, _to, _amount, holderCount);
    }

    function _verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _holderCount
    )
        internal
        view
        returns(Result, bytes32)
    {
        if (!paused) {
            if (maxHolderCount < _holderCount) {
                // Allow transfers to existing maxHolders
                if (securityToken.balanceOf(_to) != 0 || securityToken.balanceOf(_from) == _amount) {
                    return (Result.NA, bytes32(0));
                }
                return (Result.INVALID, bytes32(uint256(address(this)) << 96));
            }
            return (Result.NA, bytes32(0));
        }
        return (Result.NA, bytes32(0));
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
        return this.configure.selector;
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
