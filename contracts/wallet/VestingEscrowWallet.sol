pragma solidity ^0.4.24;

import "../../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../interfaces/IERC20.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWallet is Ownable {
    using SafeMath for uint256;

    struct VestingSchedule {
        uint256 numberOfTokens;
        uint256 vestingDuration;
        uint256 vestingFrequency;
        uint256 startDate;
    }

    struct VestingData {
        VestingSchedule[] schedules;
        uint256 index;
    }

    IERC20 public token;
    address public treasury;

    uint256 public unassignedTokens;

    mapping (address => VestingData) public schedules;
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
        //TODO validation

        VestingSchedule memory schedule;
        schedule.numberOfTokens = _numberOfTokens;
        schedule.vestingDuration = _vestingDuration;
        schedule.vestingFrequency = _vestingFrequency;
        schedule.startDate = _startDate;
        //add beneficiary to the schedule list only if adding first schedule
        if (schedules[_beneficiary].schedules.length == 0) {
            schedules[_beneficiary].index = beneficiaries.length;
            beneficiaries.push(_beneficiary);
        }
        schedules[_beneficiary].schedules.push(schedule);
        /*solium-disable-next-line security/no-block-members*/
        emit AddVestingSchedule(_beneficiary, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate, now);
    }

    function revokeVestingSchedule(address _beneficiary, uint256 index) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(index < schedules[_beneficiary].schedules.length, "Schedule not found");
        VestingSchedule[] storage vestingSchedule = schedules[_beneficiary].schedules;
        vestingSchedule[index] = vestingSchedule[vestingSchedule.length - 1];
        vestingSchedule.length--;
        if (vestingSchedule.length == 0) {
            _revokeVestingSchedules(_beneficiary);
        }
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedule(_beneficiary, index, now);
    }

    function revokeVestingSchedules(address _beneficiary) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        _revokeVestingSchedules(_beneficiary);
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedules(_beneficiary, now);
    }

    function getVestingSchedule(address _beneficiary, uint256 index) external onlyOwner returns(uint256, uint256, uint256, uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(index < schedules[_beneficiary].schedules.length, "Schedule not found");
        return (
            schedules[_beneficiary].schedules[index].numberOfTokens,
            schedules[_beneficiary].schedules[index].vestingDuration,
            schedules[_beneficiary].schedules[index].vestingFrequency,
            schedules[_beneficiary].schedules[index].startDate
        );
    }

    function getVestingScheduleCount(address _beneficiary, uint256 index) external onlyOwner returns(uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        return schedules[_beneficiary].schedules.length;
    }

    function editVestingSchedule(
        address _beneficiary,
        uint256 index,
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



    function _revokeVestingSchedules(address _beneficiary) private {
        uint256 index = schedules[_beneficiary].index;
        beneficiaries[index] = beneficiaries[beneficiaries.length - 1];
        beneficiaries.length--;
        if (index != beneficiaries.length) {
            schedules[beneficiaries[index]].index = index;
        }
        delete schedules[_beneficiary];
    }

}
