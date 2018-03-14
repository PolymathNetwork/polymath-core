pragma solidity ^0.4.18;

import './interfaces/ITransferManager.sol';
import './delegates/DelegablePorting.sol';

contract GeneralTransferManager is ITransferManager, DelegablePorting {

    //Address from which issuances come
    address public issuanceAddress;

    //An address can only send / receive tokens once their corresponding uint256 > block.number (unless allowAllTransfers == true or allowAllWhitelistTransfers == true)
    mapping (address => uint256) public whitelist;

    //If true, there are no transfer restrictions, for any addresses
    bool public allowAllTransfers = false;
    //If true, time lock is ignored for transfers (address must still be on whitelist)
    bool public allowAllWhitelistTransfers = false;
    //If true, time lock is ignored for issuances (address must still be on whitelist)
    bool public allowAllWhitelistIssuances = false;

    //In this case we treat delegates as having full rights to modify whitelist
    mapping (address => bytes32) public delegates;

    event LogAllowAllTransfers(bool _allowAllTransfers);
    event LogAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers);
    event LogAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances);
    event LogModifyWhitelist(address _investor, uint256 _time);

    //TODO: Pull in delegates here
    function GeneralTransferManager(address _owner, bytes _data, address _securityToken)
    DelegablePorting(_owner, _securityToken)
    public
    {
        //TODO: Could insist this is only called by the GeneralTransferManagerFactory
        issuanceAddress = bytesToAddr(_data);
    }

    function bytesToAddr(bytes b) public pure returns(address) {
        uint result = 0;
        for (uint i = b.length - 1; i + 1 > 0; i--) {
            uint c = uint(b[i]);
            uint to_inc = c * (16 ** ((b.length - (i - 1)) * 2));
            result += to_inc;
        }
        return address(result);
    }

    function changeAllowAllTransfers(bool _allowAllTransfers) public onlyOwner {
        allowAllTransfers = _allowAllTransfers;
        LogAllowAllTransfers(_allowAllTransfers);
    }

    function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public onlyOwner {
        allowAllWhitelistTransfers = _allowAllWhitelistTransfers;
        LogAllowAllWhitelistTransfers(_allowAllWhitelistTransfers);
    }

    function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public onlyOwner {
        allowAllWhitelistIssuances = _allowAllWhitelistIssuances;
        LogAllowAllWhitelistIssuances(_allowAllWhitelistIssuances);
    }

    function verifyTransfer(address _to, address _from) external returns(bool) {
        if (allowAllTransfers) {
          //All transfers allowed, regardless of whitelist
          return true;
        }
        if (allowAllWhitelistTransfers) {
          //Anyone on the whitelist can transfer, regardless of block number
          return ((whitelist[_to] != 0) && (whitelist[_from] != 0));
        }
        if (allowAllWhitelistIssuances) {
            return ((_from == issuanceAddress) && (whitelist[_to] != 0));
        }
        //Anyone on the whitelist can transfer provided the blocknumber is large enough
        return ((whitelist[_to] >= now) && (whitelist[_from] >= now));
    }

    function modifyWhitelist(address _investor, uint256 _time) public onlyOwnerOrDelegates {
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = _time;
        LogModifyWhitelist(_investor, _time);
    }

    function modifyWhitelistMulti(address[] _investors, uint256[] _times) public onlyOwnerOrDelegates {
        require(_investors.length == _times.length);
        for (uint256 i = 0; i < _investors.length; i++) {
          modifyWhitelist(_investors[i], _times[i]);
        }
    }
}
