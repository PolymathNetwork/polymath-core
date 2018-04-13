pragma solidity ^0.4.21;

import "./ITransferManager.sol";
import "../../katipult/KatipultKYC.sol";

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

contract KatipultTransferManager is ITransferManager {

    bytes32 public constant FLAGS = "FLAGS";

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address of central Katipult KYC contract
    KatipultKYC public katipultKYC;

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

    event LogModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy,
        uint256 _fromTime,
        uint256 _toTime
    );

    function KatipultTransferManager(address _securityToken, address _polyAddress, address _katipultKYCAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
      katipultKYC = KatipultKYC(_katipultKYCAddress);
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        issuanceAddress = _issuanceAddress;
        emit LogChangeIssuanceAddress(_issuanceAddress);
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
        uint256 fromTime;
        uint256 toTime;
        (fromTime, ) = katipultKYC.getWhitelist(address(this), _from);
        (, toTime) = katipultKYC.getWhitelist(address(this), _to);

        return ((onWhitelist(_from) && fromTime <= now) &&
            (onWhitelist(_to) && toTime <= now));
    }

    function onWhitelist(address _investor) internal view returns(bool) {
        return katipultKYC.onWhitelist(address(this), _investor);
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = FLAGS;
        return allPermissions;
    }

}
