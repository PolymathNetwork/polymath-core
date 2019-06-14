pragma solidity 0.5.8;

import "../modules/Experimental/Burn/TrackedRedemption.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract MockRedemptionManager is TrackedRedemption {
    mapping(address => uint256) tokenToRedeem;
    mapping(address => mapping(bytes32 => uint256)) redeemedTokensByPartition;

    event RedeemedTokenByOwner(address _investor, address _byWhoom, uint256 _value);
    event RedeemedTokensByPartition(address indexed _investor, address indexed _operator, bytes32 _partition, uint256 _value, bytes _data, bytes _operatorData);

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
        require(securityToken.transferFrom(msg.sender, address(this), _value), "Insufficient funds");
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
        securityToken.redeem(_value, "");
        /*solium-disable-next-line security/no-block-members*/
        emit RedeemedTokenByOwner(msg.sender, address(this), _value);
    }

    /**
     * @notice To redeem tokens and track redemptions
     * @param _value The number of tokens to redeem
     * @param _partition Partition from which balance will be deducted
     * @param _data Extra data parmeter pass to do some offchain operation
     */
    function redeemTokensByPartition(uint256 _value, bytes32 _partition, bytes calldata _data) external {
        require(tokenToRedeem[msg.sender] >= _value, "Insufficient tokens redeemable");
        tokenToRedeem[msg.sender] = tokenToRedeem[msg.sender].sub(_value);
        redeemedTokensByPartition[msg.sender][_partition] = redeemedTokensByPartition[msg.sender][_partition].add(_value);
        securityToken.redeemByPartition(_partition, _value, _data);
        /*solium-disable-next-line security/no-block-members*/
        emit RedeemedTokensByPartition(msg.sender, address(0), _partition, _value, _data, "");
    }

    /**
     * @notice To redeem tokens and track redemptions
     * @param _value The number of tokens to redeem
     * @param _partition Partition from which balance will be deducted
     * @param _data Extra data parmeter pass to do some offchain operation
     * @param _operatorData Data to log the operator call
     */
    function operatorRedeemTokensByPartition(uint256 _value, bytes32 _partition, bytes calldata _data, bytes calldata _operatorData) external {
        require(tokenToRedeem[msg.sender] >= _value, "Insufficient tokens redeemable");
        tokenToRedeem[msg.sender] = tokenToRedeem[msg.sender].sub(_value);
        redeemedTokensByPartition[msg.sender][_partition] = redeemedTokensByPartition[msg.sender][_partition].add(_value);
        securityToken.operatorRedeemByPartition(_partition, msg.sender, _value, _data, _operatorData);
        /*solium-disable-next-line security/no-block-members*/
        emit RedeemedTokensByPartition(msg.sender, address(this), _partition, _value, _data, _operatorData);
    }

    function operatorTransferToRedeem(uint256 _value, bytes32 _partition, bytes calldata _data, bytes calldata _operatorData) external {
        securityToken.operatorTransferByPartition(_partition, msg.sender, address(this), _value, _data, _operatorData);
        tokenToRedeem[msg.sender] = _value;
    }


}
