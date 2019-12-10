pragma solidity 0.5.8;

contract ScheduleCheckpointStorage {

    enum FrequencyUnit { SECONDS, DAYS, WEEKS, MONTHS, QUATER, YEARS }

    bytes32 constant OPERATOR = "OPERATOR";
    uint256 internal constant MAXLIMIT = uint256(10);

    struct Schedule {
        uint256 index;
        bytes32 name;
        uint256 startTime;
        uint256 endTime;
        uint256 createNextCheckpointAt;
        uint256 frequency;
        FrequencyUnit frequencyUnit;
        uint256[] checkpointIds;
        uint256[] timestamps;
        uint256[] periods;
        uint256 totalPeriods;
    }

    bytes32[] public names;

    mapping(bytes32 => Schedule) public schedules;

}