pragma solidity ^0.4.23;

import "./ITransferManager.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Owner       WHITELIST      FLAGS
// modifyWhitelist                          X             X
// modifyWhitelistMulti                     X             X

contract CountTransferManager is ITransferManager {

    // Permission key for modifying the whitelist
    bytes32 public constant WHITELIST = "WHITELIST";

    // The maximum number of concurrent token holders
    uint256 public maxHolderCount;

    // Addresses on this list are always able to send / receive tokens
    mapping (address => bool) public whitelist;

    event LogModifyHolderCount(uint256 _oldHolderCount, uint256 _newHolderCount);
    event LogModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy
    );

    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    function verifyTransfer(address _from, address _to, uint256 /* _amount */) public view returns(Result) {
        if (!paused) {
            if (whitelist[_from] || whitelist[_to]) {
                return Result.VALID;
            }
            if (maxHolderCount < ISecurityToken(securityToken).investorCount()) {
                // Allow trannsfers to existing maxHolders
                if (ISecurityToken(securityToken).balanceOf(_to) != 0) {
                    return Result.VALID;
                }
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    function configure(uint256 _maxHolderCount) public onlyFactory {
        maxHolderCount = _maxHolderCount;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
    * @dev sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderCount is the new maximum amount a holder can hold
    */
    function changeHolderCount(uint256 _maxHolderCount) public onlyOwner {
        emit LogModifyHolderCount(maxHolderCount, _maxHolderCount);
        maxHolderCount = _maxHolderCount;
    }

    /**
    * @dev adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _valid whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelist(address _investor, bool _valid) public withPerm(WHITELIST) {
        whitelist[_investor] = _valid;
        emit LogModifyWhitelist(_investor, now, msg.sender);
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = WHITELIST;
        return allPermissions;
    }

}
