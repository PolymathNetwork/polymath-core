pragma solidity ^0.4.24;

import "./../../Checkpoint/ICheckpoint.sol";
import "../../TransferManager/ITransferManager.sol";
import "../../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract ScheduledCheckpoint is ICheckpoint, ITransferManager {
    using SafeMath for uint256;

    enum TimeUnit {SECONDS, DAYS, WEEKS, MONTHS, YEARS}

    struct Schedule {
        bytes32 name;
        uint256 startTime;
        uint256 nextTime;
        uint256 interval;
        TimeUnit timeUnit;
        uint256 index;
        uint256[] checkpointIds;
        uint256[] timestamps;
        uint256[] periods;
        uint256 totalPeriods;
    }

    bytes32[] public names;

    mapping (bytes32 => Schedule) public schedules;

    event AddSchedule(bytes32 _name, uint256 _startTime, uint256 _interval, TimeUnit _timeUint, uint256 _timestamp);
    event RemoveSchedule(bytes32 _name, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress) public
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
     * @notice adds a new schedule for checkpoints
     * @param _name name of the new schedule (must be unused)
     * @param _startTime start time of the schedule (first checkpoint)
     * @param _interval interval at which checkpoints should be created
     * @param _timeUnit unit of time at which checkpoints should be created
     */
    function addSchedule(bytes32 _name, uint256 _startTime, uint256 _interval, TimeUnit _timeUnit) external onlyOwner {
        require(_startTime > now, "Start time must be in the future");
        require(schedules[_name].name == bytes32(0), "Name already in use");
        schedules[_name].name = _name;
        schedules[_name].startTime = _startTime;
        schedules[_name].nextTime = _startTime;
        schedules[_name].interval = _interval;
        schedules[_name].timeUnit = _timeUnit;
        schedules[_name].index = names.length;
        names.push(_name);
        emit AddSchedule(_name, _startTime, _interval, _timeUnit, now);
    }

    /**
     * @notice removes a schedule for checkpoints
     * @param _name name of the schedule to be removed
     */
    function removeSchedule(bytes32 _name) external onlyOwner {
        require(schedules[_name].name == _name, "Name does not exist");
        uint256 index = schedules[_name].index;
        names[index] = names[names.length - 1];
        names.length--;
        if (index != names.length) {
            schedules[names[index]].index = index;
        }
        delete schedules[_name];
        emit RemoveSchedule(_name, now);
    }


    /**
     * @notice Used to create checkpoints that correctly reflect balances
     * @param _isTransfer whether or not an actual transfer is occuring
     * @return always returns Result.NA
     */
    function verifyTransfer(address /* _from */, address /* _to */, uint256 /* _amount */, bytes /* _data */, bool _isTransfer) public returns(Result) {
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not owner");
        if (paused || !_isTransfer) {
            return Result.NA;
        }
        _updateAll();
        return Result.NA;
    }

    /**
     * @notice gets schedule details
     * @param _name name of the schedule
     */
    function getSchedule(bytes32 _name) view external returns(bytes32, uint256, uint256, uint256, TimeUnit, uint256[], uint256[], uint256[], uint256) {
        Schedule storage schedule = schedules[_name];
        return (
            schedule.name,
            schedule.startTime,
            schedule.nextTime,
            schedule.interval,
            schedule.timeUnit,
            schedule.checkpointIds,
            schedule.timestamps,
            schedule.periods,
            schedule.totalPeriods
        );
    }

    /**
     * @notice manually triggers update outside of transfer request for named schedule (can be used to reduce user gas costs)
     * @param _name name of the schedule
     */
    function update(bytes32 _name) external onlyOwner {
        _update(_name);
    }

    function _update(bytes32 _name) internal {
        Schedule storage schedule = schedules[_name];
        if (schedule.nextTime <= now) {
            uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
            schedule.checkpointIds.push(checkpointId);
            schedule.timestamps.push(schedule.nextTime);
            uint256 periods;
            if (schedule.timeUnit == TimeUnit.SECONDS ) {
                periods = now.sub(schedule.nextTime).div(schedule.interval).add(1);
                schedule.nextTime = periods.mul(schedule.interval).add(schedule.nextTime);
            } else if (schedule.timeUnit == TimeUnit.DAYS ) {
                periods = BokkyPooBahsDateTimeLibrary.diffDays(schedule.nextTime, now).div(schedule.interval).add(1);
                schedule.nextTime = BokkyPooBahsDateTimeLibrary.addDays(schedule.nextTime, periods.mul(schedule.interval));
            } else if (schedule.timeUnit == TimeUnit.WEEKS ) {
                periods = BokkyPooBahsDateTimeLibrary.diffDays(schedule.nextTime, now).div(7).div(schedule.interval).add(1);
                schedule.nextTime = BokkyPooBahsDateTimeLibrary.addDays(schedule.nextTime, periods.mul(schedule.interval).mul(7));
            } else if (schedule.timeUnit == TimeUnit.MONTHS ) {
                periods = BokkyPooBahsDateTimeLibrary.diffMonths(schedule.nextTime, now).div(schedule.interval).add(1);
                uint256 totalPeriods = schedule.totalPeriods.add(periods);
                schedule.nextTime = BokkyPooBahsDateTimeLibrary.addMonths(schedule.startTime, totalPeriods.mul(schedule.interval));
            } else if (schedule.timeUnit == TimeUnit.YEARS ) {
                periods = BokkyPooBahsDateTimeLibrary.diffYears(schedule.nextTime, now).div(schedule.interval).add(1);
                schedule.nextTime = BokkyPooBahsDateTimeLibrary.addYears(schedule.nextTime, periods.mul(schedule.interval));
            }
            schedule.totalPeriods = schedule.totalPeriods.add(periods);
            schedule.periods.push(periods);
        }
    }

    /**
     * @notice manually triggers update outside of transfer request for all schedules (can be used to reduce user gas costs)
     */
    function updateAll() onlyOwner external {
        _updateAll();
    }

    function _updateAll() internal {
        uint256 i;
        for (i = 0; i < names.length; i++) {
            _update(names[i]);
        }
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() view external returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
