pragma solidity ^0.5.0;

import "./TransferManager.sol";
import "../../libraries/Encoder.sol";
import "../../libraries/VersionUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "../../storage/modules/TransferManager/GeneralTransferManagerStorage.sol";

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
    event ModifyKYCData(
        address indexed _investor,
        address indexed _addedBy,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime
    );

    event ModifyInvestorFlag(
        address indexed _investor,
        uint8 indexed _flag,
        bool _value
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
    function changeDefaults(uint64 _defaultFromTime, uint64 _defaultToTime) public withPerm(ADMIN) {
        defaults.fromTime = _defaultFromTime;
        defaults.toTime = _defaultToTime;
        emit ChangeDefaults(_defaultFromTime, _defaultToTime);
    }

    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(ADMIN) {
        issuanceAddress = _issuanceAddress;
        emit ChangeIssuanceAddress(_issuanceAddress);
    }

    /**
     * @notice Used to change the Sigining Address
     * @param _signingAddress new address for the signing
     */
    function changeSigningAddress(address _signingAddress) public withPerm(ADMIN) {
        signingAddress = _signingAddress;
        emit ChangeSigningAddress(_signingAddress);
    }

    /**
     * @notice Used to change the flag
            true - It refers there are no transfer restrictions, for any addresses
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllTransfers flag value
     */
    function changeAllowAllTransfers(bool _allowAllTransfers) public withPerm(ADMIN) {
        allowAllTransfers = _allowAllTransfers;
        emit AllowAllTransfers(_allowAllTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for transfers (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistTransfers flag value
     */
    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public withPerm(ADMIN) {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        emit AllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for issuances (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistIssuances flag value
     */
    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public withPerm(ADMIN) {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        emit AllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    /**
     * @notice Used to change the flag
            true - It allow to burn the tokens
            false - It deactivate the burning mechanism.
     * @param _allowAllBurnTransfers flag value
     */
    function changeAllowAllBurnTransfers(bool _allowAllBurnTransfers) public withPerm(ADMIN) {
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
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external returns(Result) {
       (Result success,) = verifyTransfer(_from, _to, _amount, _data);
       return success;
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
        bytes memory /* _data */
    ) 
        public
        view
        returns(Result, bytes32)
    {
        Result success;
        if (!paused) {
            uint64 fromTime;
            uint64 fromExpiry;
            uint64 toExpiry;
            uint64 toTime;
            if (allowAllTransfers) {
                //All transfers allowed, regardless of whitelist
                return (Result.VALID, getAddressBytes32());
            }
            if (allowAllBurnTransfers && (_to == address(0))) {
                return (Result.VALID, getAddressBytes32());
            }

            (fromTime, fromExpiry, toTime, toExpiry) = _getValuesForTransfer(_from, _to);

            if (allowAllWhitelistTransfers) {
                //Anyone on the whitelist can transfer, regardless of time
                success = (_validExpiry(toExpiry) && _validExpiry(fromExpiry)) ? Result.VALID : Result.NA;
                return (success, success == Result.VALID ? getAddressBytes32() : bytes32(0));
            }
            // Using the local variables to avoid the stack too deep error
            (fromTime, toTime) = _adjustTimes(fromTime, toTime);
            if (_from == issuanceAddress) {
                // if allowAllWhitelistIssuances is true, so time stamp ignored
                if (allowAllWhitelistIssuances) {
                    success = _validExpiry(toExpiry) ? Result.VALID : Result.NA;
                    return (success, success == Result.VALID ? getAddressBytes32() : bytes32(0));
                } else {
                    success = (_validExpiry(toExpiry) && _validLockTime(toTime)) ? Result.VALID : Result.NA;
                    return (success, success == Result.VALID ? getAddressBytes32() : bytes32(0));
                }
            }

            //Anyone on the whitelist can transfer provided the blocknumber is large enough
            /*solium-disable-next-line security/no-block-members*/
            success = (_validExpiry(fromExpiry) && _validLockTime(fromTime) && _validExpiry(toExpiry) &&
                _validLockTime(toTime)) ? Result.VALID : Result.NA; /*solium-disable-line security/no-block-members*/
            return (success, success == Result.VALID ? getAddressBytes32() : bytes32(0));
        }
        return (Result.NA, bytes32(0));
    }


    /**
    * @notice Add or remove KYC info of an investor.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    */
    function modifyKYCData(
        address _investor,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime
    )
        public
        withPerm(ADMIN)
    {
        _modifyKYCData(_investor, _fromTime, _toTime, _expiryTime);
    }

    function _modifyKYCData(address _investor, uint256 _fromTime, uint256 _toTime, uint256 _expiryTime) internal {
        require(_investor != address(0), "Invalid investor");
        IDataStore dataStore = IDataStore(getDataStore());
        if (!_isExistingInvestor(_investor, dataStore)) {
           dataStore.insertAddress(INVESTORSKEY, _investor);
        }
        uint256 _data = VersionUtils.packKYC(uint64(_fromTime), uint64(_toTime), uint64(_expiryTime), uint8(1));
        dataStore.setUint256(_getKey(WHITELIST, _investor), _data);
        emit ModifyKYCData(_investor, msg.sender, _fromTime, _toTime, _expiryTime);
    }

    /**
    * @notice Add or remove KYC info of an investor.
    * @param _investors is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    */
    function modifyKYCDataMulti(
        address[] memory _investors,
        uint256[] memory _fromTime,
        uint256[] memory _toTime,
        uint256[] memory _expiryTime
    )
        public
        withPerm(ADMIN)
    {
        require(
            _investors.length == _fromTime.length &&
            _fromTime.length == _toTime.length &&
            _toTime.length == _expiryTime.length,
            "Mismatched input lengths"
        );
        for (uint256 i = 0; i < _investors.length; i++) {
            _modifyKYCData(_investors[i], _fromTime[i], _toTime[i], _expiryTime[i]);
        }
    }

    /**
    * @notice Used to modify investor Flag.
    * @dev Flags are properties about investors that can be true or false like isAccredited
    * @param _investor is the address of the investor.
    * @param _flag index of flag to change. flag is used to know specifics about investor like isAccredited.
    * @param _value value of the flag. a flag can be true or false.
    */
    function modifyInvestorFlag(
        address _investor,
        uint8 _flag,
        bool _value
    )
        public
        withPerm(ADMIN)
    {
        _modifyInvestorFlag(_investor, _flag, _value);
    }


    function _modifyInvestorFlag(address _investor, uint8 _flag, bool _value) internal {
        require(_investor != address(0), "Invalid investor");
        IDataStore dataStore = IDataStore(getDataStore());
        if (!_isExistingInvestor(_investor, dataStore)) {
           dataStore.insertAddress(INVESTORSKEY, _investor);
           //KYC data can not be present if added is false and hence we can set packed KYC as uint256(1) to set added as true
           dataStore.setUint256(_getKey(WHITELIST, _investor), uint256(1));
        }
        //NB Flags are packed together in a uint256 to save gas. We can have a maximum of 256 flags.
        uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
        if (_value)
            flags = flags | (ONE << _flag);
        else
            flags = flags & ~(ONE << _flag);
        dataStore.setUint256(_getKey(INVESTORFLAGS, _investor), flags);
        emit ModifyInvestorFlag(_investor, _flag, _value);
    }

    /**
    * @notice Used to modify investor data.
    * @param _investors List of the addresses to modify data about.
    * @param _flag index of flag to change. flag is used to know specifics about investor like isAccredited.
    * @param _value value of the flag. a flag can be true or false.
    */
    function modifyInvestorFlagMulti(
        address[] memory _investors,
        uint8[] memory _flag,
        bool[] memory _value
    )
        public
        withPerm(ADMIN)
    {
        require(
            _investors.length == _flag.length &&
            _flag.length == _value.length,
            "Mismatched input lengths"
        );
        for (uint256 i = 0; i < _investors.length; i++) {
            _modifyInvestorFlag(_investors[i], _flag[i], _value[i]);
        }
    }

    /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _nonce nonce of signature (avoid replay attack)
    * @param _signature issuer signature
    */
    function modifyKYCDataSigned(
        address _investor,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime,
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
            abi.encodePacked(this, _investor, _fromTime, _toTime, _expiryTime, _validFrom, _validTo, _nonce)
        );
        _checkSig(hash, _signature);
        _modifyKYCData(_investor, _fromTime, _toTime, _expiryTime);
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

    function _getKYCValues(address _investor, IDataStore dataStore) internal view returns(
        uint64 fromTime,
        uint64 toTime,
        uint64 expiryTime,
        uint8 added
    )
    {
        uint256 data = dataStore.getUint256(_getKey(WHITELIST, _investor));
        (fromTime, toTime, expiryTime, added)  = VersionUtils.unpackKYC(data);
    }

    function _isExistingInvestor(address _investor, IDataStore dataStore) internal view returns(bool) {
        uint256 data = dataStore.getUint256(_getKey(WHITELIST, _investor));
        //extracts `added` from packed `_whitelistData`
        return uint8(data) == 0 ? false : true;
    }

    function _getValuesForTransfer(address _from, address _to) internal view returns(uint64 fromTime, uint64 fromExpiry, uint64 toTime, uint64 toExpiry) {
        IDataStore dataStore = IDataStore(getDataStore());
        (fromTime, , fromExpiry, ) = _getKYCValues(_from, dataStore);
        (, toTime, toExpiry, ) = _getKYCValues(_to, dataStore);
    }

    /**
     * @dev Returns list of all investors
     */
    function getAllInvestors() public view returns(address[] memory investors) {
        IDataStore dataStore = IDataStore(getDataStore());
        investors = dataStore.getAddressArray(INVESTORSKEY);
    }

    /**
     * @dev Returns list of investors in a range
     */
    function getInvestors(uint256 _fromIndex, uint256 _toIndex) public view returns(address[] memory investors) {
        IDataStore dataStore = IDataStore(getDataStore());
        investors = dataStore.getAddressArrayElements(INVESTORSKEY, _fromIndex, _toIndex);
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
        IDataStore dataStore = IDataStore(getDataStore());
        flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
    }

    /**
     * @dev Returns list of all investors data
     */
    function getAllKYCData() external view returns(
        address[] memory investors,
        uint256[] memory fromTimes,
        uint256[] memory toTimes,
        uint256[] memory expiryTimes
    ) {
        investors = getAllInvestors();
        (fromTimes, toTimes, expiryTimes) = _kycData(investors);
        return (investors, fromTimes, toTimes, expiryTimes);
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
        uint256[] memory fromTimes = new uint256[](_investors.length);
        uint256[] memory toTimes = new uint256[](_investors.length);
        uint256[] memory expiryTimes = new uint256[](_investors.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            (fromTimes[i], toTimes[i], expiryTimes[i], ) = _getKYCValues(_investors[i], IDataStore(getDataStore()));
        }
        return (fromTimes, toTimes, expiryTimes);
    }

    /**
     * @notice return the amount of tokens for a given user as per the partition
     */
    function getTokensByPartition(address /*_owner*/, bytes32 /*_partition*/) external view returns(uint256){
        return 0;
    } 

    /**
     * @notice Return the permissions flag that are associated with general trnasfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    function getAddressBytes32() public view returns(bytes32) {
        return bytes32(uint256(address(this)) << 96); 
    }

}
