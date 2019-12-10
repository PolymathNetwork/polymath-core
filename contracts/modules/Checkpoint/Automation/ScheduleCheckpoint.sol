pragma solidity 0.5.8;

import "../ICheckpoint.sol";
import "../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";
import "./ScheduleCheckpointStorage.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract ScheduleCheckpoint is ScheduleCheckpointStorage, TransferManager, ICheckpoint {
    using SafeMath for uint256;

    event AddSchedule(bytes32 _name, uint256 _startTime, uint256 _endTime, uint256 _frequency, FrequencyUnit _frequencyUnit);
    event RemoveSchedule(bytes32 _name);
    event ModifyScheduleEndTime(bytes32 _name, uint256 _oldEndTime, uint256 _newEndTime);

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
     * @notice adds a new schedule for checkpoints
     * @param _name name of the new schedule (must be unused)
     * @param _startTime start time of the schedule (first checkpoint)
     * @param _endTime End time of the schedule
     * @param _frequency How frequent checkpoint will being created
     * @param _frequencyUnit Unit of frequency i.e If issuer puts _frequency = 10
     * & frequency unit is DAYS then it means every 10 day frequency new checkpoint will be created
     */
    function addSchedule(bytes32 _name, uint256 _startTime, uint256 _endTime, uint256 _frequency, FrequencyUnit _frequencyUnit) withPerm(OPERATOR) external {
        require(_name != bytes32(0), "Empty name");
        require(_startTime > now, "Start time must be in the future");
        require(schedules[_name].name == bytes32(0), "Name already in use");
        _validateMaximumLimitCount();
        uint256 endTime = _endTime;
        if (_endTime <= _startTime)
            endTime = uint256(0);
        schedules[_name].name = _name;
        schedules[_name].startTime = _startTime;
        schedules[_name].endTime = endTime;
        schedules[_name].createNextCheckpointAt = _startTime;
        schedules[_name].frequency = _frequency;
        schedules[_name].frequencyUnit = _frequencyUnit;
        schedules[_name].index = names.length;
        names.push(_name);
        emit AddSchedule(_name, _startTime, endTime, _frequency, _frequencyUnit);
    }

    /**
     * @notice removes a schedule for checkpoints
     * @param _name name of the schedule to be removed
     */
    function removeSchedule(bytes32 _name) withPerm(OPERATOR) external {
        require(_name != bytes32(0), "Invalid schedule name");
        require(schedules[_name].name == _name, "Schedule does not exist");
        uint256 index = schedules[_name].index;
        uint256 lengthOfNameArray = names.length;
        if (index != lengthOfNameArray - 1) {
            names[index] = names[lengthOfNameArray - 1];
            schedules[names[index]].index = index;
        }
        names.length--;
        delete schedules[_name];
        emit RemoveSchedule(_name);
    }

    /**
     * @notice Used to modify the end time of the schedule
     * @dev new endtime can be set as 0 or any value greater than now.
     * @param _name Name of the schedule that need to modify
     * @param _newEndTime New end time of the schedule
     */
    function modifyScheduleEndTime(bytes32 _name, uint256 _newEndTime) withPerm(OPERATOR) external {
        Schedule memory _schedule = schedules[_name];
        require(_schedule.name != bytes32(0), "Invalid name");
        if (_schedule.endTime > 0)
            require(_schedule.endTime > now, "Schedule already ended");
        if (_newEndTime > 0)
            require(_newEndTime > now && _newEndTime > _schedule.startTime, "Invalid end time");
        emit ModifyScheduleEndTime(_name, _schedule.endTime, _newEndTime);
        schedules[_name].endTime = _newEndTime;
    }

    /**
     * @notice Used to create checkpoints that correctly reflect balances
     * @return always returns Result.NA
     */
    function executeTransfer(
        address, /* _from */
        address, /* _to */
        uint256, /* _amount */
        bytes calldata /* _data */
    )
        external
        onlySecurityToken
        returns(Result)
    {
        if (!paused) {
            _updateAll();
        }
        return (Result.NA);
    }

    /**
     * @notice Used to create checkpoints that correctly reflect balances
     * @return always returns Result.NA
     */
    function verifyTransfer(
        address, /* _from */
        address, /* _to */
        uint256, /* _amount */
        bytes memory /* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        return (Result.NA, bytes32(0));
    }

    /**
     * @notice gets schedule details
     * @param  name name of the schedule.
     * @return name Name of the schedule
     * @return startTime Unix timestamps at which schedule of creating the checkpoint will start
     * @return endTime Unix timestamps at which schedule of creation the checkpoint will stop
     * @return createNextCheckpointAt Unix timestamp at which next checkpoint will be created
     * @return frequency Frequency at which checkpoint has been created
     * @return frequencyUnit Unit of frequency
     * @return checkpointIds List of checkpoint Ids that been created in the schedule
     * @return timestamps List of unix timestamp at which checkpoints have been created
     * @return periods List of periods covered
     * @return totalPeriods Total periods covered 
     */
    function getSchedule(bytes32 _name) external view returns(
        bytes32 name,
        uint256 startTime,
        uint256 endTime,
        uint256 createNextCheckpointAt,
        uint256 frequency,
        FrequencyUnit frequencyUnit,
        uint256[] memory checkpointIds,
        uint256[] memory timestamps,
        uint256[] memory periods,
        uint256 totalPeriods
    ){
        Schedule storage schedule = schedules[_name];
        return (
            schedule.name,
            schedule.startTime,
            schedule.endTime,
            schedule.createNextCheckpointAt,
            schedule.frequency,
            schedule.frequencyUnit,
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
    function update(bytes32 _name) withPerm(OPERATOR) external {
        _update(_name);
    }

    function _update(bytes32 _name) internal {
        Schedule storage schedule = schedules[_name];
        if (_isScheduleActive(schedule.createNextCheckpointAt, schedule.endTime)) {
            uint256 newCheckpointId = securityToken.createCheckpoint();
            schedule.checkpointIds.push(newCheckpointId);
            // Checkpoint is already been create in the above two lines now `createNextCheckpointAt` treated as `lastCheckpointCreatedAt`
            uint256 lastCheckpointCreatedAt = schedule.createNextCheckpointAt;
            schedule.timestamps.push(lastCheckpointCreatedAt);
            uint256 periods;
            if (schedule.frequencyUnit == FrequencyUnit.SECONDS ) {
                periods = now
                    .sub(lastCheckpointCreatedAt)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = periods.mul(schedule.frequency).add(lastCheckpointCreatedAt);
            } else if (schedule.frequencyUnit == FrequencyUnit.DAYS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffDays(lastCheckpointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = BokkyPooBahsDateTimeLibrary.addDays(
                    lastCheckpointCreatedAt, periods.mul(schedule.frequency)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.WEEKS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffDays(lastCheckpointCreatedAt, now)
                    .div(7)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = BokkyPooBahsDateTimeLibrary.addDays(
                    lastCheckpointCreatedAt, periods.mul(schedule.frequency).mul(7)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.MONTHS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffMonths(lastCheckpointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = BokkyPooBahsDateTimeLibrary.addMonths(
                    lastCheckpointCreatedAt, periods.mul(schedule.frequency)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.QUATER ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffMonths(lastCheckpointCreatedAt, now)
                    .div(3)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = BokkyPooBahsDateTimeLibrary.addMonths(
                    lastCheckpointCreatedAt, periods.mul(schedule.frequency).mul(3)
                ); 
            } else if (schedule.frequencyUnit == FrequencyUnit.YEARS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffYears(lastCheckpointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.createNextCheckpointAt = BokkyPooBahsDateTimeLibrary.addYears(
                    lastCheckpointCreatedAt, periods.mul(schedule.frequency)
                );
            }
            schedule.totalPeriods = schedule.totalPeriods.add(periods);
            schedule.periods.push(periods);
        }
    }

    function _isScheduleActive(uint256 _createNextCheckpointAt, uint256 _endTime) internal view returns(bool isActive) {
        isActive = _endTime > 0 ? _createNextCheckpointAt <= now && _createNextCheckpointAt <= _endTime : _createNextCheckpointAt <= now;
    }

    function _validateMaximumLimitCount() internal view {
        require(names.length < MAXLIMIT, "Max Limit Reached");
    }

    /**
     * @notice manually triggers update outside of transfer request for all schedules (can be used to reduce user gas costs)
     */
    function updateAll() withPerm(OPERATOR) external {
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
    function getPermissions() external view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = OPERATOR;
        return allPermissions;
    }
}
