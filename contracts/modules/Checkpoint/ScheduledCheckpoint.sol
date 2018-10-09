pragma solidity ^0.4.24;

import "./ICheckpoint.sol";
import "../TransferManager/ITransferManager.sol";
import "../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
/* import "../../libraries/BokkyPooBahsDateTimeLibrary.sol"; */

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract ScheduledCheckpoint is ICheckpoint, ITransferManager {
    using SafeMath for uint256;

    struct Schedule {
        bytes32 name;
        uint256 startTime;
        uint256 nextTime;
        uint256 interval;
        uint256 index;
        uint256[] checkpointIds;
        uint256[] timestamps;
        uint256[] periods;
    }

    bytes32[] public names;

    mapping (bytes32 => Schedule) schedules;

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

    function addSchedule(bytes32 _name, uint256 _startTime, uint256 _interval) onlyOwner external {
        require(_startTime > now);
        require(schedules[_name].name == bytes32(0));
        schedules[_name].name = _name;
        schedules[_name].startTime = _startTime;
        schedules[_name].nextTime = _startTime;
        schedules[_name].interval = _interval;
        schedules[_name].index = names.length;
        names.push(_name);
    }

    function removeSchedule(bytes32 _name) onlyOwner external {
        require(schedules[_name].name == _name);
        uint256 index = schedules[_name].index;
        names[index] = names[names.length - 1];
        names.length--;
        if (index != names.length) {
            schedules[names[index]].index = index;
        }
        delete schedules[_name];
    }


    /// @notice Used to verify the transfer transaction according to the rule implemented in the trnasfer managers
    function verifyTransfer(address /* _from */, address /* _to */, uint256 /* _amount */, bytes /* _data */, bool _isTransfer) public returns(Result) {
        if (paused || !_isTransfer) {
            return Result.NA;
        }
        uint256 i;
        for (i = 0; i < names.length; i++) {
            Schedule storage schedule = schedules[names[i]];
            if (schedule.nextTime <= now) {
                uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
                uint256 periods = now.sub(schedule.nextTime).div(schedule.interval).add(1);
                schedule.timestamps.push(schedule.nextTime);
                schedule.nextTime = periods.mul(schedule.interval).add(schedule.nextTime);
                schedule.checkpointIds.push(checkpointId);
                schedule.periods.push(periods);
            }
        }
        return Result.NA;
    }

    function getSchedule(bytes32 _name) view public returns(bytes32, uint256, uint256, uint256, uint256[], uint256[], uint256[]){
        return (
            schedules[_name].name,
            schedules[_name].startTime,
            schedules[_name].nextTime,
            schedules[_name].interval,
            schedules[_name].checkpointIds,
            schedules[_name].timestamps,
            schedules[_name].periods
        );
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() external view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
