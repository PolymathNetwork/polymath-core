pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "./GeneralTransferManagerStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManager is GeneralTransferManagerStorage, ITransferManager {

    using SafeMath for uint256;

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
    event OffsetModified(uint64 _time, uint8 _isForward);

    event ModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy,
        uint64 _fromTime,
        uint64 _toTime,
        uint64 _expiryTime,
        uint8 _canBuyFromSTO
    );

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }

    function modifyOffset(uint64 _time, uint8 _isForward) public withPerm(FLAGS) {
        offset.time = _time;
        offset.isForward = _isForward;
        emit OffsetModified(_time, _isForward);
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
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
    function verifyTransfer(address _from, address _to, uint256 /*_amount*/, bytes /* _data */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (allowAllTransfers) {
                //All transfers allowed, regardless of whitelist
                return Result.VALID;
            }
            if (allowAllBurnTransfers && (_to == address(0))) {
                return Result.VALID;
            }
            if (allowAllWhitelistTransfers) {
                //Anyone on the whitelist can transfer, regardless of time
                return (_onWhitelist(_to) && _onWhitelist(_from)) ? Result.VALID : Result.NA;
            }
            if (_from == issuanceAddress && (whitelist[_to].canBuyFromSTO == 0) && _isSTOAttached()) {
                return Result.NA;
            }
            if (allowAllWhitelistIssuances && _from == issuanceAddress) {
                return _onWhitelist(_to) ? Result.VALID : Result.NA;
            }
            if (_from == issuanceAddress) {
                return (_onWhitelist(_to) && _adjustTimes(whitelist[_to].toTime) <= uint64(now)) ? Result.VALID : Result.NA;
            }
            //Anyone on the whitelist can transfer provided the blocknumber is large enough
            /*solium-disable-next-line security/no-block-members*/
            return ((_onWhitelist(_from) && _adjustTimes(whitelist[_from].fromTime) <= uint64(now)) &&
                (_onWhitelist(_to) && _adjustTimes(whitelist[_to].toTime) <= uint64(now))) ? Result.VALID : Result.NA; /*solium-disable-line security/no-block-members*/
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
    */
    function modifyWhitelist(
        address _investor,
        uint64 _fromTime,
        uint64 _toTime,
        uint64 _expiryTime,
        uint8 _canBuyFromSTO
    )
        public
        withPerm(WHITELIST)
    {
        _modifyWhitelist(_investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    */
    function _modifyWhitelist(
        address _investor,
        uint64 _fromTime,
        uint64 _toTime,
        uint64 _expiryTime,
        uint8 _canBuyFromSTO
    )
        internal
    {
        if (whitelist[_investor].added == uint8(0)) {
            investors.push(_investor);
        }
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, _expiryTime, _canBuyFromSTO, uint8(1));
        /*solium-disable-next-line security/no-block-members*/
        emit ModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime, _expiryTime, _canBuyFromSTO);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investors List of the addresses to whitelist
    * @param _fromTimes An array of the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTimes An array of the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTimes An array of the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO An array of boolean values
    */
    function modifyWhitelistMulti(
        address[] _investors,
        uint64[] _fromTimes,
        uint64[] _toTimes,
        uint64[] _expiryTimes,
        uint8[] _canBuyFromSTO
    ) public withPerm(WHITELIST) {
        require(_investors.length == _fromTimes.length, "Mismatched input lengths");
        require(_fromTimes.length == _toTimes.length, "Mismatched input lengths");
        require(_toTimes.length == _expiryTimes.length, "Mismatched input lengths");
        require(_canBuyFromSTO.length == _toTimes.length, "Mismatched input length");
        for (uint256 i = 0; i < _investors.length; i++) {
            _modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i], _expiryTimes[i], _canBuyFromSTO[i]);
        }
    }

    /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _nonce nonce of signature (avoid replay attack)
    * @param _v issuer signature
    * @param _r issuer signature
    * @param _s issuer signature
    */
    function modifyWhitelistSigned(
        address _investor,
        uint64 _fromTime,
        uint64 _toTime,
        uint64 _expiryTime,
        uint8 _canBuyFromSTO,
        uint64 _validFrom,
        uint64 _validTo,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        /*solium-disable-next-line security/no-block-members*/
        require(_validFrom <= uint64(now), "ValidFrom is too early");
        /*solium-disable-next-line security/no-block-members*/
        require(_validTo >= uint64(now), "ValidTo is too late");
        require(!nonceMap[_investor][_nonce], "Already used signature");
        nonceMap[_investor][_nonce] = true;
        bytes32 hash = keccak256(
            abi.encodePacked(this, _investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _validFrom, _validTo, _nonce)
        );
        _checkSig(hash, _v, _r, _s);
        if (whitelist[_investor].added == uint8(0)) {
            investors.push(_investor);
        }
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, _expiryTime, _canBuyFromSTO, uint8(1));
        /*solium-disable-next-line security/no-block-members*/
        emit ModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime, _expiryTime, _canBuyFromSTO);
    }

    /**
     * @notice Used to verify the signature
     */
    function _checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _fromTime, _toTime & _expiryTime and be signed by the issuer address
        address signer = ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)), _v, _r, _s);
        require(signer == Ownable(securityToken).owner() || signer == signingAddress, "Incorrect signer");
    }

    /**
     * @notice Internal function used to check whether the investor is in the whitelist or not
            & also checks whether the KYC of investor get expired or not
     * @param _investor Address of the investor
     */
    function _onWhitelist(address _investor) internal view returns(bool) {
        return (whitelist[_investor].expiryTime >= uint64(now)); /*solium-disable-line security/no-block-members*/
    }

    /**
     * @notice Internal function use to know whether the STO is attached or not
     */
    function _isSTOAttached() internal view returns(bool) {
        bool attached = ISecurityToken(securityToken).getModulesByType(3).length > 0;
        return attached;
    }

    function _adjustTimes(uint64 _time) internal view returns(uint64) {
        if (offset.isForward != 0) {
            require(_time + offset.time > _time);
            return _time + offset.time;
        } else {
            require(_time >= offset.time);
            return _time - offset.time;
        }
    }

    /**
     * @dev Returns list of all investors
     */
    function getInvestors() external view returns(address[]) {
        return investors;
    }

    /**
     * @notice Return the permissions flag that are associated with general trnasfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = WHITELIST;
        allPermissions[1] = FLAGS;
        return allPermissions;
    }

}
