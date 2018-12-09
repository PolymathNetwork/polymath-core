pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for manually approving transactions between accounts
 */
contract ManualApprovalTransferManager is ITransferManager {
    using SafeMath for uint256;

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address which can sign whitelist changes
    address public signingAddress = address(0);

    bytes32 public constant TRANSFER_APPROVAL = "TRANSFER_APPROVAL";

    //Manual approval is an allowance (that has been approved) with an expiry time
    struct ManualApproval {
        address from;
        address to;
        uint256 allowance;
        uint256 expiryTime;
        bytes32 description;
    }

    //Store mappings of address => address with ManualApprovals
    mapping (address => mapping (address => ManualApproval)) public manualApprovals;

    //An array to track all current active approvals
    ManualApproval[] public activeManualApprovals;

    event AddManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _allowance,
        uint256 _expiryTime,
        address indexed _addedBy
    );

    event EditManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _expiryTime,
        address indexed _edittedBy
    );

    event RevokeManualApproval(
        address indexed _from,
        address indexed _to,
        address indexed _addedBy
    );

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

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /** @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes /* _data */, bool _isTransfer) public returns(Result) {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not the owner");
       
        if (!paused) {
            if ((manualApprovals[_from][_to].expiryTime >= now) && (manualApprovals[_from][_to].allowance >= _amount)) {
                if (_isTransfer) {
                    manualApprovals[_from][_to].allowance = manualApprovals[_from][_to].allowance.sub(_amount);
                }
                return Result.VALID;
            }
        }
        return Result.NA;
    }

    /**
    * @notice Adds a pair of addresses to manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _allowance is the approved amount of tokens
    * @param _expiryTime is the time until which the transfer is allowed
    */
    function addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        require(_expiryTime > now, "Invalid expiry time");
        require(manualApprovals[_from][_to].allowance == 0, "Approval already exists");
        manualApprovals[_from][_to] = ManualApproval(_from, _to, _allowance, _expiryTime, _description);
        activeManualApprovals.push(ManualApproval(_from, _to, _allowance, _expiryTime, _description));

        emit AddManualApproval(_from, _to, _allowance, _expiryTime, msg.sender);
    }


    /**
    * @notice Adds mutiple manual approvals in batch
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    * @param _allowance is the array of approved amounts 
    * @param _expiryTime is the array of the times until which eath transfer is allowed
    * @param _description is the description array for these manual approvals
    */
    function addManualApprovalMulti(address[] _from, address[] _to, uint256[] _allowance, uint256[] _expiryTime, bytes32[] _description) public withPerm(TRANSFER_APPROVAL) {
        require(_from.length == _to.length && _to.length == _allowance.length && _allowance.length == _expiryTime.length && _expiryTime.length == _description.length, "input array numbers not matching");
        for(uint8 i=0; i<_from.length; i++){
            addManualApproval(_from[i], _to[i], _allowance[i], _expiryTime[i], _description[i]);
        }
    }

    /**
    * @notice Edit an existing manual approvals
    * @param _from is the new address from which transfers are approved
    * @param _to is the new address to which transfers are approved
    * @param _expiryTime is the new time until which the transfer is allowed
    */
    function updateManualApproval(address _from, address _to, uint256 _expiryTime) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiryTime > now, "Invalid expiry time");
        require(manualApprovals[_from][_to].allowance != 0, "Approval does not exists");
        manualApprovals[_from][_to].expiryTime = _expiryTime;
        emit EditManualApproval(_from, _to, _expiryTime, msg.sender);
    }

    /**
    * @notice Removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) public withPerm(TRANSFER_APPROVAL) {
        require(_to != address(0), "Invalid to address");
        delete manualApprovals[_from][_to];

        //find the record in active approvals array & delete it
        uint256 index;
        for(uint256 i = 0; i < activeManualApprovals.length; i++){
            if (activeManualApprovals[i].from == _from && activeManualApprovals[i].to == _to){
                index = i;
            }
        }

        for(uint256 j = index; j < activeManualApprovals.length-1; j++){
            activeManualApprovals[j] = activeManualApprovals[j+1];
        }

        delete activeManualApprovals[activeManualApprovals.length-1];
        activeManualApprovals.length--;

        emit RevokeManualApproval(_from, _to, msg.sender);
    }

    /**
    * @notice Removes mutiple pairs of addresses from manual approvals
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    */
    function revokeManualApprovalMulti(address[] _from, address[] _to) public withPerm(TRANSFER_APPROVAL) {
        require(_from.length == _to.length, "input array numbers not matching");
        for(uint8 i=0; i<_from.length; i++){
            revokeManualApproval(_from[i], _to[i]);
        }
    }

    /**
    * @notice Returns the current number of active approvals
    */
    function getActiveApprovalsLength() public view returns(uint256) {
        return activeManualApprovals.length;
    }

    /**
     * @notice Returns the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = TRANSFER_APPROVAL;
        return allPermissions;
    }
}
