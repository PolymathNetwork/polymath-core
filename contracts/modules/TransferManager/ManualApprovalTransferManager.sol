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
    mapping (address => mapping (address => uint256)) internal approvalsIndex;

    //An array to track all current active approvals
    ManualApproval[] public activeManualApprovals;

    event AddManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _allowance,
        uint256 _expiryTime,
        address indexed _addedBy
    );

    event ModifyManualApproval(
        address indexed _from,
        address indexed _to,
        uint256 _expiryTime,
        uint256 _allowance,
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
        require(manualApprovals[_from][_to].allowance == 0 || manualApprovals[_from][_to].expiryTime < now, "Approval already exists");
        manualApprovals[_from][_to] = ManualApproval(_from, _to, _allowance, _expiryTime, _description);
        activeManualApprovals.push(ManualApproval(_from, _to, _allowance, _expiryTime, _description));
        approvalsIndex[_from][_to] = activeManualApprovals.length - 1;
        emit AddManualApproval(_from, _to, _allowance, _expiryTime, msg.sender);
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
        require(manualApprovals[_from][_to].allowance != 0, "Approval does not exists");
        uint256 currentAllowance = manualApprovals[_from][_to].allowance;
        uint256 newAllowance;
        if (_change == 1) {
            // Allowance get increased
            manualApprovals[_from][_to].allowance = (
            manualApprovals[_from][_to].allowance.add(_changedAllowance));
            newAllowance = currentAllowance.add(_changedAllowance);
        } else if (_change == 0) {
            // Allowance get decreased
            if (_changedAllowance > currentAllowance) {
                manualApprovals[_from][_to].allowance = 0;
            } else {
                manualApprovals[_from][_to].allowance = currentAllowance.sub(_changedAllowance);
            }
            newAllowance = currentAllowance.sub(_changedAllowance);
        } else {
            // No change in the Allowance
            newAllowance = currentAllowance;
        }
        // Greedy storage technique
        if (manualApprovals[_from][_to].expiryTime != _expiryTime) {
            manualApprovals[_from][_to].expiryTime = _expiryTime;
        }
        if (manualApprovals[_from][_to].description != _description) {
            manualApprovals[_from][_to].description = _description;
        }
        emit ModifyManualApproval(_from, _to, _expiryTime, newAllowance, msg.sender);
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
        require(_to != address(0), "Invalid to address");
        require(manualApprovals[_from][_to].allowance != 0, "Approval not exist");

        // find the record in active approvals array & delete it
        uint256 index = approvalsIndex[_from][_to];
        if (index != activeManualApprovals.length -1) {
            activeManualApprovals[index] = activeManualApprovals[activeManualApprovals.length -1];
            approvalsIndex[activeManualApprovals[index].from][activeManualApprovals[index].to] = index; 
        }
        delete manualApprovals[_from][_to];
        activeManualApprovals.length--;
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
        for (uint256 i = 0; i < activeManualApprovals.length; i++) {
            if (activeManualApprovals[i].from == _user || activeManualApprovals[i].to == _user) 
                counter ++;
        }
        uint256[] memory indexes = new uint256[](counter);
        counter = 0;
        for (i = 0; i < activeManualApprovals.length; i++) {
            if (activeManualApprovals[i].from == _user || activeManualApprovals[i].to == _user) {
                indexes[counter];
                counter ++;
            } 
        }
        return indexes;
    }

    /**
    * @notice Returns the current number of active approvals
    */
    function getActiveApprovalsLength() external view returns(uint256) {
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
