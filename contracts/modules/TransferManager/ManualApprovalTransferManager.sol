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

    mapping (address => mapping (address => uint256)) public approvalIndex;
    mapping (address => mapping (address => bool)) public hasApproval;
    // An array to track all approvals
    ManualApproval[] public approvals;

    event AddManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _allowance,
        uint256 _expiryTime,
        bytes32 _description,
        address indexed _addedBy
    );

    event ModifyManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _expiryTime,
        uint256 _allowance,
        bytes32 _description,
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

    /** 
     * @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes /* _data */, bool _isTransfer) public returns(Result) {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not the owner");
       
        if (!paused && hasApproval[_from][_to]) {
            uint256 index = approvalIndex[_from][_to];
            ManualApproval storage approval = approvals[index];
            if ((approval.expiryTime >= now) && (approval.allowance >= _amount)) {
                if (_isTransfer) {
                    approval.allowance = approval.allowance.sub(_amount);
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
    * @param _description Description about the manual approval
    */
    function addManualApproval(
        address _from,
        address _to,
        uint256 _allowance,
        uint256 _expiryTime,
        bytes32 _description
    ) 
        external 
        withPerm(TRANSFER_APPROVAL)
    {
        _addManualApproval(_from, _to, _allowance, _expiryTime, _description);
    }

    function _addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description) internal {
        require(_to != address(0), "Invalid to address");
        require(_expiryTime > now, "Invalid expiry time");
        require(_allowance > 0, "Invalid allowance");
        if (hasApproval[_from][_to]) {
            uint256 index = approvalIndex[_from][_to];
            require(approvals[index].expiryTime < now || approvals[index].allowance == 0, "Approval already exists");
            _revokeManualApproval(_from, _to);
        }
        approvals.push(ManualApproval(_from, _to, _allowance, _expiryTime, _description));
        approvalIndex[_from][_to] = approvals.length - 1;
        hasApproval[_from][_to] = true;
        emit AddManualApproval(_from, _to, _allowance, _expiryTime, _description, msg.sender);
    }

    /**
    * @notice Adds mutiple manual approvals in batch
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    * @param _allowances is the array of approved amounts 
    * @param _expiryTimes is the array of the times until which eath transfer is allowed
    * @param _descriptions is the description array for these manual approvals
    */
    function addManualApprovalMulti(
        address[] _from,
        address[] _to,
        uint256[] _allowances,
        uint256[] _expiryTimes,
        bytes32[] _descriptions
    ) 
        external 
        withPerm(TRANSFER_APPROVAL)
    {
        _checkInputLengthArray(_from, _to, _allowances, _expiryTimes, _descriptions);
        for (uint256 i = 0; i < _from.length; i++){
            _addManualApproval(_from[i], _to[i], _allowances[i], _expiryTimes[i], _descriptions[i]);
        }
    }

    /**
    * @notice Modify the existing manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _expiryTime is the time until which the transfer is allowed
    * @param _changedAllowance is the changed allowance
    * @param _description Description about the manual approval
    * @param _change uint values which tells whether the allowances will be increased (1) or decreased (0)
    * or any value when there is no change in allowances
    */
    function modifyManualApproval(
        address _from,
        address _to,
        uint256 _expiryTime,
        uint256 _changedAllowance,
        bytes32 _description,
        uint8 _change
    ) 
        external
        withPerm(TRANSFER_APPROVAL)
    {
        _modifyManualApproval(_from, _to, _expiryTime, _changedAllowance, _description, _change);
    }

    function _modifyManualApproval(
        address _from,
        address _to,
        uint256 _expiryTime,
        uint256 _changedAllowance,
        bytes32 _description,
        uint8 _change
    ) 
        internal 
    {
        require(_to != address(0), "Invalid to address");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiryTime > now, "Invalid expiry time");
        require(hasApproval[_from][_to], "Approval not present");
        uint256 index = approvalIndex[_from][_to];
        ManualApproval storage approval = approvals[index];
        require(approval.allowance != 0 && approval.expiryTime > now, "Not allowed");
        uint256 currentAllowance = approval.allowance;
        uint256 newAllowance;
        if (_change == 1) {
            // Allowance get increased
            newAllowance = currentAllowance.add(_changedAllowance);
            approval.allowance = newAllowance;
        } else if (_change == 0) {
            // Allowance get decreased
            if (_changedAllowance > currentAllowance) {
                newAllowance = 0;
                approval.allowance = newAllowance;
            } else {
                newAllowance = currentAllowance.sub(_changedAllowance);
                approval.allowance = newAllowance;
            }
        } else {
            // No change in the Allowance
            newAllowance = currentAllowance;
        }
        // Greedy storage technique
        if (approval.expiryTime != _expiryTime) {
            approval.expiryTime = _expiryTime;
        }
        if (approval.description != _description) {
            approval.description = _description;
        }
        emit ModifyManualApproval(_from, _to, _expiryTime, newAllowance, _description, msg.sender);
    }

    /**
     * @notice Adds mutiple manual approvals in batch
     * @param _from is the address array from which transfers are approved
     * @param _to is the address array to which transfers are approved
     * @param _expiryTimes is the array of the times until which eath transfer is allowed
     * @param _changedAllowances is the array of approved amounts 
     * @param _descriptions is the description array for these manual approvals
     * @param _changes Array of uint values which tells whether the allowances will be increased (1) or decreased (0)
     * or any value when there is no change in allowances
     */
    function modifyManualApprovalMulti(
        address[] _from,
        address[] _to,
        uint256[] _expiryTimes,
        uint256[] _changedAllowances,
        bytes32[] _descriptions,
        uint8[] _changes
    )
        public
        withPerm(TRANSFER_APPROVAL)
    {
        _checkInputLengthArray(_from, _to, _changedAllowances, _expiryTimes, _descriptions);
        require(_changes.length == _changedAllowances.length, "Input length array mismatch");
        for (uint256 i = 0; i < _from.length; i++) {
            _modifyManualApproval(_from[i], _to[i], _expiryTimes[i], _changedAllowances[i], _descriptions[i], _changes[i]);
        }
    }

    /**
    * @notice Removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) external withPerm(TRANSFER_APPROVAL) {
        _revokeManualApproval(_from, _to);
    }

    function _revokeManualApproval(address _from, address _to) internal {
        require(hasApproval[_from][_to], "Approval not exist"); 

        // find the record in active approvals array & delete it
        uint256 index = approvalIndex[_from][_to];
        if (index != approvals.length -1) {
            approvals[index] = approvals[approvals.length -1];
            approvalIndex[approvals[index].from][approvals[index].to] = index; 
        }
        hasApproval[_from][_to] = false;
        approvals.length--;
        emit RevokeManualApproval(_from, _to, msg.sender);
    }

    /**
    * @notice Removes mutiple pairs of addresses from manual approvals
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    */
    function revokeManualApprovalMulti(address[] _from, address[] _to) external withPerm(TRANSFER_APPROVAL) {
        require(_from.length == _to.length, "Input array length mismatch");
        for(uint256 i = 0; i < _from.length; i++){
            _revokeManualApproval(_from[i], _to[i]);
        }
    }

    function _checkInputLengthArray(
        address[] _from,
        address[] _to,
        uint256[] _expiryTimes,
        uint256[] _allowances,
        bytes32[] _descriptions
    ) 
        internal
        pure 
    {
        require(_from.length == _to.length &&
        _to.length == _allowances.length &&
        _allowances.length == _expiryTimes.length &&
        _expiryTimes.length == _descriptions.length,
        "Input array length mismatch"
        );
    }

    /**
     * @notice Returns the all active approvals corresponds to an address
     * @param _user Address of the holder corresponds to whom list of manual approvals 
     * need to return
     * @return List of indexes
     */
    function getActiveApprovalsToUser(address _user) external view returns(uint256[]) {
        uint256 counter = 0;
        for (uint256 i = 0; i < approvals.length; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now)
                counter ++;
        }
        uint256[] memory indexes = new uint256[](counter);
        counter = 0;
        for (i = 0; i < approvals.length; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now) {
                indexes[counter] = i;
                counter ++;
            } 
        }
        return indexes;
    }

    /**
     * @notice Get the details of the approval corresponds to _from & _to addresses
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @return uint256 expiryTime of the approval
     * @return uint256 allowance provided to the approval
     * @return uint256 Description provided to the approval
     */
    function getApprovalDetails(address _from, address _to) external view returns(uint256, uint256, bytes32) {
        if (hasApproval[_from][_to]) {
            uint256 index = approvalIndex[_from][_to];
            if (index < approvals.length) {
                ManualApproval storage approval = approvals[index];
                return(
                    approval.expiryTime,
                    approval.allowance,
                    approval.description
                );
            }
        }
        return (uint256(0), uint256(0), bytes32(0));
    }

    /**
    * @notice Returns the current number of active approvals
    */
    function getTotalApprovalsLength() external view returns(uint256) {
        return approvals.length;
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
