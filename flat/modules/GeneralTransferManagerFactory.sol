pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
contract IModule {
    function getInitFunction() public returns (bytes4);
    address public factory;
}

contract ITransferManager is IModule {

    function verifyTransfer(address _from, address _to, uint256 _amount) view external returns(bool);

}

interface IDelegable {

    function grantPermission(address _delegate, address _module) public;

    /// WIP
    function checkPermissions(address _module, address _delegate) public;

}

contract DelegablePorting {

    IDelegable delegable;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOwnerOrDelegates {
        require((msg.sender == owner) || validateDelegate(msg.sender));
        _;
    }

    function DelegablePorting(address _owner, address _delegable) public {
        owner = _owner;
        delegable = IDelegable(_delegable);
    }

    function grantPermToDelegate(address _delegate) onlyOwner public {
        require(_delegate != address(0));
        delegable.grantPermission(_delegate, this);
    }

    function grantPermToDelegatesMulti(address[] _delegates) onlyOwner public {
        for (uint i = 0; i < _delegates.length; i++) {
            grantPermToDelegate(_delegates[i]);
        }
    }

    // TODO : to check according to the permission 
    function validateDelegate(address _delegate) public returns(bool) {
        // TODO: not decided yet the return value of the checkPermissions 
        delegable.checkPermissions(this, _delegate);
        return true;
    }


}

contract GeneralTransferManager is ITransferManager, DelegablePorting {

    //Address from which issuances come
    address public issuanceAddress = address(0);

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
    function GeneralTransferManager(address _owner, bytes _data, address _securityToken)
    DelegablePorting(_owner, _securityToken)
    public
    {
      factory = msg.sender;
    }

    function getInitFunction() public returns(bytes4) {
      return bytes4(0);
    }

    //TODO: No longer needed - can remove
    function bytesToAddr(bytes b) public pure returns(address) {
        uint result = 0;
        for (uint i = b.length - 1; i + 1 > 0; i--) {
            uint c = uint(b[i]);
            uint to_inc = c * (16 ** ((b.length - (i - 1)) * 2));
            result += to_inc;
        }
        return address(result);
    }

    function changeIssuanceAddress(address _issuanceAddress) public onlyOwner {
        issuanceAddress = _issuanceAddress;
        LogChangeIssuanceAddress(_issuanceAddress);
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

    function onWhitelist(address _investor) internal view returns(bool) {
      return ((whitelist[_investor].fromTime != 0) || (whitelist[_investor].toTime != 0));
    }

    function verifyTransfer(address _from, address _to, uint256 _amount) view external returns(bool) {
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

    function modifyWhitelist(address _investor, uint256 _fromTime, uint256 _toTime) public onlyOwnerOrDelegates {
        //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
        whitelist[_investor] = TimeRestriction(_fromTime, _toTime);
        LogModifyWhitelist(_investor, _fromTime, _toTime);
    }

    function modifyWhitelistMulti(address[] _investors, uint256[] _fromTimes, uint256[] _toTimes) public onlyOwnerOrDelegates {
        require(_investors.length == _fromTimes.length);
        require(_fromTimes.length == _toTimes.length);
        for (uint256 i = 0; i < _investors.length; i++) {
          modifyWhitelist(_investors[i], _fromTimes[i], _toTimes[i]);
        }
    }
}

//Simple interface that any module contracts should implement
contract IModuleFactory {

    //TODO: Add delegates to this
    //Should create an instance of the Module, or throw
    function deploy(address _owner, bytes _data) external returns(address);

    function getType() view external returns(uint8);

    function getName() view external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() view external returns(uint256);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint l = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < l; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
        }
    }

}

contract GeneralTransferManagerFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
    return address(new GeneralTransferManager(_owner, _data, msg.sender));
  }

  function getCost() view external returns(uint256) {
    return 0;
  }

  function getType() view external returns(uint8) {
      return 1;
  }

  function getName() view external returns(bytes32) {
    return "GeneralTransferManager";
  }


}