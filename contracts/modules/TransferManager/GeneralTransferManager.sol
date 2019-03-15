pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "../../storage/GeneralTransferManagerStorage.sol";
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
    event ChangeDefaults(uint64 _defaultCanSendTokensAfter, uint64 _defaultCanReceiveTokensAfter);

    // _canSendTokensAfter is the time from which the _investor can send tokens
    // _canReceiveTokensAfter is the time from which the _investor can receive tokens
    // if allowAllWhitelistIssuances is TRUE, then _canReceiveTokensAfter is ignored when receiving tokens from the issuance address
    // if allowAllWhitelistTransfers is TRUE, then _canReceiveTokensAfter and _canSendTokensAfter is ignored when sending or receiving tokens
    // in any case, any investor sending or receiving tokens, must have a _expiryTime in the future
    event ModifyWhitelist(
        address indexed _investor,
        uint256 _dateAdded,
        address indexed _addedBy,
        uint256 _canSendTokensAfter,
        uint256 _canReceiveTokensAfter,
        uint256 _expiryTime,
        bool _canBuyFromSTO
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

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Used to change the default times used when canSendTokensAfter / canReceiveTokensAfter are zero
     * @param _defaultCanSendTokensAfter default for zero canSendTokensAfter
     * @param _defaultCanReceiveTokensAfter default for zero canReceiveTokensAfter
     */
    function changeDefaults(uint64 _defaultCanSendTokensAfter, uint64 _defaultCanReceiveTokensAfter) public withPerm(FLAGS) {
        /* 0 values are also allowed as they represent that the Issuer
           does not want a default value for these variables.
           0 is also the default value of these variables */
        defaults.canSendTokensAfter = _defaultCanSendTokensAfter;
        defaults.canReceiveTokensAfter = _defaultCanReceiveTokensAfter;
        emit ChangeDefaults(_defaultCanSendTokensAfter, _defaultCanReceiveTokensAfter);
    }

    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        // address(0x0) is also a valid value and in most cases, the address that issues tokens is 0x0.
        issuanceAddress = _issuanceAddress;
        emit ChangeIssuanceAddress(_issuanceAddress);
    }

    /**
     * @notice Used to change the Sigining Address
     * @param _signingAddress new address for the signing
     */
    function changeSigningAddress(address _signingAddress) public withPerm(FLAGS) {
        /* address(0x0) is also a valid value as an Issuer might want to
           give this permission to nobody (except their own address).
           0x0 is also the default value */
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

            (uint64 adjustedCanSendTokensAfter, uint64 adjustedCanReceiveTokensAfter) = _adjustTimes(whitelist[_from].canSendTokensAfter, whitelist[_to].canReceiveTokensAfter);
            if (_from == issuanceAddress) {
                // Possible STO transaction, but investor not allowed to purchased from STO
                if ((whitelist[_to].canBuyFromSTO == 0) && _isSTOAttached()) {
                    return Result.NA;
                }
                // if allowAllWhitelistIssuances is true, so time stamp ignored
                if (allowAllWhitelistIssuances) {
                    return _onWhitelist(_to) ? Result.VALID : Result.NA;
                } else {
                    return (_onWhitelist(_to) && (adjustedCanReceiveTokensAfter <= uint64(now))) ? Result.VALID : Result.NA;
                }
            }

            //Anyone on the whitelist can transfer provided the blocknumber is large enough
            /*solium-disable-next-line security/no-block-members*/
            return ((_onWhitelist(_from) && (adjustedCanSendTokensAfter <= uint64(now))) &&
                (_onWhitelist(_to) && (adjustedCanReceiveTokensAfter <= uint64(now)))) ? Result.VALID : Result.NA; /*solium-disable-line security/no-block-members*/
        }
        return Result.NA;
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _canSendTokensAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveTokensAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    */
    function modifyWhitelist(
        address _investor,
        uint256 _canSendTokensAfter,
        uint256 _canReceiveTokensAfter,
        uint256 _expiryTime,
        bool _canBuyFromSTO
    )
        public
        withPerm(WHITELIST)
    {
        _modifyWhitelist(_investor, _canSendTokensAfter, _canReceiveTokensAfter, _expiryTime, _canBuyFromSTO);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _canSendTokensAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveTokensAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    */
    function _modifyWhitelist(
        address _investor,
        uint256 _canSendTokensAfter,
        uint256 _canReceiveTokensAfter,
        uint256 _expiryTime,
        bool _canBuyFromSTO
    )
        internal
    {
        require(_investor != address(0), "Invalid investor");
        uint8 canBuyFromSTO = 0;
        if (_canBuyFromSTO) {
            canBuyFromSTO = 1;
        }
        if (whitelist[_investor].added == uint8(0)) {
            investors.push(_investor);
        }
        whitelist[_investor] = TimeRestriction(uint64(_canSendTokensAfter), uint64(_canReceiveTokensAfter), uint64(_expiryTime), canBuyFromSTO, uint8(1));
        emit ModifyWhitelist(_investor, now, msg.sender, _canSendTokensAfter, _canReceiveTokensAfter, _expiryTime, _canBuyFromSTO);
    }

    /**
    * @notice Adds or removes addresses from the whitelist.
    * @param _investors List of the addresses to whitelist
    * @param _canSendTokensAfters An array of the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveTokensAfters An array of the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTimes An array of the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO An array of boolean values
    */
    function modifyWhitelistMulti(
        address[] _investors,
        uint256[] _canSendTokensAfters,
        uint256[] _canReceiveTokensAfters,
        uint256[] _expiryTimes,
        bool[] _canBuyFromSTO
    ) public withPerm(WHITELIST) {
        require(_investors.length == _canSendTokensAfters.length, "Mismatched input lengths");
        require(_canSendTokensAfters.length == _canReceiveTokensAfters.length, "Mismatched input lengths");
        require(_canReceiveTokensAfters.length == _expiryTimes.length, "Mismatched input lengths");
        require(_canBuyFromSTO.length == _canReceiveTokensAfters.length, "Mismatched input length");
        for (uint256 i = 0; i < _investors.length; i++) {
            _modifyWhitelist(_investors[i], _canSendTokensAfters[i], _canReceiveTokensAfters[i], _expiryTimes[i], _canBuyFromSTO[i]);
        }
    }

    /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _canSendTokensAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveTokensAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
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
        uint256 _canSendTokensAfter,
        uint256 _canReceiveTokensAfter,
        uint256 _expiryTime,
        bool _canBuyFromSTO,
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        /*solium-disable-next-line security/no-block-members*/
        require(_validFrom <= now, "ValidFrom is too early");
        /*solium-disable-next-line security/no-block-members*/
        require(_validTo >= now, "ValidTo is too late");
        require(!nonceMap[_investor][_nonce], "Already used signature");
        nonceMap[_investor][_nonce] = true;
        bytes32 hash = keccak256(
            abi.encodePacked(this, _investor, _canSendTokensAfter, _canReceiveTokensAfter, _expiryTime, _canBuyFromSTO, _validFrom, _validTo, _nonce)
        );
        _checkSig(hash, _v, _r, _s);
        _modifyWhitelist(_investor, _canSendTokensAfter, _canReceiveTokensAfter, _expiryTime, _canBuyFromSTO);
    }

    /**
     * @notice Used to verify the signature
     */
    function _checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _canSendTokensAfter, _canReceiveTokensAfter & _expiryTime and be signed by the issuer address
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

    /**
     * @notice Internal function to adjust times using default values
     */
    function _adjustTimes(uint64 _canSendTokensAfter, uint64 _canReceiveTokensAfter) internal view returns(uint64, uint64) {
        uint64 adjustedCanSendTokensAfter = _canSendTokensAfter;
        uint64 adjustedCanReceiveTokensAfter = _canReceiveTokensAfter;
        if (_canSendTokensAfter == 0) {
            adjustedCanSendTokensAfter = defaults.canSendTokensAfter;
        }
        if (_canReceiveTokensAfter == 0) {
            adjustedCanReceiveTokensAfter = defaults.canReceiveTokensAfter;
        }
        return (adjustedCanSendTokensAfter, adjustedCanReceiveTokensAfter);
    }

    /**
     * @dev Returns list of all investors
     */
    function getInvestors() external view returns(address[]) {
        return investors;
    }

    /**
     * @dev Returns list of all investors data
     */
    function getAllInvestorsData() external view returns(address[], uint256[], uint256[], uint256[], bool[]) {
        (uint256[] memory canSendTokensAfters, uint256[] memory canReceiveTokensAfters, uint256[] memory expiryTimes, bool[] memory canBuyFromSTOs)
          = _investorsData(investors);
        return (investors, canSendTokensAfters, canReceiveTokensAfters, expiryTimes, canBuyFromSTOs);

    }

    /**
     * @dev Returns list of specified investors data
     */
    function getInvestorsData(address[] _investors) external view returns(uint256[], uint256[], uint256[], bool[]) {
        return _investorsData(_investors);
    }

    function _investorsData(address[] _investors) internal view returns(uint256[], uint256[], uint256[], bool[]) {
        uint256[] memory canSendTokensAfters = new uint256[](_investors.length);
        uint256[] memory canReceiveTokensAfters = new uint256[](_investors.length);
        uint256[] memory expiryTimes = new uint256[](_investors.length);
        bool[] memory canBuyFromSTOs = new bool[](_investors.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            canSendTokensAfters[i] = whitelist[_investors[i]].canSendTokensAfter;
            canReceiveTokensAfters[i] = whitelist[_investors[i]].canReceiveTokensAfter;
            expiryTimes[i] = whitelist[_investors[i]].expiryTime;
            if (whitelist[_investors[i]].canBuyFromSTO == 0) {
                canBuyFromSTOs[i] = false;
            } else {
                canBuyFromSTOs[i] = true;
            }
        }
        return (canSendTokensAfters, canReceiveTokensAfters, expiryTimes, canBuyFromSTOs);
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
