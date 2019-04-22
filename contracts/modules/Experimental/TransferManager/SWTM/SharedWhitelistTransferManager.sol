pragma solidity ^0.5.0;

import "../../../TransferManager/TransferManager.sol";
import "../../../../libraries/Encoder.sol";
import "../../../../libraries/VersionUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "./SharedWhitelistTransferManagerStorage.sol";

/**
 * @title Transfer Manager module that uses a shared whitelist for transfer validation functionality
 */
contract SharedWhitelistTransferManager is SharedWhitelistTransferManagerStorage, TransferManager {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    // Emit when whitelist address is changed
    event WhitelistDataStoreChanged(address indexed _oldDataStore, address indexed _newDataStore);

    // Emit when Issuance address get changed
    event ChangeIssuanceAddress(address _issuanceAddress);

    // Emit when investor details get modified related to their whitelisting
    event ChangeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter);

    event ModifyTransferRequirements(
        TransferType indexed _transferType,
        bool _fromValidKYC,
        bool _toValidKYC,
        bool _fromRestricted,
        bool _toRestricted
    );

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
     * @notice Used to change the default times used when canSendAfter / canReceiveAfter are zero
     * @param _defaultCanSendAfter default for zero canSendAfter
     * @param _defaultCanReceiveAfter default for zero canReceiveAfter
     */
    function changeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter) public withPerm(ADMIN) {
        /* 0 values are also allowed as they represent that the Issuer
           does not want a default value for these variables.
           0 is also the default value of these variables */
        defaults.canSendAfter = _defaultCanSendAfter;
        defaults.canReceiveAfter = _defaultCanReceiveAfter;
        emit ChangeDefaults(_defaultCanSendAfter, _defaultCanReceiveAfter);
    }

    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(ADMIN) {
        // address(0x0) is also a valid value and in most cases, the address that issues tokens is 0x0.
        issuanceAddress = _issuanceAddress;
        emit ChangeIssuanceAddress(_issuanceAddress);
    }

    /**
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
        return success;
    }

    /**
     * @notice Default implementation of verifyTransfer used by SecurityToken
     * @param _from Address of the sender
     * @param _to Address of the receiver
    */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 /*_amount*/,
        bytes memory /* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        return _verifyTransfer(_from, _to);
    }

    function _verifyTransfer(
        address _from,
        address _to
    )
        internal
        view
        returns(Result, bytes32)
    {
        if (!paused) {
            TransferRequirements memory txReq;
            uint64 canSendAfter;
            uint64 fromExpiry;
            uint64 toExpiry;
            uint64 canReceiveAfter;

            if (_from == issuanceAddress) {
                txReq = transferRequirements[uint8(TransferType.ISSUANCE)];
            } else if (_to == address(0)) {
                txReq = transferRequirements[uint8(TransferType.REDEMPTION)];
            } else {
                txReq = transferRequirements[uint8(TransferType.GENERAL)];
            }

            (canSendAfter, fromExpiry, canReceiveAfter, toExpiry) = _getValuesForTransfer(_from, _to);

            if ((txReq.fromValidKYC && !_validExpiry(fromExpiry)) || (txReq.toValidKYC && !_validExpiry(toExpiry))) {
                return (Result.NA, bytes32(0));
            }

            (canSendAfter, canReceiveAfter) = _adjustTimes(canSendAfter, canReceiveAfter);

            if ((txReq.fromRestricted && !_validLockTime(canSendAfter)) || (txReq.toRestricted && !_validLockTime(canReceiveAfter))) {
                return (Result.NA, bytes32(0));
            }

            return (Result.VALID, getAddressBytes32());
        }
        return (Result.NA, bytes32(0));
    }

    /**
    * @notice Modifies the successful checks required for a transfer to be deemed valid.
    * @param _transferType Type of transfer (0 = General, 1 = Issuance, 2 = Redemption)
    * @param _fromValidKYC Defines if KYC is required for the sender
    * @param _toValidKYC Defines if KYC is required for the receiver
    * @param _fromRestricted Defines if transfer time restriction is checked for the sender
    * @param _toRestricted Defines if transfer time restriction is checked for the receiver
    */
    function modifyTransferRequirements(
        TransferType _transferType,
        bool _fromValidKYC,
        bool _toValidKYC,
        bool _fromRestricted,
        bool _toRestricted
    ) public withPerm(ADMIN) {
        _modifyTransferRequirements(
            _transferType,
            _fromValidKYC,
            _toValidKYC,
            _fromRestricted,
            _toRestricted
        );
    }

    /**
    * @notice Modifies the successful checks required for transfers.
    * @param _transferTypes Types of transfer (0 = General, 1 = Issuance, 2 = Redemption)
    * @param _fromValidKYC Defines if KYC is required for the sender
    * @param _toValidKYC Defines if KYC is required for the receiver
    * @param _fromRestricted Defines if transfer time restriction is checked for the sender
    * @param _toRestricted Defines if transfer time restriction is checked for the receiver
    */
    function modifyTransferRequirementsMulti(
        TransferType[] memory _transferTypes,
        bool[] memory _fromValidKYC,
        bool[] memory _toValidKYC,
        bool[] memory _fromRestricted,
        bool[] memory _toRestricted
    ) public withPerm(ADMIN) {
        require(
            _transferTypes.length == _fromValidKYC.length &&
            _fromValidKYC.length == _toValidKYC.length &&
            _toValidKYC.length == _fromRestricted.length &&
            _fromRestricted.length == _toRestricted.length,
            "Mismatched input lengths"
        );

        for (uint256 i = 0; i <  _transferTypes.length; i++) {
            _modifyTransferRequirements(
                _transferTypes[i],
                _fromValidKYC[i],
                _toValidKYC[i],
                _fromRestricted[i],
                _toRestricted[i]
            );
        }
    }

    function _modifyTransferRequirements(
        TransferType _transferType,
        bool _fromValidKYC,
        bool _toValidKYC,
        bool _fromRestricted,
        bool _toRestricted
    ) internal {
        transferRequirements[uint8(_transferType)] =
            TransferRequirements(
                _fromValidKYC,
                _toValidKYC,
                _fromRestricted,
                _toRestricted
            );

        emit ModifyTransferRequirements(
            _transferType,
            _fromValidKYC,
            _toValidKYC,
            _fromRestricted,
            _toRestricted
        );
    }

    /**
     * @notice Internal function used to check whether the KYC of investor is valid
     * @param _expiryTime Expiry time of the investor
     */
    function _validExpiry(uint64 _expiryTime) internal view returns(bool valid) {
        if (_expiryTime >= uint64(now)) /*solium-disable-line security/no-block-members*/
            valid = true;
    }

    /**
     * @notice Internal function used to check whether the lock time of investor is valid
     * @param _lockTime Lock time of the investor
     */
    function _validLockTime(uint64 _lockTime) internal view returns(bool valid) {
        if (_lockTime <= uint64(now)) /*solium-disable-line security/no-block-members*/
            valid = true;
    }

    /**
     * @notice Internal function to adjust times using default values
     */
    function _adjustTimes(uint64 _canSendAfter, uint64 _canReceiveAfter) internal view returns(uint64, uint64) {
        if (_canSendAfter == 0) {
            _canSendAfter = defaults.canSendAfter;
        }
        if (_canReceiveAfter == 0) {
            _canReceiveAfter = defaults.canReceiveAfter;
        }
        return (_canSendAfter, _canReceiveAfter);
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
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

    function _getValuesForTransfer(address _from, address _to) internal view returns(uint64 canSendAfter, uint64 fromExpiry, uint64 canReceiveAfter, uint64 toExpiry) {
        (canSendAfter, , fromExpiry, ) = _getKYCValues(_from);
        (, canReceiveAfter, toExpiry, ) = _getKYCValues(_to);
    }

    /**
     * @dev Returns list of all investors
     */
    function getAllInvestors() public view returns(address[] memory investors) {
        investors = whitelistDataStore.getAddressArray(INVESTORSKEY);
    }

    /**
     * @dev Returns list of investors in a range
     */
    function getInvestors(uint256 _fromIndex, uint256 _toIndex) public view returns(address[] memory investors) {
        investors = whitelistDataStore.getAddressArrayElements(INVESTORSKEY, _fromIndex, _toIndex);
    }

    function getAllInvestorFlags() public view returns(address[] memory investors, uint256[] memory flags) {
        investors = getAllInvestors();
        flags = new uint256[](investors.length);
        for (uint256 i = 0; i < investors.length; i++) {
            flags[i] = _getInvestorFlags(investors[i]);
        }
    }

    function getInvestorFlag(address _investor, uint8 _flag) public view returns(bool value) {
        uint256 flag = (_getInvestorFlags(_investor) >> _flag) & ONE;
        value = flag > 0 ? true : false;
    }

    function getInvestorFlags(address _investor) public view returns(uint256 flags) {
        flags = _getInvestorFlags(_investor);
    }

    function _getInvestorFlags(address _investor) public view returns(uint256 flags) {
        flags = whitelistDataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
    }

    /**
     * @dev Returns list of all investors data
     */
    function getAllKYCData() external view returns(
        address[] memory investors,
        uint256[] memory canSendAfters,
        uint256[] memory canReceiveAfters,
        uint256[] memory expiryTimes
    ) {
        investors = getAllInvestors();
        (canSendAfters, canReceiveAfters, expiryTimes) = _kycData(investors);
        return (investors, canSendAfters, canReceiveAfters, expiryTimes);
    }

    /**
     * @dev Returns list of specified investors data
     */
    function getKYCData(address[] calldata _investors) external view returns(
        uint256[] memory,
        uint256[] memory,
        uint256[] memory
    ) {
        return _kycData(_investors);
    }

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
     * @notice Return the permissions flag that are associated with general trnasfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
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

    function getAddressBytes32() public view returns(bytes32) {
        return bytes32(uint256(address(this)) << 96);
    }

}
