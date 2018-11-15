pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
//TODO add docs for public, external methods
contract VestingEscrowWallet is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    struct Schedule {
        uint256 numberOfTokens;
        uint256 lockedTokens;
        uint256 duration;
        uint256 frequency;
        uint256 startTime;
        uint256 nextTime;
        State state;
    }

    struct Data {
        uint256 index;
        Schedule[] schedules;
        uint256 availableTokens;
        uint256 claimedTokens;
    }

    struct Template {
        uint256 numberOfTokens;
        uint256 duration;
        uint256 frequency;
    }

    enum State {CREATED, STARTED, COMPLETED}

    ERC20 public token;
    address public treasury;
    uint256 public unassignedTokens;

    mapping (address => Data) public dataMap;
    address[] public beneficiaries;

    Template[] public templates;

    event AddSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime,
        uint256 _timestamp
    );
    event EditSchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime,
        uint256 _timestamp
    );
    event RevokeSchedules(address _beneficiary, uint256 _timestamp);
    event RevokeSchedule(address _beneficiary, uint256 _index, uint256 _timestamp);
    event DepositTokens(uint256 _numberOfTokens, uint256 _timestamp);
    event SendToTreasury(uint256 _numberOfTokens, uint256 _timestamp);
    event SendTokens(address _beneficiary, uint256 _numberOfTokens, uint256 _timestamp);
    event AddTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _timestamp);
    event RemoveTemplate(uint256 _index, uint256 _timestamp);

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

    function addTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external onlyOwner {
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        Template memory template;
        template.numberOfTokens = _numberOfTokens;
        template.duration = _duration;
        template.frequency = _frequency;
        templates.push(template);
        /*solium-disable-next-line security/no-block-members*/
        emit AddTemplate(_numberOfTokens, _duration, _frequency, now);
    }

    function removeTemplate(uint256 _index) external onlyOwner {
        require(_index < templates.length, "Template not found");
        templates[_index] = templates[templates.length - 1];
        templates.length--;
        /*solium-disable-next-line security/no-block-members*/
        emit RemoveTemplate(_index, now);
    }

    function getTemplateCount() external onlyOwner returns(uint256) {
        return templates.length;
    }

    function addSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        public
        onlyOwner
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        require(_numberOfTokens <= unassignedTokens, "Wallet doesn't contain enough unassigned tokens");

        Schedule memory schedule;
        unassignedTokens = unassignedTokens.sub(_numberOfTokens);
        schedule.numberOfTokens = _numberOfTokens;
        schedule.lockedTokens = _numberOfTokens;
        schedule.duration = _duration;
        schedule.frequency = _frequency;
        schedule.startTime = _startTime;
        schedule.nextTime = _startTime.add(schedule.frequency);
        schedule.state = State.CREATED;
        //add beneficiary to the schedule list only if adding first schedule
        if (dataMap[_beneficiary].schedules.length == 0) {
            dataMap[_beneficiary].index = beneficiaries.length;
            beneficiaries.push(_beneficiary);
        }
        dataMap[_beneficiary].schedules.push(schedule);
        /*solium-disable-next-line security/no-block-members*/
        emit AddSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime, now);
    }

    function addScheduleFromTemplate(address _beneficiary, uint256 _index, uint256 _startTime) public onlyOwner {
        require(_index < templates.length, "Template not found");
        Template storage template = templates[_index];
        addSchedule(_beneficiary, template.numberOfTokens, template.duration, template.frequency, _startTime);
    }

    function editSchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        public
        onlyOwner
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        require(_index < dataMap[_beneficiary].schedules.length, "Schedule not found");
        Schedule storage schedule = dataMap[_beneficiary].schedules[_index];
        /*solium-disable-next-line security/no-block-members*/
        require(now < schedule.startTime, "It's not possible to edit the started schedule");
        if (_numberOfTokens <= schedule.lockedTokens) {
            unassignedTokens = unassignedTokens.add(schedule.lockedTokens - _numberOfTokens);
        } else {
            require((_numberOfTokens - schedule.lockedTokens) <= unassignedTokens, "Wallet doesn't contain enough unassigned tokens");
            unassignedTokens = unassignedTokens.sub(_numberOfTokens - schedule.lockedTokens);
        }
        schedule.numberOfTokens = _numberOfTokens;
        schedule.lockedTokens = _numberOfTokens;
        schedule.duration = _duration;
        schedule.frequency = _frequency;
        schedule.startTime = _startTime;
        schedule.nextTime = _startTime.add(schedule.frequency);
        emit EditSchedule(_beneficiary, _index, _numberOfTokens, _duration, _frequency, _startTime, now);
    }

    function revokeSchedule(address _beneficiary, uint256 _index) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_index < dataMap[_beneficiary].schedules.length, "Schedule not found");
        Schedule[] storage schedules = dataMap[_beneficiary].schedules;
        unassignedTokens = unassignedTokens.add(schedules[_index].lockedTokens);
        schedules[_index] = schedules[schedules.length - 1];
        schedules.length--;
        if (schedules.length == 0) {
            _revokeSchedules(_beneficiary);
        }
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeSchedule(_beneficiary, _index, now);
    }

    function revokeSchedules(address _beneficiary) public onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        Data storage data = dataMap[_beneficiary];
        for (uint256 i = 0; i < data.schedules.length; i++) {
            unassignedTokens = unassignedTokens.add(data.schedules[i].lockedTokens);
        }
        delete dataMap[_beneficiary].schedules;
        _revokeSchedules(_beneficiary);
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeSchedules(_beneficiary, now);
    }

    function getSchedule(address _beneficiary, uint256 _index) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, State) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_index < dataMap[_beneficiary].schedules.length, "Schedule not found");
        Schedule storage schedule = dataMap[_beneficiary].schedules[_index];
        return (
            schedule.numberOfTokens,
            schedule.lockedTokens,
            schedule.duration,
            schedule.frequency,
            schedule.startTime,
            schedule.nextTime,
            schedule.state
        );
    }

    function getScheduleCount(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        return dataMap[_beneficiary].schedules.length;
    }

    function getAvailableTokens(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        return dataMap[_beneficiary].availableTokens;
    }

    function batchSendAvailableTokens(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            sendAvailableTokens(_beneficiaries[i]);
        }
    }

    function batchAddSchedule(
        address[] _beneficiaries,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addSchedule(_beneficiaries[i], _numberOfTokens, _duration, _frequency, _startTime);
        }
    }

    function batchAddScheduleFromTemplate(address[] _beneficiaries, uint256 _index, uint256 _startTime) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addScheduleFromTemplate(_beneficiaries[i], _index, _startTime);
        }
    }

    function batchRevokeSchedules(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            revokeSchedules(_beneficiaries[i]);
        }
    }

    function batchEditSchedule(
        address[] _beneficiaries,
        uint256[] _indexes,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        external
        onlyOwner
    {
        require(_beneficiaries.length == _indexes.length, "Beneficiaries array and indexes array should have the same length");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            editSchedule(_beneficiaries[i], _indexes[i], _numberOfTokens, _duration, _frequency, _startTime);
        }
    }

    function _validateSchedule(address _beneficiary, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime) private view {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        require(now < _startTime, "Start date shouldn't be in the past");
    }

    function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) private pure {
        require(_numberOfTokens > 0, "Number of tokens should be greater than zero");
        require(_duration % _frequency == 0, "Duration should be divided entirely by frequency");
        uint256 periodCount = _duration.div(_frequency);
        require(_numberOfTokens % periodCount == 0, "Number of tokens should be divided entirely by period count");
    }

    function _sendTokens(address _beneficiary) private {
        Data storage data = dataMap[_beneficiary];
        uint256 amount = data.availableTokens;
        require(amount > 0, "Beneficiary doesn't have available tokens");
        data.availableTokens = 0;
        data.claimedTokens = data.claimedTokens.add(amount);
        token.safeTransfer(_beneficiary, amount);
        /*solium-disable-next-line security/no-block-members*/
        emit SendTokens(_beneficiary, amount, now);
    }

    function _update(address _beneficiary) private {
        Data storage data = dataMap[_beneficiary];
        for (uint256 i = 0; i < data.schedules.length; i++) {
            Schedule storage schedule = data.schedules[i];
            /*solium-disable-next-line security/no-block-members*/
            if (schedule.state != State.COMPLETED && schedule.nextTime <= now) {
                uint256 periodCount = schedule.duration.div(schedule.frequency);
                uint256 numberOfTokens = schedule.numberOfTokens.div(periodCount);
                data.availableTokens = data.availableTokens.add(numberOfTokens);
                schedule.lockedTokens = schedule.lockedTokens.sub(numberOfTokens);
                if (schedule.nextTime == schedule.startTime.add(schedule.duration)) {
                    schedule.state = State.COMPLETED;
                } else {
                    schedule.state = State.STARTED;
                    schedule.nextTime = schedule.nextTime.add(schedule.frequency);
                }
            }
        }
    }

    function _updateAll() private {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            _update(beneficiaries[i]);
        }
    }

    function _revokeSchedules(address _beneficiary) private {
        if (_canBeRemoved(_beneficiary)) {
            uint256 index = dataMap[_beneficiary].index;
            beneficiaries[index] = beneficiaries[beneficiaries.length - 1];
            beneficiaries.length--;
            if (index != beneficiaries.length) {
                dataMap[beneficiaries[index]].index = index;
            }
            delete dataMap[_beneficiary];
        }
    }

    function _canBeRemoved(address _beneficiary) private view returns(bool) {
        return (dataMap[_beneficiary].availableTokens == 0);
    }

}
