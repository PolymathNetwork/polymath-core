pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Owner       WHITELIST      FLAGS
// changeIssuanceAddress                    X                          X
// changeAllowAllTransfers                  X                          X
// changeAllowAllWhitelistTransfers         X                          X
// changeAllowAllWhitelistIssuances         X                          X
// modifyWhitelist                          X             X
// modifyWhitelistMulti                     X             X

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManager is ITransferManager {

    using SafeMath for uint256;

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address which can sign whitelist changes
    address public signingAddress = address(0);

    bytes32 public constant WHITELIST = "WHITELIST";
    bytes32 public constant FLAGS = "FLAGS";

    //from and to timestamps that an investor can send / receive tokens respectively
    struct TimeRestriction {
        uint256 fromTime;
        uint256 toTime;
        uint256 expiryTime;
        bool canBuyFromSTO;
    }

    // An address can only send / receive tokens once their corresponding uint256 > block.number
    // (unless allowAllTransfers == true or allowAllWhitelistTransfers == true)
    mapping (address => TimeRestriction) public whitelist;

    //If true, there are no transfer restrictions, for any addresses
    bool public allowAllTransfers = false;
    //If true, time lock is ignored for transfers (address must still be on whitelist)
    bool public allowAllWhitelistTransfers = false;
    //If true, time lock is ignored for issuances (address must still be on whitelist)
    bool public allowAllWhitelistIssuances = true;
    //If true, time lock is ignored for burn transactions
    bool public allowAllBurnTransfers = false;

    // Emit when Issuance address get changed
    event LogChangeIssuanceAddress(address _issuanceAddress);
    // Emit when there is change in the flag variable called allowAllTransfers
    event LogAllowAllTransfers(bool _allowAllTransfers);
    // Emit when there is change in the flag variable called allowAllWhitelistTransfers
    event LogAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers);
    // Emit when there is change in the flag variable called allowAllWhitelistIssuances
    event LogAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances);
    // Emit when there is change in the flag variable called allowAllBurnTransfers
    event LogAllowAllBurnTransfers(bool _allowAllBurnTransfers);
    // Emit when there is change in the flag variable called signingAddress
    event LogChangeSigningAddress(address _signingAddress);
    // Emit when investor details get modified related to their whitelisting
    event LogModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy,
        uint256 _fromTime,
        uint256 _toTime,
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
    IModule(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        issuanceAddress = _issuanceAddress;
        emit LogChangeIssuanceAddress(_issuanceAddress);
    }

    /**
     * @notice Used to change the Sigining Address
     * @param _signingAddress new address for the signing
     */
    function changeSigningAddress(address _signingAddress) public withPerm(FLAGS) {
        signingAddress = _signingAddress;
        emit LogChangeSigningAddress(_signingAddress);
    }

    /**
     * @notice Used to change the flag
            true - It refers there are no transfer restrictions, for any addresses
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllTransfers flag value
     */
    function changeAllowAllTransfers(bool _allowAllTransfers) public withPerm(FLAGS) {
        allowAllTransfers = _allowAllTransfers;
        emit LogAllowAllTransfers(_allowAllTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for transfers (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistTransfers flag value
     */
    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public withPerm(FLAGS) {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        emit LogAllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    /**
     * @notice Used to change the flag
            true - It refers that time lock is ignored for issuances (address must still be on whitelist)
            false - It refers transfers are restricted for all addresses.
     * @param _allowAllWhitelistIssuances flag value
     */
    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public withPerm(FLAGS) {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        emit LogAllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    /**
     * @notice Used to change the flag
            true - It allow to burn the tokens
            false - It deactivate the burning mechanism.
     * @param _allowAllBurnTransfers flag value
     */
    function changeAllowAllBurnTransfers(bool _allowAllBurnTransfers) public withPerm(FLAGS) {
        allowAllBurnTransfers = _allowAllBurnTransfers;
        emit LogAllowAllBurnTransfers(_allowAllBurnTransfers);
    }

    /**
    * @notice default implementation of verifyTransfer used by SecurityToken
    * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
    * If the transfer request comes from a token holder, it checks that:
    * a) Both are on the whitelist
    * b) Seller's sale lockup period is over
    * c) Buyer's purchase lockup is over
    */
    function verifyTransfer(address _from, address _to, uint256 /*_amount*/, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (allowAllTransfers) {
                //All transfers allowed, regardless of whitelist
                return Result.VALID;
            }
            if (allowAllBurnTransfers && (_to == address(0))) {
                return Result.VALID;
            }
            if (allowAllWhitelistTransfers) {
                //Anyone on the whitelist can transfer, regardless of block number
                return (onWhitelist(_to) && onWhitelist(_from)) ? Result.VALID : Result.NA;
            }
            if (allowAllWhitelistIssuances && _from == issuanceAddress) {
                if (!whitelist[_to].canBuyFromSTO && isSTOAttached()) {
                    return Result.NA;
                }
                return onWhitelist(_to) ? Result.VALID : Result.NA;
            }
            //Anyone on the whitelist can transfer provided the blocknumber is large enough
            return ((onWhitelist(_from) && whitelist[_from].fromTime <= now) &&
                (onWhitelist(_to) && whitelist[_to].toTime <= now)) ? Result.VALID : Result.NA;
        }
        return Result.NA;
    }

    /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    */
    function modifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime, uint256 _expiryTime, bool _canBuyFromSTO) public withPerm(WHITELIST) {
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, _expiryTime, _canBuyFromSTO);
        emit LogModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime, _expiryTime, _canBuyFromSTO);
    }

    /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investors List of the addresses to whitelist
    * @param _fromTimes An array of the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTimes An array of the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTimes An array of the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO An array of boolean values
    */
    function modifyWhitelistMulti(
        address[] _investors,
        uint256[] _fromTimes,
        uint256[] _toTimes,
        uint256[] _expiryTimes,
        bool[] _canBuyFromSTO
    ) public withPerm(WHITELIST) {
        require(_investors.length == _fromTimes.length, "Mismatched input lengths");
        require(_fromTimes.length == _toTimes.length, "Mismatched input lengths");
        require(_toTimes.length == _expiryTimes.length, "Mismatched input lengths");
        require(_canBuyFromSTO.length == _toTimes.length, "Mismatched input length");
        for (uint256 i = 0; i < _investors.length; i++) {
            modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i], _expiryTimes[i], _canBuyFromSTO[i]);
        }
    }

    /**
    * @notice adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _canBuyFromSTO is used to know whether the investor is restricted investor or not.
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _v issuer signature
    * @param _r issuer signature
    * @param _s issuer signature
    */
    function modifyWhitelistSigned(
        address _investor,
        uint256 _fromTime,
        uint256 _toTime,
        uint256 _expiryTime,
        bool _canBuyFromSTO,
        uint256 _validFrom,
        uint256 _validTo,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        require(_validFrom <= now, "ValidFrom is too early");
        require(_validTo >= now, "ValidTo is too late");
        bytes32 hash = keccak256(abi.encodePacked(this, _investor, _fromTime, _toTime, _expiryTime, _canBuyFromSTO, _validFrom, _validTo));
        checkSig(hash, _v, _r, _s);
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, _expiryTime, _canBuyFromSTO);
        emit LogModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime, _expiryTime, _canBuyFromSTO);
    }

    /**
     * @notice used to verify the signature
     */
    function checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _fromTime, _toTime & _expiryTime and be signed by the issuer address
        address signer = ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)), _v, _r, _s);
        require(signer == ISecurityToken(securityToken).owner() || signer == signingAddress, "Incorrect signer");
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

    /**
     * @notice Internal function used to check whether the investor is in the whitelist or not
            & also checks whether the KYC of investor get expired or not
     * @param _investor Address of the investor
     */
    function onWhitelist(address _investor) internal view returns(bool) {
        return (((whitelist[_investor].fromTime != 0) || (whitelist[_investor].toTime != 0)) &&
            (whitelist[_investor].expiryTime >= now));
    }

    /**
     * @notice Internal function use to know whether the STO is attached or not
     */
    function isSTOAttached() internal view returns(bool) {
        address _sto;
        (, _sto) = ISecurityToken(securityToken).getModule(3, 0);
        if (_sto == address(0))
            return false;
        return true;
    }

}
