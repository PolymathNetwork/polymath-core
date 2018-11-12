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

    mapping (address => VestingData) internal schedules;
    address[] users;

    event AddVestingSchedule(
        address _user,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate,
        uint256 _timestamp
    );
    event RevokeVestingSchedules(address _user, uint256 _timestamp);
    event RevokeVestingSchedule(address _user, uint256 index, uint256 _timestamp);

    constructor(address _tokenAddress, address _treasury) {
        token = IERC20(_tokenAddress);
        treasury = _treasury;
    }

    function addVestingSchedule(
        address _user,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        public
        onlyOwner
    {
        //TODO validation
        VestingSchedule schedule;
        schedule.numberOfTokens = _numberOfTokens;
        schedule.vestingDuration = _vestingDuration;
        schedule.vestingFrequency = _vestingFrequency;
        schedule.startDate = _startDate;
        //add user to the schedule list only if adding first schedule
        if (schedules[_user].schedules.length == 0) {
            schedules[_user].index = users.length;
            users.push(_user);
        }
        schedules[_user].schedules.push(schedule);
        /*solium-disable-next-line security/no-block-members*/
        emit AddVestingSchedule(_user, _numberOfTokens, _vestingDuration, _vestingFrequency, _startDate, now);
    }

    function revokeVestingSchedule(address _user, uint256 index) public onlyOwner {
        //TODO validation

        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedule(_user, index, now);
    }

    function revokeVestingSchedules(address _user) public onlyOwner {
        //TODO validation
        uint256 index = schedules[_user].index;
        users[index] = users[users.length - 1];
        users.length--;
        if (index != users.length) {
            schedules[users[index]].index = index;
        }
        delete schedules[_user];
        /*solium-disable-next-line security/no-block-members*/
        emit RevokeVestingSchedules(_user, now);
    }

    function editVestingSchedule(
        address _user,
        uint256 index,
        uint256 _numberOfTokens,
        uint256 _vestingDuration,
        uint256 _vestingFrequency,
        uint256 _startDate
    )
        public
        onlyOwner
    {

    }

}
