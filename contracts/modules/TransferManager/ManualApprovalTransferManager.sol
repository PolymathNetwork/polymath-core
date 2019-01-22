pragma solidity ^0.5.0;

import "./TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ManualApprovalTransferManagerStorage.sol";

/**
 * @title Transfer Manager module for manually approving or blocking transactions between accounts
 */
contract ManualApprovalTransferManager is ManualApprovalTransferManagerStorage, TransferManager {
    using SafeMath for uint256;

    event AddManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _allowance,
        uint256 _expiryTime,
        address indexed _addedBy
    );

    event AddManualBlocking(
        address indexed _from,
        address indexed _to,
        uint256 _expiryTime,
        address indexed _addedBy
    );

    event RevokeManualApproval(
        address indexed _from,
        address indexed _to,
        address indexed _addedBy
    );

    event RevokeManualBlocking(
        address indexed _from,
        address indexed _to,
        address indexed _addedBy
    );

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

    /** @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data, 
        bool _isTransfer
    ) 
        external 
        returns(Result) 
    {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not the owner");
        (Result success, byte esc) = executeTransfer(_from, _to, _amount, _data);
        if (_isTransfer && esc == 0xA1) {
            manualApprovals[_from][_to].allowance = manualApprovals[_from][_to].allowance.sub(_amount);
        }
        return (success);
    }

    /** 
     * @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     */
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes memory /* _data */
    ) 
        public
        view 
        returns(Result, byte) 
    {
        // manual blocking takes precidence over manual approval
        if (!paused) {
            /*solium-disable-next-line security/no-block-members*/
            if (manualBlockings[_from][_to].expiryTime >= now) {
                return (Result.INVALID, 0xA3);
            }
            /*solium-disable-next-line security/no-block-members*/
            if ((manualApprovals[_from][_to].expiryTime >= now) && (manualApprovals[_from][_to].allowance >= _amount)) {
                return (Result.VALID, 0xA1);
            }
        }
        return (Result.NA, 0xA0);
    }


    /**
    * @notice Adds a pair of addresses to manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _allowance is the approved amount of tokens
    * @param _expiryTime is the time until which the transfer is allowed
    */
    function addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiryTime > now, "Invalid expiry time");
        require(manualApprovals[_from][_to].allowance == 0, "Approval already exists");
        manualApprovals[_from][_to] = ManualApproval(_allowance, _expiryTime);
        emit AddManualApproval(_from, _to, _allowance, _expiryTime, msg.sender);
    }

    /**
    * @notice Adds a pair of addresses to manual blockings
    * @param _from is the address from which transfers are blocked
    * @param _to is the address to which transfers are blocked
    * @param _expiryTime is the time until which the transfer is blocked
    */
    function addManualBlocking(address _from, address _to, uint256 _expiryTime) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiryTime > now, "Invalid expiry time");
        require(manualBlockings[_from][_to].expiryTime == 0, "Blocking already exists");
        manualBlockings[_from][_to] = ManualBlocking(_expiryTime);
        emit AddManualBlocking(_from, _to, _expiryTime, msg.sender);
    }

    /**
    * @notice Removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        delete manualApprovals[_from][_to];
        emit RevokeManualApproval(_from, _to, msg.sender);
    }

    /**
    * @notice Removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualBlocking(address _from, address _to) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        delete manualBlockings[_from][_to];
        emit RevokeManualBlocking(_from, _to, msg.sender);
    }

    /**
     * @notice return the amount of locked tokens for a given user
     */
    function getLockedToken(address /*_owner*/) external view returns(uint256) {
        return 0;
    }

    /**
     * @notice return the amount of un locked tokens for a given user
     */
    function getUnLockedToken(address /*_owner*/) external view returns(uint256) {
        return 0;
    }

    /**
     * @notice Returns the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = TRANSFER_APPROVAL;
        return allPermissions;
    }
}
