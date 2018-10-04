pragma solidity ^0.4.24;

import "./IBurn.sol";
import "../Module.sol";
import "../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract TrackedRedemption is IBurn, Module {
    using SafeMath for uint256;

    mapping (address => uint256) redeemedTokens;

    event Redeemed(address _investor, uint256 _value, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Redeem tokens and track redemptions
     * @param _value The number of tokens to redeem
     */
    function redeemTokens(uint256 _value) public {
        ISecurityToken(securityToken).burnFromWithData(msg.sender, _value, "");
        redeemedTokens[msg.sender] = redeemedTokens[msg.sender].add(_value);
        emit Redeemed(msg.sender, _value, now);
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
