pragma solidity ^0.4.18;

import './ITransferManager.sol';

/////////////////////
// Module permissions
/////////////////////
//                                        Factory Owner
// modifyWhitelist                          X
// modifyWhitelistMulti                     X

contract ExchangeTransferManager is ITransferManager {

    //Address from which issuances come
    address public transferManager;
    address public exchange;
    mapping (address => bool) public whitelist;

    event LogModifyWhitelist(address _investor, uint256 _dateAdded, address _addedBy);

    function ExchangeTransferManager(address _securityToken)
    IModule(_securityToken)
    public
    {
    }

    function configure(address _transferManager, address _exchange) public onlyFactory {
        transferManager = _transferManager;
        exchange = _exchange;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(address,address)"));
    }

    function verifyTransfer(address _from, address _to, uint256 _amount) view external returns(bool) {
        //Anyone can transfer if they are on the attached TransferManager, or this TransferManager allows it
        //Allow users to not set another transferManager if they don't want to
        if (transferManager != address(0)) {
          if (ITransferManager(transferManager).verifyTransfer(_from, _to, _amount)) {
            return true;
          }
        }
        return getExchangePermission(_from) && getExchangePermission(_to);
    }

    function getExchangePermission(address _investor) view internal returns (bool) {
        //This function could implement more complex logic, e.g. calling out to another contract maintained by the exchange to get list of allowed users
        return whitelist[_investor] || (_investor == exchange);
    }


    function modifyWhitelist(address _investor, bool _valid) public onlyFactoryOwner {
        whitelist[_investor] = _valid;
        LogModifyWhitelist(_investor, now, msg.sender);
    }

    function modifyWhitelistMulti(address[] _investors, bool[] _valids) public onlyFactoryOwner {
        require(_investors.length == _valids.length);
        for (uint256 i = 0; i < _investors.length; i++) {
          modifyWhitelist(_investors[i], _valids[i]);
        }
    }

    function permissions() public returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
