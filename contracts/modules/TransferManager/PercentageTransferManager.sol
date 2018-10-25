/**
 * DISCLAIMER: Under certain conditions, the limit could be bypassed if a large token holder 
 * redeems a huge portion of their tokens. It will cause the total supply to drop 
 * which can result in some other token holders having a percentage of tokens 
 * higher than the intended limit.
 */

pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for limiting percentage of token supply a single address can hold
 */
contract PercentageTransferManager is ITransferManager {
    using SafeMath for uint256;

    // Permission key for modifying the whitelist
    bytes32 public constant WHITELIST = "WHITELIST";
    bytes32 public constant ADMIN = "ADMIN";

    // Maximum percentage that any holder can have, multiplied by 10**16 - e.g. 20% is 20 * 10**16
    uint256 public maxHolderPercentage;

    // Ignore transactions which are part of the primary issuance
    bool public allowPrimaryIssuance = true;

    // Addresses on this list are always able to send / receive tokens
    mapping (address => bool) public whitelist;

    event ModifyHolderPercentage(uint256 _oldHolderPercentage, uint256 _newHolderPercentage);
    event ModifyWhitelist(
        address _investor,
        uint256 _dateAdded,
        address _addedBy,
        bool    _valid
    );
    event SetAllowPrimaryIssuance(bool _allowPrimaryIssuance, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }

    /** @notice Used to verify the transfer transaction and prevent a given account to end up with more tokens than allowed
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes /* _data */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (_from == address(0) && allowPrimaryIssuance) {
                return Result.NA;
            }
            // If an address is on the whitelist, it is allowed to hold more than maxHolderPercentage of the tokens.
            if (whitelist[_to]) {
                return Result.NA;
            }
            uint256 newBalance = ISecurityToken(securityToken).balanceOf(_to).add(_amount);
            if (newBalance.mul(uint256(10)**18).div(ISecurityToken(securityToken).totalSupply()) > maxHolderPercentage) {
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
    function configure(uint256 _maxHolderPercentage, bool _allowPrimaryIssuance) public onlyFactory {
        maxHolderPercentage = _maxHolderPercentage;
        allowPrimaryIssuance = _allowPrimaryIssuance;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(uint256,bool)"));
    }

    /**
    * @notice sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderPercentage is the new maximum percentage (multiplied by 10**16)
    */
    function changeHolderPercentage(uint256 _maxHolderPercentage) public withPerm(ADMIN) {
        emit ModifyHolderPercentage(maxHolderPercentage, _maxHolderPercentage);
        maxHolderPercentage = _maxHolderPercentage;
    }

    /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investor is the address to whitelist
    * @param _valid whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelist(address _investor, bool _valid) public withPerm(WHITELIST) {
        whitelist[_investor] = _valid;
        emit ModifyWhitelist(_investor, now, msg.sender, _valid);
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
    * @notice sets whether or not to consider primary issuance transfers
    * @param _allowPrimaryIssuance whether to allow all primary issuance transfers
    */
    function setAllowPrimaryIssuance(bool _allowPrimaryIssuance) public withPerm(ADMIN) {
        require(_allowPrimaryIssuance != allowPrimaryIssuance, "Must change setting");
        allowPrimaryIssuance = _allowPrimaryIssuance;
        emit SetAllowPrimaryIssuance(_allowPrimaryIssuance, now);
    }

    /**
     * @notice Return the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = WHITELIST;
        allPermissions[1] = ADMIN;
        return allPermissions;
    }

}
