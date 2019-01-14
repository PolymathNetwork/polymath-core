pragma solidity ^0.5.0;

import "./TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ManualApprovalTransferManagerStorage.sol";

/**
 * @title Transfer Manager module for manually approving transactions between accounts
 */
contract ManualApprovalTransferManager is ManualApprovalTransferManagerStorage, TransferManager {
    using SafeMath for uint256;

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
     * @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata, /* _data */
        bool _isTransfer
    )
        external
        returns(Result)
    {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not the owner");

        if (!paused && approvalIndex[_from][_to] != 0) {
            uint256 index = approvalIndex[_from][_to] - 1;
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
        if (approvalIndex[_from][_to] != 0) {
            uint256 index = approvalIndex[_from][_to] - 1;
            require(approvals[index].expiryTime < now || approvals[index].allowance == 0, "Approval already exists");
            _revokeManualApproval(_from, _to);
        }
        approvals.push(ManualApproval(_from, _to, _allowance, _expiryTime, _description));
        approvalIndex[_from][_to] = approvals.length;
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
        address[] calldata _from,
        address[] calldata _to,
        uint256[] calldata _allowances,
        uint256[] calldata _expiryTimes,
        bytes32[] calldata _descriptions
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
        require(approvalIndex[_from][_to] != 0, "Approval not present");
        uint256 index = approvalIndex[_from][_to] - 1;
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
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _expiryTimes,
        uint256[] memory _changedAllowances,
        bytes32[] memory _descriptions,
        uint8[] memory _changes
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
        require(approvalIndex[_from][_to] != 0, "Approval not exist");

        // find the record in active approvals array & delete it
        uint256 index = approvalIndex[_from][_to] - 1;
        if (index != approvals.length -1) {
            approvals[index] = approvals[approvals.length -1];
            approvalIndex[approvals[index].from][approvals[index].to] = index + 1;
        }
        delete approvalIndex[_from][_to];
        approvals.length--;
        emit RevokeManualApproval(_from, _to, msg.sender);
    }

    /**
    * @notice Removes mutiple pairs of addresses from manual approvals
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    */
    function revokeManualApprovalMulti(address[] calldata _from, address[] calldata _to) external withPerm(TRANSFER_APPROVAL) {
        require(_from.length == _to.length, "Input array length mismatch");
        for(uint256 i = 0; i < _from.length; i++){
            _revokeManualApproval(_from[i], _to[i]);
        }
    }

    function _checkInputLengthArray(
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _expiryTimes,
        uint256[] memory _allowances,
        bytes32[] memory _descriptions
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
     * @return address[] addresses from
     * @return address[] addresses to
     * @return uint256[] allowances provided to the approvals
     * @return uint256[] expiry times provided to the approvals
     * @return bytes32[] descriptions provided to the approvals
     */
    function getActiveApprovalsToUser(address _user) external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, bytes32[] memory) {
        uint256 counter = 0;
        for (uint256 i = 0; i < approvals.length; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now)
                counter ++;
        }

        address[] memory from = new address[](counter);
        address[] memory to = new address[](counter);
        uint256[] memory allowance = new uint256[](counter);
        uint256[] memory expiryTime = new uint256[](counter);
        bytes32[] memory description = new bytes32[](counter);

        counter = 0;
        for (uint256 i = 0; i < approvals.length; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now) {

                from[counter]=approvals[i].from;
                to[counter]=approvals[i].to;
                allowance[counter]=approvals[i].allowance;
                expiryTime[counter]=approvals[i].expiryTime;
                description[counter]=approvals[i].description;
                counter ++;
            }
        }
        return (from, to, allowance, expiryTime, description);
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
        if (approvalIndex[_from][_to] != 0) {
            uint256 index = approvalIndex[_from][_to] - 1;
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
     * @notice Get the details of all approvals
     * @return address[] addresses from
     * @return address[] addresses to
     * @return uint256[] allowances provided to the approvals
     * @return uint256[] expiry times provided to the approvals
     * @return bytes32[] descriptions provided to the approvals
     */
    function getAllApprovals() external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, bytes32[] memory) {
        address[] memory from = new address[](approvals.length);
        address[] memory to = new address[](approvals.length);
        uint256[] memory allowance = new uint256[](approvals.length);
        uint256[] memory expiryTime = new uint256[](approvals.length);
        bytes32[] memory description = new bytes32[](approvals.length);

        for (uint256 i = 0; i < approvals.length; i++) {

            from[i]=approvals[i].from;
            to[i]=approvals[i].to;
            allowance[i]=approvals[i].allowance;
            expiryTime[i]=approvals[i].expiryTime;
            description[i]=approvals[i].description;

        }

        return (from, to, allowance, expiryTime, description);

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
