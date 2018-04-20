pragma solidity ^0.4.21;

import "./ITransferManager.sol";

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

contract GeneralTransferManager is ITransferManager {

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
        uint256 updated;
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

    event LogChangeIssuanceAddress(address _issuanceAddress);
    event LogAllowAllTransfers(bool _allowAllTransfers);
    event LogAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers);
    event LogAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances);
    event LogChangeSigningAddress(address _signingAddress);

    event LogModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy,
        uint256 _fromTime,
        uint256 _toTime
    );

    function GeneralTransferManager(address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
      signingAddress = ISecurityToken(_securityToken).owner();
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        issuanceAddress = _issuanceAddress;
        emit LogChangeIssuanceAddress(_issuanceAddress);
    }

    function changeSigningAddress(address _signingAddress) public withPerm(FLAGS) {
        signingAddress = _signingAddress;
        emit LogChangeSigningAddress(_signingAddress);
    }

    function changeAllowAllTransfers(bool _allowAllTransfers) public withPerm(FLAGS) {
        allowAllTransfers = _allowAllTransfers;
        emit LogAllowAllTransfers(_allowAllTransfers);
    }

    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public withPerm(FLAGS) {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        emit LogAllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public withPerm(FLAGS) {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        emit LogAllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    /**
    * @dev default implementation of verifyTransfer used by SecurityToken
    * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
    * If the transfer request comes from a token holder, it checks that:
    * a) Both are on the whitelist
    * b) Seller's sale lockup period is over
    * c) Buyer's purchase lockup is over
    */
    function verifyTransfer(address _from, address _to, uint256 /*_amount*/) public view returns(bool) {
        if (allowAllTransfers) {
            //All transfers allowed, regardless of whitelist
            return true;
        }
        if (allowAllWhitelistTransfers) {
            //Anyone on the whitelist can transfer, regardless of block number
            return (onWhitelist(_to) && onWhitelist(_from));
        }
        if (allowAllWhitelistIssuances && _from == issuanceAddress) {
            return onWhitelist(_to);
        }
        //Anyone on the whitelist can transfer provided the blocknumber is large enough
        return ((onWhitelist(_from) && whitelist[_from].fromTime <= now) &&
            (onWhitelist(_to) && whitelist[_to].toTime <= now));
    }

    /**
    * @dev adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    */
    function modifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime) public withPerm(WHITELIST) {
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, now);
        emit LogModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime);
    }

    function modifyWhitelistMulti(
        address[] _investors,
        uint256[] _fromTimes,
        uint256[] _toTimes
    ) public withPerm(WHITELIST) {
        require(_investors.length == _fromTimes.length);
        require(_fromTimes.length == _toTimes.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i]);
        }
    }

    /**
    * @dev adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to whitelist
    * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _v issuer signature
    * @param _r issuer signature
    * @param _s issuer signature
    */
    function modifyWhitelistSigned(address _investor, uint256 _fromTime, uint256 _toTime, uint256 _validFrom, uint256 _validTo, uint8 _v, bytes32 _r, bytes32 _s) public {
        require(_validFrom > whitelist[_investor].updated);
        require(_validTo <= now);
        bytes32 hash = keccak256(this, _investor, _fromTime, _toTime, _validTo);
        checkSig(hash, _v, _r, _s);
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime, now);
        emit LogModifyWhitelist(_investor, now, msg.sender, _fromTime, _toTime);
    }

    function checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _fromTime & _toTime and be signed by the issuer address
        require(ecrecover(keccak256("\x19Ethereum Signed Message:\n32", _hash), _v, _r, _s) == signingAddress);
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = WHITELIST;
        allPermissions[1] = FLAGS;
        return allPermissions;
    }

    function onWhitelist(address _investor) internal view returns(bool) {
        return ((whitelist[_investor].fromTime != 0) || (whitelist[_investor].toTime != 0));
    }
}
