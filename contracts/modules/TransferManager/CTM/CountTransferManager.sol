pragma solidity ^0.5.0;

import "../TransferManager.sol";
import "./CountTransferManagerStorage.sol";
import "../../../interfaces/ISecurityToken.sol";

/**
 * @title Transfer Manager for limiting maximum number of token holders
 */
contract CountTransferManager is CountTransferManagerStorage, TransferManager {

    event ModifyHolderCount(
        uint256 _oldHolderCount,
        uint256 _newHolderCount,
        uint256 _oldNonAccreditedHolderCount,
        uint256 _newNonAccreditedHolderCount
    );

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
        (Result success, ) = _verifyTransfer(_from, _to, _amount);
        return success;
    }

    /**
     * @notice Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders
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
        return _verifyTransfer(_from, _to, _amount);
    }

    function _verifyTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        internal
        view
        returns(Result, bytes32)
    {
        if (!paused) {
            if (maxHolderCount < ISecurityToken(securityToken).holderCount()) {
                // Allow transfers to existing maxHolders
                if (ISecurityToken(securityToken).balanceOf(_to) != 0 || ISecurityToken(securityToken).balanceOf(_from) == _amount) {
                    return (Result.NA, bytes32(0));
                }
                return (Result.INVALID, bytes32(uint256(address(this)) << 96));
            }
            if (maxNonAccreditedHolderCount < ISecurityToken(securityToken).nonAccreditedHolderCount()) {
                // Allow transfers to that do not increase the non accredited holders count
                if (ISecurityToken(securityToken).balanceOf(_to) != 0) {
                    return (Result.NA, bytes32(0));
                } else if (ISecurityToken(securityToken).balanceOf(_from) == _amount) {
                    IDataStore dataStore = getDataStore();
                    if (!_isAccredited(_from, dataStore) || _isAccredited(_to, dataStore)) {
                        return (Result.NA, bytes32(0));
                    }
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
    function configure(uint256 _maxHolderCount, uint256 _maxNonAccreditedHolderCount) public onlyFactory {
        maxHolderCount = _maxHolderCount;
        maxNonAccreditedHolderCount = _maxNonAccreditedHolderCount;
    }

    /**
    * @notice Sets the cap for the amount of token holders there can be
    * @param _maxHolderCount is the new maximum amount of token holders
    */
    function changeHolderCount(uint256 _maxHolderCount, uint256 _maxNonAccreditedHolderCount) public withPerm(ADMIN) {
        emit ModifyHolderCount(maxHolderCount, _maxHolderCount,maxNonAccreditedHolderCount, _maxNonAccreditedHolderCount);
        maxHolderCount = _maxHolderCount;
        maxNonAccreditedHolderCount = _maxNonAccreditedHolderCount;
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

    function _isAccredited(address _investor, IDataStore dataStore) internal view returns(bool) {
        uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
        uint256 flag = flags & uint256(1); //isAccredited is flag 0 so we don't need to bit shift flags.
        return flag > 0 ? true : false;
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

}
