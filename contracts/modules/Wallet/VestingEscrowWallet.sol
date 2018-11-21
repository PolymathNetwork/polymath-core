pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "./IWallet.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWallet is IWallet {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    bytes32 public constant ADMIN = "ADMIN";

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
        address indexed _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    );
    event EditSchedule(
        address indexed _beneficiary,
        uint256 _index,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    );
    event RevokeSchedules(address indexed _beneficiary);
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
    function configure(address _treasury, address _token) public onlyFactory {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        token = ERC20(_token);
    }

    /**
     * @notice This function returns the signature of the configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(address,address)"));
    }

    /**
     * @notice Used to deposit tokens from treasury
     */
    function depositTokens(uint256 _numberOfTokens) external withPerm(ADMIN) {
        require(_numberOfTokens > 0, "Should be greater than zero");
        token.safeTransferFrom(treasury, this, _numberOfTokens);
        unassignedTokens = unassignedTokens.add(_numberOfTokens);
        emit DepositTokens(_numberOfTokens);
    }

    /**
     * @notice Sends unassigned tokens to treasury
     */
    function sendToTreasury() external withPerm(ADMIN) {
        uint256 amount = unassignedTokens;
        unassignedTokens = 0;
        token.safeTransfer(treasury, amount);
        emit SendToTreasury(amount);
    }

    /**
     * @notice Sends available tokens to beneficiary
     * @param _beneficiary beneficiary's address
     */
    function sendAvailableTokens(address _beneficiary) public withPerm(ADMIN) {
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
        Template memory template;
        template.numberOfTokens = _numberOfTokens;
        template.duration = _duration;
        template.frequency = _frequency;
        templates.push(template);
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
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        require(_numberOfTokens <= unassignedTokens, "Not enough tokens");

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
        emit AddSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
    }

    /**
     * @notice Adds vesting schedules from template for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _index index of the template
     * @param _startTime vesting start time
     */
    function addScheduleFromTemplate(address _beneficiary, uint256 _index, uint256 _startTime) public withPerm(ADMIN) {
        require(_index < templates.length, "Template not found");
        Template memory template = templates[_index];
        addSchedule(_beneficiary, template.numberOfTokens, template.duration, template.frequency, _startTime);
    }

    /**
     * @notice Edits vesting schedules for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _index index of schedule
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function editSchedule(
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
        _validateSchedule(_beneficiary, _numberOfTokens, _duration, _frequency, _startTime);
        require(_index < dataMap[_beneficiary].schedules.length, "Schedule not found");
        Schedule storage schedule = dataMap[_beneficiary].schedules[_index];
        /*solium-disable-next-line security/no-block-members*/
        require(now < schedule.startTime, "Schedule started");
        if (_numberOfTokens <= schedule.lockedTokens) {
            unassignedTokens = unassignedTokens.add(schedule.lockedTokens - _numberOfTokens);
        } else {
            require((_numberOfTokens - schedule.lockedTokens) <= unassignedTokens, "Not enough tokens");
            unassignedTokens = unassignedTokens.sub(_numberOfTokens - schedule.lockedTokens);
        }
        schedule.numberOfTokens = _numberOfTokens;
        schedule.lockedTokens = _numberOfTokens;
        schedule.duration = _duration;
        schedule.frequency = _frequency;
        schedule.startTime = _startTime;
        schedule.nextTime = _startTime.add(schedule.frequency);
        emit EditSchedule(_beneficiary, _index, _numberOfTokens, _duration, _frequency, _startTime);
    }

    /**
     * @notice Revokes beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _index index of the schedule
     */
    function revokeSchedule(address _beneficiary, uint256 _index) external withPerm(ADMIN) {
        require(_beneficiary != address(0), "Invalid address");
        require(_index < dataMap[_beneficiary].schedules.length, "Schedule not found");
        Schedule[] storage schedules = dataMap[_beneficiary].schedules;
        unassignedTokens = unassignedTokens.add(schedules[_index].lockedTokens);
        schedules[_index] = schedules[schedules.length - 1];
        schedules.length--;
        if (schedules.length == 0) {
            _revokeSchedules(_beneficiary);
        }
        emit RevokeSchedule(_beneficiary, _index);
    }


    /**
     * @notice Revokes all beneficiary's schedules
     * @param _beneficiary beneficiary's address
     */
    function revokeSchedules(address _beneficiary) public withPerm(ADMIN) {
        require(_beneficiary != address(0), "Invalid address");
        Data storage data = dataMap[_beneficiary];
        for (uint256 i = 0; i < data.schedules.length; i++) {
            unassignedTokens = unassignedTokens.add(data.schedules[i].lockedTokens);
        }
        delete dataMap[_beneficiary].schedules;
        _revokeSchedules(_beneficiary);
        emit RevokeSchedules(_beneficiary);
    }

    /**
     * @notice Returns beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _index index of the schedule
     * @return beneficiary's schedule
     */
    function getSchedule(address _beneficiary, uint256 _index) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, State) {
        require(_beneficiary != address(0), "Invalid address");
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

    /**
     * @notice Returns count of beneficiary's schedules
     * @param _beneficiary beneficiary's address
     * @return count of beneficiary's schedules
     */
    function getScheduleCount(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0), "Invalid address");
        return dataMap[_beneficiary].schedules.length;
    }

    /**
     * @notice Returns available tokens for beneficiary
     * @param _beneficiary beneficiary's address
     * @return available tokens for beneficiary
     */
    function getAvailableTokens(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0));
        return dataMap[_beneficiary].availableTokens;
    }

    /**
     * @notice Used to bulk send available tokens for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     */
    function batchSendAvailableTokens(address[] _beneficiaries) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            sendAvailableTokens(_beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function batchAddSchedule(
        address[] _beneficiaries,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        external
        withPerm(ADMIN)
    {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addSchedule(_beneficiaries[i], _numberOfTokens, _duration, _frequency, _startTime);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules from template for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _index index of the template
     * @param _startTime vesting start time
     */
    function batchAddScheduleFromTemplate(address[] _beneficiaries, uint256 _index, uint256 _startTime) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            addScheduleFromTemplate(_beneficiaries[i], _index, _startTime);
        }
    }

    /**
     * @notice Used to bulk revoke vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     */
    function batchRevokeSchedules(address[] _beneficiaries) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            revokeSchedules(_beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk edit vesting schedules for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _indexes array of beneficiary's indexes of schedule
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function batchEditSchedule(
        address[] _beneficiaries,
        uint256[] _indexes,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        external
        withPerm(ADMIN)
    {
        require(_beneficiaries.length == _indexes.length, "Arrays sizes mismatch");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            editSchedule(_beneficiaries[i], _indexes[i], _numberOfTokens, _duration, _frequency, _startTime);
        }
    }

    function _validateSchedule(
        address _beneficiary,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        private
        view
    {
        require(_beneficiary != address(0), "Invalid address");
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        require(now < _startTime, "Date in the past");
    }

    function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) private pure {
        require(_numberOfTokens > 0, "Zero amount");
        require(_duration % _frequency == 0, "Duration and frequency mismatch");
        uint256 periodCount = _duration.div(_frequency);
        require(_numberOfTokens % periodCount == 0, "Tokens and periods mismatch");
    }

    function _sendTokens(address _beneficiary) private {
        Data storage data = dataMap[_beneficiary];
        uint256 amount = data.availableTokens;
        require(amount > 0, "No available tokens");
        data.availableTokens = 0;
        data.claimedTokens = data.claimedTokens.add(amount);
        token.safeTransfer(_beneficiary, amount);
        emit SendTokens(_beneficiary, amount);
    }

    /**
     * @notice manually triggers update outside for beneficiary's schedule (can be used to reduce user gas costs)
     * @param _beneficiary beneficiary's address of the schedule
     */
    function update(address _beneficiary) external withPerm(ADMIN) {
        _update(_beneficiary);
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

    /**
     * @notice manually triggers update outside for all schedules (can be used to reduce user gas costs)
     */
    function updateAll() external withPerm(ADMIN) {
        _updateAll();
    }

    function _updateAll() private {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            _update(beneficiaries[i]);
        }
    }

    function _revokeSchedules(address _beneficiary) private {
        //can be removed
        if (dataMap[_beneficiary].availableTokens == 0) {
            uint256 index = dataMap[_beneficiary].index;
            beneficiaries[index] = beneficiaries[beneficiaries.length - 1];
            beneficiaries.length--;
            if (index != beneficiaries.length) {
                dataMap[beneficiaries[index]].index = index;
            }
            delete dataMap[_beneficiary];
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
