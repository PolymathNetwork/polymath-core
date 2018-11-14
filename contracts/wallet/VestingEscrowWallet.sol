pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
//TODO ?
import "../interfaces/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWallet is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

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

    enum State {STARTED, COMPLETED}

    IERC20 public token;
    address public treasury;

    uint256 public unassignedTokens;

    mapping (address => VestingData) public vestingData;
    address[] public beneficiaries;

    event AddVestingSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate,
        uint256 _timestamp
    );
    event RevokeVestingSchedules(address _beneficiary, uint256 _timestamp);
    event RevokeVestingSchedule(address _beneficiary, uint256 index, uint256 _timestamp);

    constructor(address _tokenAddress, address _treasury) public {
        token = IERC20(_tokenAddress);
        treasury = _treasury;
    }

    function addVestingSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        external
        onlyOwner
    {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_numberOfTokens > 0, "Number of tokens should be greater than zero");
        require(_vestingDuration % _vestingFrequency == 0, "Duration should be divided entirely by frequency");
        uint256 periodCount = _vestingDuration.div(_vestingFrequency);
        require(_numberOfTokens % periodCount == 0, "Number of tokens should be divided entirely by period count");
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

    function revokeVestingSchedule(address _beneficiary, uint256 index) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(index < vestingData[_beneficiary].schedules.length, "Schedule not found");
        VestingSchedule[] storage schedules = vestingData[_beneficiary].schedules;
        unassignedTokens = unassignedTokens.add(schedules[index].lockedTokens);
        schedules[index] = schedules[schedules.length - 1];
        schedules.length--;
        if (schedules.length == 0) {
            _revokeVestingSchedules(_beneficiary);
        }
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedule(_beneficiary, index, now);
    }

    function revokeVestingSchedules(address _beneficiary) external onlyOwner {
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
        //TODO implement
    }




    function _update(address _beneficiary) internal {
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
