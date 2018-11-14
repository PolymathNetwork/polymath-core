pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
//TODO remove vesting from methods, events, variables
contract VestingEscrowWallet is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    struct VestingSchedule {
        uint256 numberOfTokens;
        uint256 lockedTokens;
        uint256 vestingDuration;
        uint256 vestingFrequency;
        uint256 startDate;
        uint256 nextDate;
        State state;
    }

    struct VestingData {
        uint256 index;
        VestingSchedule[] schedules;
        uint256 availableTokens;
        uint256 claimedTokens;
    }

    struct VestingTemplate {
        uint256 numberOfTokens;
        uint256 vestingDuration;
        uint256 vestingFrequency;
    }

    enum State {STARTED, COMPLETED}

    ERC20 public token;
    address public treasury;
    uint256 public unassignedTokens;

    mapping (address => VestingData) public vestingData;
    address[] public beneficiaries;

    VestingTemplate[] public templates;

    event AddVestingSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate,
        uint256 _timestamp
    );
    event EditVestingSchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate,
        uint256 _timestamp
    );
    event RevokeVestingSchedules(address _beneficiary, uint256 _timestamp);
    event RevokeVestingSchedule(address _beneficiary, uint256 _index, uint256 _timestamp);
    event DepositTokens(uint256 _numberOfTokens, uint256 _timestamp);
    event SendToTreasury(uint256 _numberOfTokens, uint256 _timestamp);
    event SendTokens(address _beneficiary, uint256 _numberOfTokens, uint256 _timestamp);
    event AddVestingTemplate(uint256 _numberOfTokens, uint256 _vestingDuration, uint256 _vestingFrequency, uint256 _timestamp);
    event RemoveVestingTemplate(uint256 _index, uint256 _timestamp);

    constructor(address _tokenAddress, address _treasury) public {
        token = ERC20(_tokenAddress);
        treasury = _treasury;
    }

    function depositTokens(uint256 _numberOfTokens) external onlyOwner {
        require(_numberOfTokens > 0, "Number of tokens should be greater than zero");
        token.safeTransferFrom(treasury, this, _numberOfTokens);
        unassignedTokens = unassignedTokens.add(_numberOfTokens);
        /*solium-disable-next-line security/no-block-members*/
        emit DepositTokens(_numberOfTokens, now);
    }

    function sendToTreasury() external onlyOwner {
        uint256 amount = unassignedTokens;
        unassignedTokens = 0;
        token.safeTransfer(treasury, amount);
        /*solium-disable-next-line security/no-block-members*/
        emit SendToTreasury(amount, now);
    }

    function sendAvailableTokens(address _beneficiary) public onlyOwner {
        _update(_beneficiary);
        _sendTokens(_beneficiary);
    }

    function withdrawAvailableTokens() external {
        _update(msg.sender);
        _sendTokens(msg.sender);
    }

    function addVestingTemplate(uint256 _numberOfTokens, uint256 _vestingDuration, uint256 _vestingFrequency) external onlyOwner {
        _validateTemplate(_numberOfTokens, _vestingDuration, _vestingFrequency);
        VestingTemplate memory template;
        template.numberOfTokens = _numberOfTokens;
        template.vestingDuration = _vestingDuration;
        template.vestingFrequency = _vestingFrequency;
        templates.push(template);
        /*solium-disable-next-line security/no-block-members*/
        emit AddVestingTemplate(_numberOfTokens, _vestingDuration, _vestingFrequency, now);
    }

    function removeVestingTemplate(uint256 _index) external onlyOwner {
        require(_index < templates.length, "Template not found");
        templates[_index] = templates[templates.length - 1];
        templates.length--;
        /*solium-disable-next-line security/no-block-members*/
        emit RemoveVestingTemplate(_index, now);
    }

    function addVestingSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        public
        onlyOwner
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate);
        require(_numberOfTokens <= unassignedTokens, "Wallet doesn't contain enough unassigned tokens");

        VestingSchedule memory schedule;
        unassignedTokens = unassignedTokens.sub(_numberOfTokens);
        schedule.numberOfTokens = _numberOfTokens;
        schedule.lockedTokens = _numberOfTokens;
        schedule.vestingDuration = _vestingDuration;
        schedule.vestingFrequency = _vestingFrequency;
        schedule.startDate = _startDate;
        schedule.nextDate = _startDate.add(schedule.vestingFrequency);
        schedule.state = State.STARTED;
        //add beneficiary to the schedule list only if adding first schedule
        if (vestingData[_beneficiary].schedules.length == 0) {
            vestingData[_beneficiary].index = beneficiaries.length;
            beneficiaries.push(_beneficiary);
        }
        vestingData[_beneficiary].schedules.push(schedule);
        /*solium-disable-next-line security/no-block-members*/
        emit AddVestingSchedule(_beneficiary, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate, now);
    }

    function addVestingScheduleFromTemplate(address _beneficiary, uint256 _index, uint256 _startDate) public onlyOwner {
        require(_index < templates.length, "Template not found");
        VestingTemplate template = templates[_index];
        addVestingSchedule(_beneficiary, template.numberOfTokens, template.vestingDuration, template.vestingFrequency, _startDate);
    }

    function editVestingSchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        external
        onlyOwner
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate);
        require(_index < vestingData[_beneficiary].schedules.length, "Schedule not found");
//        require(_numberOfTokens <= unassignedTokens, "Wallet doesn't contain enough unassigned tokens");

        VestingSchedule storage schedule = vestingData[_beneficiary].schedules[_index];

        //TODO implement

        emit EditVestingSchedule(_beneficiary, _index, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate, now);
    }

    function revokeVestingSchedule(address _beneficiary, uint256 _index) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_index < vestingData[_beneficiary].schedules.length, "Schedule not found");
        VestingSchedule[] storage schedules = vestingData[_beneficiary].schedules;
        unassignedTokens = unassignedTokens.add(schedules[_index].lockedTokens);
        schedules[_index] = schedules[schedules.length - 1];
        schedules.length--;
        if (schedules.length == 0) {
            _revokeVestingSchedules(_beneficiary);
        }
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedule(_beneficiary, _index, now);
    }

    function revokeVestingSchedules(address _beneficiary) public onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        VestingData data = vestingData[_beneficiary];
        for (uint256 i = 0; i < data.schedules.length; i++) {
            unassignedTokens = unassignedTokens.add(data.schedules[i].lockedTokens);
        }
        delete vestingData[_beneficiary].schedules;
        _revokeVestingSchedules(_beneficiary);
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedules(_beneficiary, now);
    }

    function getVestingSchedule(address _beneficiary, uint256 _index) external onlyOwner returns(uint256, uint256, uint256, uint256, uint256, uint256, State) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_index < vestingData[_beneficiary].schedules.length, "Schedule not found");
        VestingSchedule schedule = vestingData[_beneficiary].schedules[_index];
        return (
            schedule.numberOfTokens,
            schedule.lockedTokens,
            schedule.vestingDuration,
            schedule.vestingFrequency,
            schedule.startDate,
            schedule.nextDate,
            schedule.state
        );
    }

    function getVestingScheduleCount(address _beneficiary) external onlyOwner returns(uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        return vestingData[_beneficiary].schedules.length;
    }

    function batchSendAvailableTokens(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            sendAvailableTokens(_beneficiaries[i]);
        }
    }

    function batchAddVestingSchedule(
        address[] _beneficiaries,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addVestingSchedule(_beneficiaries[i], _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate);
        }
    }

    function batchAddVestingScheduleFromTemplate(address[] _beneficiaries, uint256 _index, uint256 _startDate) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addVestingScheduleFromTemplate(_beneficiaries[i], _index, _startDate);
        }
    }

    function batchRevokeVestingSchedules(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            revokeVestingSchedules(_beneficiaries[i]);
        }
    }

    function _validateSchedule(address _beneficiary, uint256 _numberOfTokens, uint256 _vestingDuration, uint256 _vestingFrequency, uint256 _startDate) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        _validateTemplate(_numberOfTokens, _vestingDuration, _vestingFrequency);
        require(_startDate < now, "Start date shouldn't be in the past");
    }

    function _validateTemplate(uint256 _numberOfTokens, uint256 _vestingDuration, uint256 _vestingFrequency) {
        require(_numberOfTokens > 0, "Number of tokens should be greater than zero");
        require(_vestingDuration % _vestingFrequency == 0, "Duration should be divided entirely by frequency");
        uint256 periodCount = _vestingDuration.div(_vestingFrequency);
        require(_numberOfTokens % periodCount == 0, "Number of tokens should be divided entirely by period count");
    }

    function _sendTokens(address _beneficiary) private {
        VestingData data = vestingData[_beneficiary];
        uint256 amount = data.availableTokens;
        require(amount > 0, "Beneficiary doesn't have available tokens");
        data.availableTokens = 0;
        data.claimedTokens = data.claimedTokens.add(amount);
        token.safeTransfer(_beneficiary, amount);
        /*solium-disable-next-line security/no-block-members*/
        emit SendTokens(_beneficiary, amount, now);
    }

    function _update(address _beneficiary) private {
        VestingData data = vestingData[_beneficiary];
        for (uint256 i = 0; i < data.schedules.length; i++) {
            VestingSchedule schedule = data.schedules[i];
            /*solium-disable-next-line security/no-block-members*/
            if (schedule.state == State.STARTED && schedule.nextDate <= now) {
                uint256 periodCount = schedule.vestingDuration.div(schedule.vestingFrequency);
                uint256 numberOfTokens = schedule.numberOfTokens.div(periodCount);
                data.availableTokens = data.availableTokens.add(numberOfTokens);
                schedule.lockedTokens = schedule.lockedTokens.sub(numberOfTokens);
                if (schedule.nextDate == schedule.startDate.add(schedule.vestingDuration)) {
                    schedule.state = State.COMPLETED;
                } else {
                    schedule.nextDate = schedule.nextDate.add(schedule.vestingFrequency);
                }
            }
        }
    }

    function _updateAll() private {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            _update(beneficiaries[i]);
        }
    }

    function _revokeVestingSchedules(address _beneficiary) private {
        if (_canBeRemoved(_beneficiary)) {
            uint256 index = vestingData[_beneficiary].index;
            beneficiaries[index] = beneficiaries[beneficiaries.length - 1];
            beneficiaries.length--;
            if (index != beneficiaries.length) {
                vestingData[beneficiaries[index]].index = index;
            }
            delete vestingData[_beneficiary];
        }
    }

    function _canBeRemoved(address _beneficiary) private returns(bool) {
        return (vestingData[_beneficiary].availableTokens == 0);
    }

}
