pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./IWallet.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWallet is IWallet {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";

    struct Schedule {
        uint256 numberOfTokens;
        uint256 claimedTokens;
        uint256 duration;
        uint256 frequency;
        uint256 startTime;
    }

    struct Template {
        uint256 numberOfTokens;
        uint256 duration;
        uint256 frequency;
    }

    enum State {CREATED, STARTED, COMPLETED}

    address public treasury;
    uint256 public unassignedTokens;

    mapping (address => Schedule[]) public schedules;
    address[] public beneficiaries;

    Template[] public templates;

    event AddSchedule(
        address indexed _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime,
        uint256 _index
    );
    event ModifySchedule(
        address indexed _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    );
    event RevokeAllSchedules(address indexed _beneficiary);
    event RevokeSchedule(address indexed _beneficiary, uint256 _index);
    event DepositTokens(uint256 _numberOfTokens);
    event SendToTreasury(uint256 _numberOfTokens);
    event SendTokens(address indexed _beneficiary, uint256 _numberOfTokens);
    event AddTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _index);
    event RemoveTemplate(uint256 _index);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice Function used to initialize the different variables
     * @param _treasury Address of the treasury
     */
    function configure(address _treasury) public onlyFactory {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    /**
     * @notice This function returns the signature of the configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(address)"));
    }

    /**
     * @notice Used to deposit tokens from treasury
     */
    function depositTokens(uint256 _numberOfTokens) external withPerm(ADMIN) {
        _depositTokens(_numberOfTokens);
    }

    function _depositTokens(uint256 _numberOfTokens) internal {
        require(_numberOfTokens > 0, "Should be greater than zero");
        ISecurityToken(securityToken).transferFrom(treasury, this, _numberOfTokens);
        unassignedTokens = unassignedTokens.add(_numberOfTokens);
        emit DepositTokens(_numberOfTokens);
    }

    /**
     * @notice Sends unassigned tokens to treasury
     */
    function sendToTreasury() external withPerm(ADMIN) {
        uint256 amount = unassignedTokens;
        unassignedTokens = 0;
        ISecurityToken(securityToken).transfer(treasury, amount);
        emit SendToTreasury(amount);
    }

    /**
     * @notice Pushes available tokens to beneficiary
     * @param _beneficiary beneficiary's address
     */
    function pushAvailableTokens(address _beneficiary) public withPerm(ADMIN) {
        _sendTokens(_beneficiary);
    }

    /**
     * @notice Used to withdraw available tokens by beneficiary
     */
    function withdrawAvailableTokens() external {
        _sendTokens(msg.sender);
    }

    /**
     * @notice Add template
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     */
    function addTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external withPerm(ADMIN) {
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        templates.push(Template(_numberOfTokens, _duration, _frequency));
        emit AddTemplate(_numberOfTokens, _duration, _frequency, templates.length - 1);
    }

    /**
     * @notice Removes template
     * @param _index index of the template
     */
    function removeTemplate(uint256 _index) external withPerm(ADMIN) {
        require(_index < templates.length, "Template not found");
        if (_index != templates.length - 1) {
            templates[_index] = templates[templates.length - 1];
        }
        templates.length--;
        emit RemoveTemplate(_index);
    }

    /**
     * @notice Returns count of templates
     * @return count of templates
     */
    function getTemplateCount() external view returns(uint256) {
        return templates.length;
    }

    /**
     * @notice Adds vesting schedules for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function addSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        public
        withPerm(ADMIN)
    {
        _addSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
    }

    function _addSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        internal
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        if (_numberOfTokens > unassignedTokens) {
            _depositTokens(_numberOfTokens.sub(unassignedTokens));
        }
        unassignedTokens = unassignedTokens.sub(_numberOfTokens);
        //add beneficiary to the schedule list only if adding first schedule
        if (schedules[_beneficiary].length == 0) {
            beneficiaries.push(_beneficiary);
        }
        schedules[_beneficiary].push(Schedule(_numberOfTokens, 0, _duration, _frequency, _startTime));
        uint256 index = schedules[_beneficiary].length - 1;
        emit AddSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime, index);
    }

    /**
     * @notice Adds vesting schedules from template for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _index index of the template
     * @param _startTime vesting start time
     */
    function addScheduleFromTemplate(address _beneficiary, uint256 _index, uint256 _startTime) external withPerm(ADMIN) {
        _addScheduleFromTemplate(_beneficiary, _index, _startTime);
    }

    function _addScheduleFromTemplate(address _beneficiary, uint256 _index, uint256 _startTime) internal {
        require(_index < templates.length, "Template not found");
        Template memory template = templates[_index];
        _addSchedule(_beneficiary, template.numberOfTokens, template.duration, template.frequency, _startTime);
    }

    /**
     * @notice Modifies vesting schedules for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _index index of schedule
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function modifySchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        public
        withPerm(ADMIN)
    {
        _modifySchedule(_beneficiary, _index, _numberOfTokens, _duration, _frequency, _startTime);
    }

    function _modifySchedule(
        address _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        internal
    {
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        _checkSchedule(_beneficiary, _index);
        Schedule storage schedule = schedules[_beneficiary][_index];
        /*solium-disable-next-line security/no-block-members*/
        require(now < schedule.startTime, "Schedule started");
        if (_numberOfTokens <= schedule.numberOfTokens) {
            unassignedTokens = unassignedTokens.add(schedule.numberOfTokens.sub(_numberOfTokens));
        } else {
            if (_numberOfTokens.sub(schedule.numberOfTokens) > unassignedTokens) {
                _depositTokens(_numberOfTokens.sub(schedule.numberOfTokens).sub(unassignedTokens));
            }
            unassignedTokens = unassignedTokens.sub(_numberOfTokens.sub(schedule.numberOfTokens));
        }
        schedules[_beneficiary][_index] = Schedule(_numberOfTokens, 0, _duration, _frequency, _startTime);
        emit ModifySchedule(_beneficiary, _index, _numberOfTokens, _duration, _frequency, _startTime);
    }

    /**
     * @notice Revokes beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _index index of the schedule
     */
    function revokeSchedule(address _beneficiary, uint256 _index) external withPerm(ADMIN) {
        _checkSchedule(_beneficiary, _index);
        _sendTokens(_beneficiary, _index);
        Schedule[] storage userSchedules = schedules[_beneficiary];
        uint256 releasedTokens = _getReleasedTokens(_beneficiary, _index);
        unassignedTokens = unassignedTokens.add(userSchedules[_index].numberOfTokens.sub(releasedTokens));
        if (_index != userSchedules.length - 1) {
            userSchedules[_index] = userSchedules[userSchedules.length - 1];
        }
        userSchedules.length--;
        emit RevokeSchedule(_beneficiary, _index);
    }

    /**
     * @notice Revokes all beneficiary's schedules
     * @param _beneficiary beneficiary's address
     */
    function revokeAllSchedules(address _beneficiary) public withPerm(ADMIN) {
        _revokeAllSchedules(_beneficiary);
    }

    function _revokeAllSchedules(address _beneficiary) internal {
        require(_beneficiary != address(0), "Invalid address");
        _sendTokens(_beneficiary);
        Schedule[] storage userSchedules = schedules[_beneficiary];
        for (uint256 i = 0; i < userSchedules.length; i++) {
            uint256 releasedTokens = _getReleasedTokens(_beneficiary, i);
            unassignedTokens = unassignedTokens.add(userSchedules[i].numberOfTokens.sub(releasedTokens));
        }
        userSchedules.length = 0;
        emit RevokeAllSchedules(_beneficiary);
    }

    /**
     * @notice Returns beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _index index of the schedule
     * @return beneficiary's schedule
     */
    function getSchedule(address _beneficiary, uint256 _index) external view returns(uint256, uint256, uint256, uint256, State) {
        _checkSchedule(_beneficiary, _index);
        Schedule storage schedule = schedules[_beneficiary][_index];
        return (
            schedule.numberOfTokens,
            schedule.duration,
            schedule.frequency,
            schedule.startTime,
            getScheduleState(_beneficiary, _index)
        );
    }

    function getScheduleState(address _beneficiary, uint256 _index) public view returns(State) {
        Schedule memory schedule = schedules[_beneficiary][_index];
        if (now < schedule.startTime) {
            return State.CREATED;
        } else if (now > schedule.startTime && now < schedule.startTime.add(schedule.duration)) {
            return State.STARTED;
        } else {
            return State.COMPLETED;
        }
    }

    /**
     * @notice Returns count of beneficiary's schedules
     * @param _beneficiary beneficiary's address
     * @return count of beneficiary's schedules
     */
    function getScheduleCount(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0), "Invalid address");
        return schedules[_beneficiary].length;
    }

    function _getAvailableTokens(address _beneficiary, uint256 _index) internal view returns(uint256) {
        Schedule storage schedule = schedules[_beneficiary][_index];
        uint256 releasedTokens = _getReleasedTokens(_beneficiary, _index);
        return releasedTokens.sub(schedule.claimedTokens);
    }

    function _getReleasedTokens(address _beneficiary, uint256 _index) internal view returns(uint256) {
        Schedule storage schedule = schedules[_beneficiary][_index];
        /*solium-disable-next-line security/no-block-members*/
        if (now > schedule.startTime) {
            uint256 periodCount = schedule.duration.div(schedule.frequency);
            /*solium-disable-next-line security/no-block-members*/
            uint256 periodNumber = (now.sub(schedule.startTime)).div(schedule.frequency);
            if (periodNumber > periodCount) {
                periodNumber = periodCount;
            }
            return schedule.numberOfTokens.mul(periodNumber).div(periodCount);
        } else {
            return 0;
        }
    }

    /**
     * @notice Used to remove beneficiaries without schedules
     */
    function trimBeneficiaries() external withPerm(ADMIN) {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (schedules[beneficiaries[i]].length == 0) {
                delete schedules[beneficiaries[i]];
                if (i != beneficiaries.length - 1) {
                    beneficiaries[i] = beneficiaries[beneficiaries.length - 1];
                }
                beneficiaries.length--;
            }
        }
    }

    /**
     * @notice Used to bulk send available tokens for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     */
    function pushAvailableTokensMulti(address[] _beneficiaries) external withPerm(ADMIN) {
        require(_beneficiaries.length > 1, "Array size should be greater than one");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            pushAvailableTokens(_beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _numberOfTokens array of number of tokens
     * @param _durations array of vesting duration
     * @param _frequencies array of vesting frequency
     * @param _startTimes array of vesting start time
     */
    function addScheduleMulti(
        address[] _beneficiaries,
        uint256[] _numberOfTokens,
        uint256[] _durations,
        uint256[] _frequencies,
        uint256[] _startTimes
    )
        external
        withPerm(ADMIN)
    {
        require(
            _beneficiaries.length == _numberOfTokens.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _durations.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _frequencies.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _startTimes.length,
            "Arrays sizes mismatch"
        );
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _addSchedule(_beneficiaries[i], _numberOfTokens[i], _durations[i], _frequencies[i], _startTimes[i]);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules from template for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _index index of the template
     * @param _startTimes array of vesting start time
     */
    function addScheduleFromTemplateMulti(address[] _beneficiaries, uint256 _index, uint256[] _startTimes) external withPerm(ADMIN) {
        require(_beneficiaries.length == _startTimes.length, "Arrays sizes mismatch");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _addScheduleFromTemplate(_beneficiaries[i], _index, _startTimes[i]);
        }
    }

    /**
     * @notice Used to bulk revoke vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     */
    function revokeSchedulesMulti(address[] _beneficiaries) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _revokeAllSchedules(_beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk modify vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _indexes array of beneficiary's indexes of schedule
     * @param _numberOfTokens array of number of tokens
     * @param _durations array of vesting duration
     * @param _frequencies array of vesting frequency
     * @param _startTimes array of vesting start time
     */
    function modifyScheduleMulti(
        address[] _beneficiaries,
        uint256[] _indexes,
        uint256[] _numberOfTokens,
        uint256[] _durations,
        uint256[] _frequencies,
        uint256[] _startTimes
    )
        public
        withPerm(ADMIN)
    {
        require(
            _beneficiaries.length == _indexes.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _numberOfTokens.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _durations.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _frequencies.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _startTimes.length,
            "Arrays sizes mismatch"
        );
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _modifySchedule(_beneficiaries[i], _indexes[i], _numberOfTokens[i], _durations[i], _frequencies[i], _startTimes[i]);
        }
    }

    function _validateSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        internal
        view
    {
        require(_beneficiary != address(0), "Invalid address");
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        require(now < _startTime, "Date in the past");
    }

    function _checkSchedule(address _beneficiary, uint256 _index) internal view {
        require(_beneficiary != address(0), "Invalid address");
        require(_index < schedules[_beneficiary].length, "Schedule not found");
    }

    function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal pure {
        require(_numberOfTokens > 0, "Zero amount");
        require(_duration % _frequency == 0, "Duration and frequency mismatch");
        uint256 periodCount = _duration.div(_frequency);
        require(_numberOfTokens % periodCount == 0, "Tokens and periods mismatch");
    }

    function _sendTokens(address _beneficiary) internal {
        for (uint256 i = 0; i < schedules[_beneficiary].length; i++) {
            _sendTokens(_beneficiary, i);
        }
    }

    function _sendTokens(address _beneficiary, uint256 _index) internal {
        uint256 amount = _getAvailableTokens(_beneficiary, _index);
        if (amount > 0) {
            schedules[_beneficiary][_index].claimedTokens = schedules[_beneficiary][_index].claimedTokens.add(amount);
            ISecurityToken(securityToken).transfer(_beneficiary, amount);
            emit SendTokens(_beneficiary, amount);
        }
    }

    /**
     * @notice Return the permissions flag that are associated with VestingEscrowWallet
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
