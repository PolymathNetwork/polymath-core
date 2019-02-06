pragma solidity ^0.5.0;

import "./TransferManager.sol";
import "../../libraries/Encoder.sol";
import "../../libraries/VersionUtils.sol";
import "../../storage/GeneralTransferManagerStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManager is GeneralTransferManagerStorage, TransferManager {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    // Emit when Issuance address get changed
    event ChangeIssuanceAddress(address _issuanceAddress);
    // Emit when there is change in the flag variable called allowAllTransfers
    event AllowAllTransfers(bool _allowAllTransfers);
    // Emit when there is change in the flag variable called allowAllWhitelistTransfers
    event AllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers);
    // Emit when there is change in the flag variable called allowAllWhitelistIssuances
    event AllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances);
    // Emit when there is change in the flag variable called allowAllBurnTransfers
    event AllowAllBurnTransfers(bool _allowAllBurnTransfers);
    // Emit when there is change in the flag variable called signingAddress
    event ChangeSigningAddress(address _signingAddress);
    // Emit when investor details get modified related to their whitelisting
    event ChangeDefaults(uint64 _defaultFromTime, uint64 _defaultToTime);

    // _fromTime is the time from which the _investor can send tokens
    // _toTime is the time from which the _investor can receive tokens
    // if allowAllWhitelistIssuances is TRUE, then _toTime is ignored when receiving tokens from the issuance address
    // if allowAllWhitelistTransfers is TRUE, then _toTime and _fromTime is ignored when sending or receiving tokens
    // in any case, any investor sending or receiving tokens, must have a _expiryTime in the future
    event ModifyWhitelist(
        address indexed _investor,
        uint256 _dateAdded,
        address indexed _addedBy,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime,
        bool _canBuyFromSTO,
        bool _isAccredited
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
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Used to change the default times used when fromTime / toTime are zero
     * @param _defaultFromTime default for zero fromTime
     * @param _defaultToTime default for zero toTime
     */
    function changeDefaults(uint64 _defaultFromTime, uint64 _defaultToTime) public withPerm(FLAGS) {
        defaults.fromTime = _defaultFromTime;
        defaults.toTime = _defaultToTime;
        emit ChangeDefaults(_defaultFromTime, _defaultToTime);
    }

    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        issuanceAddress = _issuanceAddress;
        emit ChangeIssuanceAddress(_issuanceAddress);
    }

    /**
     * @notice Used to change the Sigining Address
     * @param _signingAddress new address for the signing
     */
    function changeSigningAddress(address _signingAddress) public withPerm(FLAGS) {
        signingAddress = _signingAddress;
        emit ChangeSigningAddress(_signingAddress);
    }

    /**
     * @notice Used to change the flag
            true - It refers there are no transfer restrictions, for any addresses
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllTransfers flag value
     */
    function changeAllowAllTransfers(bool _allowAllTransfers) public withPerm(FLAGS) {
        allowAllTransfers = _allowAllTransfers;
        emit AllowAllTransfers(_allowAllTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for transfers (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistTransfers flag value
     */
    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public withPerm(FLAGS) {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        emit AllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for issuances (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistIssuances flag value
     */
    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public withPerm(FLAGS) {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        emit AllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    /**
     * @notice Used to change the flag
            true - It allow to burn the tokens
            false - It deactivate the burning mechanism.
     * @param _allowAllBurnTransfers flag value
     */
    function changeAllowAllBurnTransfers(bool _allowAllBurnTransfers) public withPerm(FLAGS) {
        allowAllBurnTransfers = _allowAllBurnTransfers;
        emit AllowAllBurnTransfers(_allowAllBurnTransfers);
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
    function verifyTransfer(
        address _from,
        address _to,
        uint256, /*_amount*/
        bytes calldata, /* _data */
        bool /* _isTransfer */
    ) external returns(Result) {
        if (!paused) {
            uint64 fromTime;
            uint64 fromExpiry;
            uint64 toExpiry;
            uint64 toTime;
            uint8 canBuyFromSTO;
            if (allowAllTransfers) {
                //All transfers allowed, regardless of whitelist
                return Result.VALID;
            }
            if (allowAllBurnTransfers && (_to == address(0))) {
                return Result.VALID;
            }

            (fromTime, fromExpiry, canBuyFromSTO, toTime, toExpiry) = _getValuesForTransfer(_from, _to);

            if (allowAllWhitelistTransfers) {
                //Anyone on the whitelist can transfer, regardless of time
                return (_validExpiry(toExpiry) && _validExpiry(fromExpiry)) ? Result.VALID : Result.NA;
            }
            // Using the local variables to avoid the stack too deep error
            (fromTime, toTime) = _adjustTimes(fromTime, toTime);
            if (_from == issuanceAddress) {
                // Possible STO transaction, but investor not allowed to purchased from STO
                if ((canBuyFromSTO == uint8(0)) && _isSTOAttached()) {
                    return Result.NA;
                }
                // if allowAllWhitelistIssuances is true, so time stamp ignored
                if (allowAllWhitelistIssuances) {
                    return _validExpiry(toExpiry) ? Result.VALID : Result.NA;
                } else {
                    return (_validExpiry(toExpiry) && _validLockTime(toTime)) ? Result.VALID : Result.NA;
                }
            }

            //Anyone on the whitelist can transfer provided the blocknumber is large enough
            /*solium-disable-next-line security/no-block-members*/
            return (_validExpiry(fromExpiry) && _validLockTime(fromTime) && _validExpiry(toExpiry) &&
                _validLockTime(toTime)) ? Result.VALID : Result.NA; /*solium-disable-line security/no-block-members*/
        }
        return Result.NA;
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    * @param _isAccredited is used to differentiate whether the investor is Accredited or not.
    */
    function modifyWhitelist(
        address _investor,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime,
        bool _canBuyFromSTO,
        bool _isAccredited
    )
        public
        withPerm(WHITELIST)
    {
        _modifyWhitelist(_investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _isAccredited);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    * @param _isAccredited is used to differentiate whether the investor is Accredited or not.
    */
    function _modifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime, uint256 _expiryTime, bool _canBuyFromSTO, bool _isAccredited) internal {
        require(_investor != address(0), "Invalid investor");
        uint8 added;
        uint8 canBuyFromSTO;
        uint8 isAccredited;
        IDataStore dataStore = IDataStore(getDataStore());
        added = _getAddedValue(_investor, dataStore);
        if (added == uint8(0)) {
           investors.push(_investor);
        }
        canBuyFromSTO = _canBuyFromSTO ? 1 : 0;
        isAccredited = _isAccredited ? 1 : 0;
        uint256 _data = VersionUtils.packKYC(uint64(_fromTime), uint64(_toTime), uint64(_expiryTime), canBuyFromSTO, uint8(1), isAccredited);
        dataStore.setUint256(_getKey(WHITELIST, _investor), _data);
        emit ModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _isAccredited);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investors List of the addresses to whitelist
    * @param _fromTimes An array of the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTimes An array of the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTimes An array of the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO An array of boolean values.
    * @param _isAccredited An array of boolean values to differentiate whether the investor is Accredited or not.
    */
    function modifyWhitelistMulti(
        address[] memory _investors,
        uint256[] memory _fromTimes,
        uint256[] memory _toTimes,
        uint256[] memory _expiryTimes,
        bool[] memory _canBuyFromSTO,
        bool[] memory _isAccredited
    )
        public
        withPerm(WHITELIST)
    {
        require(
            _investors.length == _fromTimes.length &&
            _fromTimes.length == _toTimes.length &&
            _toTimes.length == _expiryTimes.length &&
            _canBuyFromSTO.length == _toTimes.length &&
            _canBuyFromSTO.length == _isAccredited.length,
            "Mismatched input lengths"
        );
        for (uint256 i = 0; i < _investors.length; i++) {
            _modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i], _expiryTimes[i], _canBuyFromSTO[i], _isAccredited[i]);
        }
    }

    /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    * @param _isAccredited is used to differentiate whether the investor is Accredited or not.
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _nonce nonce of signature (avoid replay attack)
    * @param _signature issuer signature
    */
    function modifyWhitelistSigned(
        address _investor,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime,
        bool _canBuyFromSTO,
        bool _isAccredited,
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _nonce,
        bytes memory _signature
    )
        public
    {
        /*solium-disable-next-line security/no-block-members*/
        require(_validFrom <= now, "ValidFrom is too early");
        /*solium-disable-next-line security/no-block-members*/
        require(_validTo >= now, "ValidTo is too late");
        require(!nonceMap[_investor][_nonce], "Already used signature");
        nonceMap[_investor][_nonce] = true;
        bytes32 hash = keccak256(
            abi.encodePacked(this, _investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _isAccredited, _validFrom, _validTo, _nonce)
        );
        _checkSig(hash, _signature);
        _modifyWhitelist(_investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _isAccredited);
    }

    /**
     * @notice Used to verify the signature
     */
    function _checkSig(bytes32 _hash, bytes memory _signature) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _fromTime, _toTime & _expiryTime and be signed by the issuer address
        address signer = _hash.toEthSignedMessageHash().recover(_signature);
        require(signer == Ownable(securityToken).owner() || signer == signingAddress, "Incorrect signer");
    }

    /**
     * @notice Internal function used to check whether the KYC of investor is valid
     * @param _expiryTime Expiry time of the investor
     */
    function _validExpiry(uint64 _expiryTime) internal view returns(bool) {
        return (_expiryTime >= uint64(now)); /*solium-disable-line security/no-block-members*/
    }

    /**
     * @notice Internal function used to check whether the lock time of investor is valid
     * @param _lockTime Lock time of the investor
     */
    function _validLockTime(uint64 _lockTime) internal view returns(bool) {
        return (_lockTime <= uint64(now)); /*solium-disable-line security/no-block-members*/
    }

    /**
     * @notice Internal function use to know whether the STO is attached or not
     */
    function _isSTOAttached() internal view returns(bool) {
        bool attached = ISecurityToken(securityToken).getModulesByType(3).length > 0;
        return attached;
    }

    /**
     * @notice Internal function to adjust times using default values
     */
    function _adjustTimes(uint64 _fromTime, uint64 _toTime) internal view returns(uint64, uint64) {
        uint64 adjustedFromTime = _fromTime;
        uint64 adjustedToTime = _toTime;
        if (_fromTime == 0) {
            adjustedFromTime = defaults.fromTime;
        }
        if (_toTime == 0) {
            adjustedToTime = defaults.toTime;
        }
        return (adjustedFromTime, adjustedToTime);
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

    function _getValues(address _investor, IDataStore dataStore) internal view returns(
        uint64 fromTime,
        uint64 toTime,
        uint64 expiryTime,
        uint8 canBuyFromSTO,
        uint8 added,
        uint8 isAccredited
    )
    {
        uint256 _whitelistData = dataStore.getUint256(_getKey(WHITELIST, _investor));
        (fromTime, toTime, expiryTime, canBuyFromSTO, added, isAccredited)  = VersionUtils.unpackKYC(_whitelistData);
    }

    function _getAddedValue(address _investor, IDataStore dataStore) internal view returns(uint8) {
        uint256 _whitelistData = dataStore.getUint256(_getKey(WHITELIST, _investor));
        //extracts `added` from packed `_whitelistData`
        return uint8(_whitelistData >> 8);
    }

    function _getValuesForTransfer(address _from, address _to) internal view returns(uint64 fromTime, uint64 fromExpiry, uint8 canBuyFromSTO, uint64 toTime, uint64 toExpiry) {
        IDataStore dataStore = IDataStore(getDataStore());
        (fromTime,, fromExpiry,,,) = _getValues(_from, dataStore);
        (, toTime, toExpiry, canBuyFromSTO,,) = _getValues(_to, dataStore);
    }

    /**
     * @dev Returns list of all investors
     */
    function getInvestors() public view returns(address[] memory) {
        return investors;
    }

    /**
     * @dev Returns list of all investors data
     */
    function getAllInvestorsData() external view returns(
        address[] memory,
        uint256[] memory fromTimes,
        uint256[] memory toTimes,
        uint256[] memory expiryTimes,
        bool[] memory canBuyFromSTOs,
        bool[] memory isAccrediteds
    ) {
        (fromTimes, toTimes, expiryTimes, canBuyFromSTOs, isAccrediteds) = _investorsData(getInvestors());
        return (getInvestors(), fromTimes, toTimes, expiryTimes, canBuyFromSTOs, isAccrediteds);

    }

    /**
     * @dev Returns list of specified investors data
     */
    function getInvestorsData(address[] calldata _investors) external view returns(
        uint256[] memory,
        uint256[] memory,
        uint256[] memory,
        bool[] memory,
        bool[] memory
    ) {
        return _investorsData(_investors);
    }

    function _investorsData(address[] memory _investors) internal view returns(
        uint256[] memory,
        uint256[] memory,
        uint256[] memory,
        bool[] memory,
        bool[] memory
    ) {
        uint256[] memory fromTimes = new uint256[](_investors.length);
        uint256[] memory toTimes = new uint256[](_investors.length);
        uint256[] memory expiryTimes = new uint256[](_investors.length);
        bool[] memory canBuyFromSTOs = new bool[](_investors.length);
        bool[] memory isAccrediteds = new bool[](_investors.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            uint8 canBuyFromSTO;
            uint8 isAccredited;
            (fromTimes[i], toTimes[i], expiryTimes[i], canBuyFromSTO,,isAccredited) = _getValues(_investors[i], IDataStore(getDataStore()));
            canBuyFromSTOs[i] = canBuyFromSTO == 0 ? false : true;
            isAccrediteds[i] = isAccredited == 0 ? false : true;
        }
        return (fromTimes, toTimes, expiryTimes, canBuyFromSTOs, isAccrediteds);
    }

    /**
     * @notice Return the permissions flag that are associated with general trnasfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = WHITELIST;
        allPermissions[1] = FLAGS;
        return allPermissions;
    }

}
