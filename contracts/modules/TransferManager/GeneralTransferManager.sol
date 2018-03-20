pragma solidity ^0.4.18;

import '../../interfaces/ITransferManager.sol';

contract GeneralTransferManager is ITransferManager {

    //Address from which issuances come
    address public issuanceAddress = address(0);

    bytes32 public WHITELIST = "WHITELIST";
    bytes32 public FLAGS = "FLAGS";

    //from and to timestamps that an investor can send / receive tokens respectively
    struct TimeRestriction {
      uint256 fromTime;
      uint256 toTime;
    }

    //An address can only send / receive tokens once their corresponding uint256 > block.number (unless allowAllTransfers == true or allowAllWhitelistTransfers == true)
    mapping (address => TimeRestriction) public whitelist;

    //If true, there are no transfer restrictions, for any addresses
    bool public allowAllTransfers = false;
    //If true, time lock is ignored for transfers (address must still be on whitelist)
    bool public allowAllWhitelistTransfers = false;
    //If true, time lock is ignored for issuances (address must still be on whitelist)
    bool public allowAllWhitelistIssuances = true;

    //In this case we treat delegates as having full rights to modify whitelist
    mapping (address => bytes32) public delegates;

    event LogChangeIssuanceAddress(address _issuanceAddress);
    event LogAllowAllTransfers(bool _allowAllTransfers);
    event LogAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers);
    event LogAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances);
    event LogModifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime);

    //TODO: Pull in delegates here
    function GeneralTransferManager(address _securityToken)
    IModule(_securityToken)
    public
    {
    }

    function permissions() public returns(bytes32[]) {
      bytes32[] memory allPermissions = new bytes32[](2);
      allPermissions[0] = WHITELIST;
      allPermissions[1] = FLAGS;
      return allPermissions;
    }

    function getInitFunction() public returns(bytes4) {
      return bytes4(0);
    }

    function changeIssuanceAddress(address _issuanceAddress) public withPerm(FLAGS) {
        issuanceAddress = _issuanceAddress;
        LogChangeIssuanceAddress(_issuanceAddress);
    }

    function changeAllowAllTransfers(bool _allowAllTransfers) public withPerm(FLAGS) {
        allowAllTransfers = _allowAllTransfers;
        LogAllowAllTransfers(_allowAllTransfers);
    }

    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public withPerm(FLAGS) {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        LogAllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public withPerm(FLAGS) {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        LogAllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    function onWhitelist(address _investor) internal view returns(bool) {
      return ((whitelist[_investor].fromTime != 0) || (whitelist[_investor].toTime != 0));
    }

    function verifyTransfer(address _from, address _to, uint256 /* _amount */) view external returns(bool) {
        if (allowAllTransfers) {
          //All transfers allowed, regardless of whitelist
          return true;
        }
        if (allowAllWhitelistTransfers) {
          //Anyone on the whitelist can transfer, regardless of block number
          return (onWhitelist(_to) && onWhitelist(_from));
        }
        if (allowAllWhitelistIssuances) {
            return ((_from == issuanceAddress) && onWhitelist(_to));
        }
        //Anyone on the whitelist can transfer provided the blocknumber is large enough
        return ((whitelist[_from].fromTime <= now) && (whitelist[_to].toTime <= now));
    }

    function modifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime) public withPerm(WHITELIST) {
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime);
        LogModifyWhitelist(_investor, _fromTime, _toTime);
    }

    function modifyWhitelistMulti(address[] _investors, uint256[] _fromTimes, uint256[] _toTimes) public withPerm(WHITELIST) {
        require(_investors.length == _fromTimes.length);
        require(_fromTimes.length == _toTimes.length);
        for (uint256 i = 0; i < _investors.length; i++) {
          modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i]);
        }
    }
}
