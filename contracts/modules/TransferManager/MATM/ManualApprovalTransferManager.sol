pragma solidity 0.5.8;

import "../TransferManager.sol";
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
        address indexed _editedBy
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
     */
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata /* _data */
    )
        external
        onlySecurityToken
        returns(Result)
    {

        (Result success, bytes32 esc) = _verifyTransfer(_from, _to, _amount);
        if (esc != bytes32(0)) {
            uint256 index = approvalIndex[_from][_to] - 1;
            ManualApproval storage approval = approvals[index];
            approval.allowance = approval.allowance.sub(_amount);
        }
        return (success);
    }


    /**
     * @notice Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes memory /* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        return _verifyTransfer(_from, _to, _amount);
    }

    function _verifyTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        internal
        view
        returns(Result, bytes32)
    {
        uint256 index = approvalIndex[_from][_to];
        if (!paused && index != 0) {
            index--; //Actual index is storedIndex - 1
            ManualApproval memory approval = approvals[index];
            if ((approval.expiryTime >= now) && (approval.allowance >= _amount)) {
                return (Result.VALID, bytes32(uint256(address(this)) << 96));
            }
        }
        return (Result.NA, bytes32(0));
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
        withPerm(ADMIN)
    {
        _addManualApproval(_from, _to, _allowance, _expiryTime, _description);
    }

    function _addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description) internal {
        require(_expiryTime > now, "Invalid expiry time");
        require(_allowance > 0, "Invalid allowance");
        if (approvalIndex[_from][_to] != 0) {
            uint256 index = approvalIndex[_from][_to] - 1;
            require(approvals[index].expiryTime < now || approvals[index].allowance == 0, "Approval already exists");
            _revokeManualApproval(_from, _to);
        }
        approvals.push(ManualApproval(_from, _to, _allowance, _allowance, _expiryTime, _description));
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
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _allowances,
        uint256[] memory _expiryTimes,
        bytes32[] memory _descriptions
    )
        public
        withPerm(ADMIN)
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
    * @param _changeInAllowance is the change in allowance
    * @param _description Description about the manual approval
    * @param _increase tells whether the allowances will be increased (true) or decreased (false).
    * or any value when there is no change in allowances
    */
    function modifyManualApproval(
        address _from,
        address _to,
        uint256 _expiryTime,
        uint256 _changeInAllowance,
        bytes32 _description,
        bool _increase
    )
        external
        withPerm(ADMIN)
    {
        _modifyManualApproval(_from, _to, _expiryTime, _changeInAllowance, _description, _increase);
    }

    function _modifyManualApproval(
        address _from,
        address _to,
        uint256 _expiryTime,
        uint256 _changeInAllowance,
        bytes32 _description,
        bool _increase
    )
        internal
    {
        /*solium-disable-next-line security/no-block-members*/
        require(_expiryTime > now, "Invalid expiry time");
        uint256 index = approvalIndex[_from][_to];
        require(index != 0, "Approval not present");
        index--; //Index is stored in an incremented form. 0 represnts non existant.
        ManualApproval storage approval = approvals[index];
        uint256 allowance = approval.allowance;
        uint256 initialAllowance = approval.initialAllowance;
        uint256 expiryTime = approval.expiryTime;
        require(allowance != 0, "Approval has been exhausted");
        require(expiryTime > now, "Approval has expired");

        if (_changeInAllowance > 0) {
            if (_increase) {
                // Allowance get increased
                allowance = allowance.add(_changeInAllowance);
                initialAllowance = initialAllowance.add(_changeInAllowance);
            } else {
                // Allowance get decreased
                if (_changeInAllowance >= allowance) {
                    if (_changeInAllowance >= initialAllowance) {
                        initialAllowance = 0;
                    }
                    else {
                        initialAllowance = initialAllowance.sub(allowance);
                    }
                    allowance = 0;
                } else {
                    allowance = allowance.sub(_changeInAllowance);
                    initialAllowance = initialAllowance.sub(_changeInAllowance);
                }
            }
            approval.allowance = allowance;
            approval.initialAllowance = initialAllowance;
        }
        // Greedy storage technique
        if (expiryTime != _expiryTime) {
            approval.expiryTime = _expiryTime;
        }
        if (approval.description != _description) {
            approval.description = _description;
        }
        emit ModifyManualApproval(_from, _to, _expiryTime, allowance, _description, msg.sender);
    }

    /**
     * @notice Adds mutiple manual approvals in batch
     * @param _from is the address array from which transfers are approved
     * @param _to is the address array to which transfers are approved
     * @param _expiryTimes is the array of the times until which eath transfer is allowed
     * @param _changeInAllowance is the array of change in allowances
     * @param _descriptions is the description array for these manual approvals
     * @param _increase Array of bools that tells whether the allowances will be increased (true) or decreased (false).
     * or any value when there is no change in allowances
     */
    function modifyManualApprovalMulti(
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _expiryTimes,
        uint256[] memory _changeInAllowance,
        bytes32[] memory _descriptions,
        bool[] memory _increase
    )
        public
        withPerm(ADMIN)
    {
        _checkInputLengthArray(_from, _to, _changeInAllowance, _expiryTimes, _descriptions);
        require(_increase.length == _changeInAllowance.length, "Input array length mismatch");
        for (uint256 i = 0; i < _from.length; i++) {
            _modifyManualApproval(_from[i], _to[i], _expiryTimes[i], _changeInAllowance[i], _descriptions[i], _increase[i]);
        }
    }

    /**
    * @notice Removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) external withPerm(ADMIN) {
        _revokeManualApproval(_from, _to);
    }

    function _revokeManualApproval(address _from, address _to) internal {
        uint256 index = approvalIndex[_from][_to];
        require(index != 0, "Approval not exist");

        // find the record in active approvals array & delete it
        index--; //Index is stored after incrementation so that 0 represents non existant index
        uint256 lastApprovalIndex = approvals.length - 1;
        if (index != lastApprovalIndex) {
            approvals[index] = approvals[lastApprovalIndex];
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
    function revokeManualApprovalMulti(address[] calldata _from, address[] calldata _to) external withPerm(ADMIN) {
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
    function getActiveApprovalsToUser(address _user) external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, uint256[] memory, bytes32[] memory) {
        uint256 counter = 0;
        uint256 approvalsLength = approvals.length;
        for (uint256 i = 0; i < approvalsLength; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now)
                counter ++;
        }

        address[] memory from = new address[](counter);
        address[] memory to = new address[](counter);
        uint256[] memory initialAllowance = new uint256[](counter);
        uint256[] memory allowance = new uint256[](counter);
        uint256[] memory expiryTime = new uint256[](counter);
        bytes32[] memory description = new bytes32[](counter);

        counter = 0;
        for (uint256 i = 0; i < approvalsLength; i++) {
            if ((approvals[i].from == _user || approvals[i].to == _user)
                && approvals[i].expiryTime >= now) {

                from[counter]=approvals[i].from;
                to[counter]=approvals[i].to;
                initialAllowance[counter]=approvals[i].initialAllowance;
                allowance[counter]=approvals[i].allowance;
                expiryTime[counter]=approvals[i].expiryTime;
                description[counter]=approvals[i].description;
                counter ++;
            }
        }
        return (from, to, initialAllowance, allowance, expiryTime, description);
    }

    /**
     * @notice Get the details of the approval corresponds to _from & _to addresses
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @return uint256 expiryTime of the approval
     * @return uint256 allowance provided to the approval
     * @return uint256 the remaining allowance
     * @return uint256 Description provided to the approval
     */
    function getApprovalDetails(address _from, address _to) external view returns(uint256, uint256, uint256, bytes32) {
        uint256 index = approvalIndex[_from][_to];
        if (index != 0) {
            index--;
            assert(index < approvals.length);
            ManualApproval storage approval = approvals[index];
            return(
                approval.expiryTime,
                approval.initialAllowance,
                approval.allowance,
                approval.description
            );
        }
        return (uint256(0), uint256(0), uint256(0), bytes32(0));
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
    function getAllApprovals() external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, uint256[] memory, bytes32[] memory) {
        uint256 approvalsLength = approvals.length;
        address[] memory from = new address[](approvalsLength);
        address[] memory to = new address[](approvalsLength);
        uint256[] memory initialAllowance = new uint256[](approvalsLength);
        uint256[] memory allowance = new uint256[](approvalsLength);
        uint256[] memory expiryTime = new uint256[](approvalsLength);
        bytes32[] memory description = new bytes32[](approvalsLength);

        for (uint256 i = 0; i < approvalsLength; i++) {

            from[i]=approvals[i].from;
            to[i]=approvals[i].to;
            initialAllowance[i]=approvals[i].initialAllowance;
            allowance[i]=approvals[i].allowance;
            expiryTime[i]=approvals[i].expiryTime;
            description[i]=approvals[i].description;

        }

        return (from, to, initialAllowance, allowance, expiryTime, description);

    }

    /**
     * @notice Returns the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
