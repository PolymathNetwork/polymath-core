pragma solidity ^0.4.23;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Owner       WHITELIST      FLAGS
// modifyWhitelist                          X             X
// modifyWhitelistMulti                     X             X

contract PercentageTransferManager is ITransferManager {
    using SafeMath for uint256;

    // Permission key for modifying the whitelist
    bytes32 public constant WHITELIST = "WHITELIST";

    // Maximum percentage that any holder can have, multiplied by 10**16 - e.g. 20% is 20 * 10**16
    uint256 public maxHolderPercentage;

    // Addresses on this list are always able to send / receive tokens
    mapping (address => bool) public whitelist;

    event LogModifyHolderPercentage(uint256 _oldHolderPercentage, uint256 _newHolderPercentage);
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

    function verifyTransfer(address /* _from */, address _to, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            // If an address is on the whitelist, it is allowed to hold more than maxHolderPercentage of the tokens.
            if (whitelist[_to]) {
                return Result.NA;
            }
            uint256 newBalance = ISecurityToken(securityToken).balanceOf(_to).add(_amount);
            if (newBalance.mul(10**18).div(ISecurityToken(securityToken).totalSupply()) > maxHolderPercentage) {
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    function configure(uint256 _maxHolderPercentage) public onlyFactory {
        maxHolderPercentage = _maxHolderPercentage;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
    * @dev sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderPercentage is the new maximum percentage (multiplied by 10**16)
    */
    function changeHolderPercentage(uint256 _maxHolderPercentage) public onlyOwner {
        emit LogModifyHolderPercentage(maxHolderPercentage, _maxHolderPercentage);
        maxHolderPercentage = _maxHolderPercentage;
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
