pragma solidity ^0.4.23;

import "./ITransferManager.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Factory Owner
// modifyWhitelist                          X
// modifyWhitelistMulti                     X

contract ExchangeTransferManager is ITransferManager {

    address public exchange;
    mapping (address => bool) public whitelist;

    event LogModifyWhitelist(address _investor, uint256 _dateAdded, address _addedBy);

    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    function verifyTransfer(address _from, address _to, uint256 /*_amount*/) public view returns(Result) {
        if (!paused) {
            if (_from == exchange) {
                return (getExchangePermission(_to) ? Result.VALID : Result.NA);
            } else if (_to == exchange) {
                return (getExchangePermission(_from) ? Result.VALID : Result.NA);
            }
        }

        return Result.NA;
    }

    function configure(address _exchange) public onlyFactory {
        exchange = _exchange;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(address)"));
    }

    function modifyWhitelist(address _investor, bool _valid) public onlyFactoryOwner {
        whitelist[_investor] = _valid;
        emit LogModifyWhitelist(_investor, now, msg.sender);
    }

    function modifyWhitelistMulti(address[] _investors, bool[] _valids) public onlyFactoryOwner {
        require(_investors.length == _valids.length, "Length of arrays are un-equal");
        for (uint256 i = 0; i < _investors.length; i++) {
            modifyWhitelist(_investors[i], _valids[i]);
        }
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

    function getExchangePermission(address _investor) internal view returns (bool) {
        // This function could implement more complex logic,
        // e.g. calling out to another contract maintained by the exchange to get list of allowed users
        return whitelist[_investor];
    }

}
