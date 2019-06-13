pragma solidity ^0.5.0;

import "../../../TransferManager/BaseWhitelistTransferManager.sol";
import "./SharedWhitelistTransferManagerStorage.sol";

/**
 * @title Transfer Manager module that uses a shared whitelist for transfer validation functionality
 */
contract SharedWhitelistTransferManager is BaseWhitelistTransferManagerStorage, SharedWhitelistTransferManagerStorage, BaseWhitelistTransferManager {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    // Emit when whitelist address is changed
    event WhitelistDataStoreChanged(address indexed _oldDataStore, address indexed _newDataStore);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken)
    public
    Module(_securityToken, _polyToken)
    {

    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _whitelistDataStore Address of the whitelist contract
     */
    function configure(address _whitelistDataStore) public onlyFactory {
        _changeDataStore(_whitelistDataStore);
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return this.configure.selector;
    }

    /**
     * @notice Allows ADMIN to change whitelist data store
     * @param _whitelistDataStore Address of the whitelist contract
     */
    function changeDataStore(address _whitelistDataStore) external withPerm(ADMIN) {
        _changeDataStore(_whitelistDataStore);
    }

    function _changeDataStore(address _whitelistDataStore) internal {
        require(_whitelistDataStore != address(0), "Invalid address");
        emit WhitelistDataStoreChanged(address(whitelistDataStore), _whitelistDataStore);
        whitelistDataStore = IDataStore(_whitelistDataStore);
    }

    /**
     * @dev overrides abstract function from base contract
     * @notice Default implementation of verifyTransfer used by SecurityToken
     * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
     * If the transfer request comes from a token holder, it checks that:
     * a) Both are on the whitelist
     * b) Seller's sale lockup period is over
     * c) Buyer's purchase lockup is over
     * @param _from Address of the sender
     * @param _to Address of the receiver
    */
    function executeTransfer(
        address _from,
        address _to,
        uint256 /*_amount*/,
        bytes calldata /*_data*/
    ) external returns(Result) {
        (Result success,) = _verifyTransfer(_from, _to);
        // add _to address to token list of potential investors (required for checkpoints)
        if (success == Result.VALID) {
            IDataStore dataStore = getDataStore();
            if (!_isExistingInvestor(_to, dataStore) && _to != address(0)) {
               dataStore.insertAddress(INVESTORSKEY, _to);
            }
        }
        return success;
    }

    function _getKYCValues(address _investor) internal view returns(
        uint64 canSendAfter,
        uint64 canReceiveAfter,
        uint64 expiryTime,
        uint8 added
    )
    {
        uint256 data = whitelistDataStore.getUint256(_getKey(WHITELIST, _investor));
        (canSendAfter, canReceiveAfter, expiryTime, added)  = VersionUtils.unpackKYC(data);
    }

    /**
     * @dev overrides abstract function from base contract
     */
    function _getValuesForTransfer(address _from, address _to) internal view returns(uint64 canSendAfter, uint64 fromExpiry, uint64 canReceiveAfter, uint64 toExpiry) {
        (canSendAfter, , fromExpiry, ) = _getKYCValues(_from);
        (, canReceiveAfter, toExpiry, ) = _getKYCValues(_to);
    }

    /**
     * @notice Returns the count of address that were added as (potential) investors
     * @return Investor count
     */
    function getShareWhitelistInvestorCount() external view returns(uint256) {
        return whitelistDataStore.getAddressArrayLength(INVESTORSKEY);
    }

    /**
     * @dev Returns list of all investors
     * @dev overrides abstract function from base contract
     */
    function getAllInvestors() public view returns(address[] memory investors) {
        investors = whitelistDataStore.getAddressArray(INVESTORSKEY);
    }

    /**
     * @dev Returns list of investors in a range
     * @dev overrides abstract function from base contract
     */
    function getInvestors(uint256 _fromIndex, uint256 _toIndex) public view returns(address[] memory investors) {
        investors = whitelistDataStore.getAddressArrayElements(INVESTORSKEY, _fromIndex, _toIndex);
    }

    /**
     * @dev overrides abstract function from base contract
     */
    function _getInvestorFlags(address _investor) internal view returns(uint256 flags) {
        flags = whitelistDataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
    }

    /**
     * @dev overrides abstract function from base contract
     */
    function _kycData(address[] memory _investors) internal view returns(
        uint256[] memory,
        uint256[] memory,
        uint256[] memory
    ) {
        uint256[] memory canSendAfters = new uint256[](_investors.length);
        uint256[] memory canReceiveAfters = new uint256[](_investors.length);
        uint256[] memory expiryTimes = new uint256[](_investors.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            (canSendAfters[i], canReceiveAfters[i], expiryTimes[i], ) = _getKYCValues(_investors[i]);
        }
        return (canSendAfters, canReceiveAfters, expiryTimes);
    }

    /**
     * @notice return the amount of tokens for a given user as per the partition
     * @param _partition Identifier
     * @param _tokenHolder Whom token amount need to query
     * @param _additionalBalance It is the `_value` that transfer during transfer/transferFrom function call
     */
    function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view returns(uint256) {
        uint256 currentBalance = (msg.sender == securityToken) ? (IERC20(securityToken).balanceOf(_tokenHolder)).add(_additionalBalance) : IERC20(securityToken).balanceOf(_tokenHolder);
        uint256 canSendAfter;
        (canSendAfter,,,) = _getKYCValues(_tokenHolder);
        canSendAfter = (canSendAfter == 0 ? defaults.canSendAfter:  canSendAfter);
        bool unlockedCheck = paused ? _partition == UNLOCKED : (_partition == UNLOCKED && now >= canSendAfter);
        if (((_partition == LOCKED && now < canSendAfter) && !paused) || unlockedCheck)
            return currentBalance;
        else
            return 0;
    }

}
