pragma solidity ^0.5.0;

import "../modules/Experimental/Burn/TrackedRedemption.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract MockRedemptionManager is TrackedRedemption {
    mapping(address => uint256) tokenToRedeem;

    event RedeemedTokenByOwner(address _investor, address _byWhoom, uint256 _value, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public TrackedRedemption(_securityToken, _polyToken) {

    }

    /**
     * @notice Transfers tokens to Module to burn
     * @param _value The number of tokens to redeem
     */
    function transferToRedeem(uint256 _value) public {
        require(ISecurityToken(securityToken).transferFrom(msg.sender, address(this), _value), "Insufficient funds");
        tokenToRedeem[msg.sender] = _value;
    }

    /**
     * @notice Used to redeem tokens by the module
     * @param _value The number of tokens to redeem
     */
    function redeemTokenByOwner(uint256 _value) public {
        require(tokenToRedeem[msg.sender] >= _value, "Insufficient tokens redeemable");
        tokenToRedeem[msg.sender] = tokenToRedeem[msg.sender].sub(_value);
        redeemedTokens[msg.sender] = redeemedTokens[msg.sender].add(_value);
        ISecurityToken(securityToken).burnWithData(_value, "");
        /*solium-disable-next-line security/no-block-members*/
        emit RedeemedTokenByOwner(msg.sender, address(this), _value, now);
    }

}
