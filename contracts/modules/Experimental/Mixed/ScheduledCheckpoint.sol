pragma solidity 0.5.8;

import "./../../Checkpoint/ICheckpoint.sol";
import "../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract ScheduledCheckpoint is ICheckpoint, TransferManager {
    using SafeMath for uint256;

    bytes32 constant OPERATOR = "OPERATOR";

    enum FrequencyUnit { SECONDS, DAYS, WEEKS, MONTHS, QUATER, YEARS}

    struct Schedule {
        uint256 index;
        bytes32 name;
        uint256 startTime;
        uint256 endTime;
        uint256 nextCheckPointCreatedAt;
        uint256 frequency;
        FrequencyUnit frequencyUnit;
        uint256[] checkpointIds;
        uint256[] timestamps;
        uint256[] periods;
        uint256 totalPeriods;
    }

    bytes32[] public names;

    mapping(bytes32 => Schedule) public schedules;

    event AddSchedule(bytes32 _name, uint256 _startTime, uint256 _frequency, FrequencyUnit _frequencyUnit);
    event RemoveSchedule(bytes32 _name);

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
     * @param _frequency How frequent checkpoint will being created
     * @param _frequencyUnit Unit of frequency i.e If issuer puts _frequency = 10
     * & frequency unit is DAYS then it means every 10 day frequency new checkpoint will be created
     */
    function addSchedule(bytes32 _name, uint256 _startTime, uint256 _frequency, FrequencyUnit _frequencyUnit) withPerm(OPERATOR) external {
        require(_name != bytes32(0), "Empty name");
        require(_startTime >= now, "Start time must be in the future");
        require(schedules[_name].name == bytes32(0), "Name already in use");
        schedules[_name].name = _name;
        schedules[_name].startTime = _startTime;
        schedules[_name].nextCheckPointCreatedAt = _startTime;
        schedules[_name].frequency = _frequency;
        schedules[_name].frequencyUnit = _frequencyUnit;
        schedules[_name].index = names.length;
        names.push(_name);
        emit AddSchedule(_name, _startTime, _frequency, _frequencyUnit);
    }

    /**
     * @notice removes a schedule for checkpoints
     * @param _name name of the schedule to be removed
     */
    function removeSchedule(bytes32 _name) withPerm(OPERATOR) external {
        require(_name != bytes32(0), "Empty name");
        require(schedules[_name].name == _name, "Name does not exist");
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
     * @return nextCheckPointCreatedAt Unix timestamp at which next checkpoint will be created
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
        uint256 nextCheckPointCreatedAt,
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
            schedule.nextCheckPointCreatedAt,
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
    function update(bytes32 _name) external {
        _onlySecurityTokenOwner();
        _update(_name);
    }

    function _update(bytes32 _name) internal {
        Schedule storage schedule = schedules[_name];
        if (schedule.nextCheckPointCreatedAt <= now) {
            uint256 newCheckpointId = securityToken.createCheckpoint();
            schedule.checkpointIds.push(newCheckpointId);
            schedule.timestamps.push(schedule.nextCheckPointCreatedAt);
            uint256 periods;
            if (schedule.frequencyUnit == FrequencyUnit.SECONDS ) {
                periods = now
                    .sub(schedule.nextCheckPointCreatedAt)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = periods.mul(schedule.frequency).add(schedule.nextCheckPointCreatedAt);
            } else if (schedule.frequencyUnit == FrequencyUnit.DAYS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffDays(schedule.nextCheckPointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = BokkyPooBahsDateTimeLibrary.addDays(
                    schedule.nextCheckPointCreatedAt, periods.mul(schedule.frequency)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.WEEKS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffDays(schedule.nextCheckPointCreatedAt, now)
                    .div(7)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = BokkyPooBahsDateTimeLibrary.addDays(
                    schedule.nextCheckPointCreatedAt, periods.mul(schedule.frequency).mul(7)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.MONTHS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffMonths(schedule.nextCheckPointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = BokkyPooBahsDateTimeLibrary.addMonths(
                    schedule.startTime, periods.mul(schedule.frequency)
                );
            } else if (schedule.frequencyUnit == FrequencyUnit.QUATER ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffMonths(schedule.nextCheckPointCreatedAt, now)
                    .div(3)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = BokkyPooBahsDateTimeLibrary.addMonths(
                    schedule.startTime, periods.mul(schedule.frequency).mul(3)
                ); 
            } else if (schedule.frequencyUnit == FrequencyUnit.YEARS ) {
                periods = BokkyPooBahsDateTimeLibrary
                    .diffYears(schedule.nextCheckPointCreatedAt, now)
                    .div(schedule.frequency)
                    .add(1); // 1 is added for the next period
                schedule.nextCheckPointCreatedAt = BokkyPooBahsDateTimeLibrary.addYears(
                    schedule.nextCheckPointCreatedAt, periods.mul(schedule.frequency)
                );
            }
            schedule.totalPeriods = schedule.totalPeriods.add(periods);
            schedule.periods.push(periods);
        }
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
