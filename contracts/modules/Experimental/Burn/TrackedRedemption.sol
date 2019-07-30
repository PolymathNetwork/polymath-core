pragma solidity 0.5.8;

import "../../Burn/IBurn.sol";
import "../../Module.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract TrackedRedemption is IBurn, Module {
    using SafeMath for uint256;

    mapping(address => uint256) redeemedTokens;

    event Redeemed(address _investor, uint256 _value);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice To redeem tokens and track redemptions
     * @param _value The number of tokens to redeem
     */
    function redeemTokens(uint256 _value) public {
        securityToken.redeemFrom(msg.sender, _value, "");
        redeemedTokens[msg.sender] = redeemedTokens[msg.sender].add(_value);
        /*solium-disable-next-line security/no-block-members*/
        emit Redeemed(msg.sender, _value);
    }

    /**
     * @notice Returns the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
