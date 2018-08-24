pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Owner       WHITELIST      FLAGS
// modifyWhitelist                          X             X
// modifyWhitelistMulti                     X             X

/**
 * @title Transfer Manager module for limiting percentage of token supply a single address can hold
 */
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
        address _addedBy,
        bool    _valid
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

    /// @notice Used to verify the transfer transaction according to the rule implemented in the trnasfer managers
    function verifyTransfer(address /* _from */, address _to, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            // If an address is on the whitelist, it is allowed to hold more than maxHolderPercentage of the tokens.
            if (whitelist[_to]) {
                return Result.NA;
            }
            uint256 newBalance = ISecurityToken(securityToken).balanceOf(_to).add(_amount);
            if (newBalance.mul(10**uint256(ISecurityToken(securityToken).decimals())).div(ISecurityToken(securityToken).totalSupply()) > maxHolderPercentage) {
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    /**
     * @notice Used to intialize the variables of the contract
     * @param _maxHolderPercentage Maximum amount of ST20 tokens(in %) can hold by the investor
     */
    function configure(uint256 _maxHolderPercentage) public onlyFactory {
        maxHolderPercentage = _maxHolderPercentage;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
    * @notice sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderPercentage is the new maximum percentage (multiplied by 10**16)
    */
    function changeHolderPercentage(uint256 _maxHolderPercentage) public onlyOwner {
        emit LogModifyHolderPercentage(maxHolderPercentage, _maxHolderPercentage);
        maxHolderPercentage = _maxHolderPercentage;
    }

    /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _valid whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelist(address _investor, bool _valid) public withPerm(WHITELIST) {
        whitelist[_investor] = _valid;
        emit LogModifyWhitelist(_investor, now, msg.sender, _valid);
    }

    /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investors Array of the addresses to whitelist
    * @param _valids Array of boolean value to decide whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelistMulti(address[] _investors, bool[] _valids) public withPerm(WHITELIST) {
        require(_investors.length == _valids.length, "Input array length mis-match");
        for (uint i = 0; i < _investors.length; i++) {
            modifyWhitelist(_investors[i], _valids[i]);
        }
    }

    /**
     * @notice Return the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = WHITELIST;
        return allPermissions;
    }

}
