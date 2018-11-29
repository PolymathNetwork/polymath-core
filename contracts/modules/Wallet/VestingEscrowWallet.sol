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
        //name of the template
        bytes32 templateName;
        //tokens that were already claimed
        uint256 claimedTokens;
        //start time of the schedule
        uint256 startTime;
    }

    struct Template {
        //total amount of tokens
        uint256 numberOfTokens;
        //schedule duration
        uint256 duration;
        //schedule frequency
        uint256 frequency;
    }

    enum State {CREATED, STARTED, COMPLETED}

    uint256 public unassignedTokens;

    address[] public beneficiaries;

    //holds schedules for user
    mapping(address => Schedule[]) public schedules;
    //holds template names for user
    mapping(address => bytes32[]) internal userToTemplates;
    //mapping use to store the indexes for different template names for a user
    mapping(address => mapping(bytes32 => uint256)) internal templateToScheduleIndex;

    //holds user for template
    mapping(bytes32 => address[]) internal templateToUsers;
    //mapping use to store the indexes for users for a template
    mapping(bytes32 => mapping(address => uint256)) internal templateToUserIndex;

    mapping(bytes32 => Template) templates;
    bytes32[] public templateNames;

    // Emit when new schedule is added
    event AddSchedule(
        address indexed _beneficiary,
        bytes32 _templateName,
        uint256 _startTime
    );
    // Emit when schedule is modified
    event ModifySchedule(
        address indexed _beneficiary,
        bytes32 _templateName,
        uint256 _startTime
    );
    // Emit when all schedules are revoked for user
    event RevokeAllSchedules(address indexed _beneficiary);
    // Emit when schedule is revoked
    event RevokeSchedule(address indexed _beneficiary, bytes32 _templateName);
    // Emit when tokes are deposited to wallet
    event DepositTokens(uint256 _numberOfTokens, address _sender);
    // Emit when all unassigned tokens are sent to treasury
    event SendToTreasury(uint256 _numberOfTokens, address _sender);
    // Emit when is sent tokes to user
    event SendTokens(address indexed _beneficiary, uint256 _numberOfTokens);
    // Emit when template is added
    event AddTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency);
    // Emit when template is removed
    event RemoveTemplate(bytes32 _name);

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
     * @notice This function returns the signature of the configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Used to deposit tokens from treasury
     */
    function depositTokens(uint256 _numberOfTokens) external withPerm(ADMIN) {
        _depositTokens(_numberOfTokens);
    }

    function _depositTokens(uint256 _numberOfTokens) internal {
        require(_numberOfTokens > 0, "Should be greater than zero");
        ISecurityToken(securityToken).transferFrom(msg.sender, this, _numberOfTokens);
        unassignedTokens = unassignedTokens.add(_numberOfTokens);
        emit DepositTokens(_numberOfTokens, msg.sender);
    }

    /**
     * @notice Sends unassigned tokens to treasury
     */
    function sendToTreasury() external withPerm(ADMIN) {
        uint256 amount = unassignedTokens;
        unassignedTokens = 0;
        ISecurityToken(securityToken).transfer(msg.sender, amount);
        emit SendToTreasury(amount, msg.sender);
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
     * @param _name name of template
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     */
    function addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external withPerm(ADMIN) {
        _addTemplate(_name, _numberOfTokens, _duration, _frequency);
    }

    function _addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal {
        require(!_isTemplateExists(_name));
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        templateNames.push(_name);
        templates[_name] = Template(_numberOfTokens, _duration, _frequency);
        emit AddTemplate(_name, _numberOfTokens, _duration, _frequency);
    }

    /**
     * @notice Removes template
     * @param _name name of template
     */
    function removeTemplate(bytes32 _name) external withPerm(ADMIN) {
        require(_isTemplateExists(_name));
        require(!_isTemplateUsed(_name));
        // delete template data
        delete templates[_name];
        uint256 i;
        for (i = 0; i < templateNames.length; i++) {
            if (_name == templateNames[i]) {
                break;
            }
        }
        if (i != templateNames.length - 1) {
            templateNames[i] = templateNames[templateNames.length - 1];
        }
        templateNames.length--;
        emit RemoveTemplate(_name);
    }

    /**
     * @notice Returns count of templates
     * @return count of templates
     */
    function getTemplateCount() external view returns(uint256) {
        return templateNames.length;
    }

    /**
     * @notice get the list of template names
     * @return bytes32 Array of template names
     */
    function getTemplateNames() external view returns(bytes32[]) {
        return templateNames;
    }

    /**
     * @notice Adds vesting schedules for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _templateName name of the template that will be created
     * @param _numberOfTokens number of tokens
     * @param _duration vesting duration
     * @param _frequency vesting frequency
     * @param _startTime vesting start time
     */
    function addSchedule(
        address _beneficiary,
        bytes32 _templateName,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        public
        withPerm(ADMIN)
    {
        _addSchedule(_beneficiary, _templateName, _numberOfTokens, _duration, _frequency, _startTime);
    }

    function _addSchedule(
        address _beneficiary,
        bytes32 _templateName,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        internal
    {
        _addTemplate(_templateName, _numberOfTokens, _duration, _frequency);
        _addScheduleFromTemplate(_beneficiary, _templateName, _startTime);
    }

    /**
     * @notice Adds vesting schedules from template for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _templateName name of the template
     * @param _startTime vesting start time
     */
    function addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) external withPerm(ADMIN) {
        _addScheduleFromTemplate(_beneficiary, _templateName, _startTime);
    }

    function _addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal {
        require(_beneficiary != address(0), "Invalid address");
        require(_isTemplateExists(_templateName));
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        require(
            schedules[_beneficiary].length == 0 ||
            schedules[_beneficiary][index].templateName != _templateName,
            "Schedule from this template already added"
        );
        require(now < _startTime, "Date in the past");
        uint256 numberOfTokens = templates[_templateName].numberOfTokens;
        if (numberOfTokens > unassignedTokens) {
            _depositTokens(numberOfTokens.sub(unassignedTokens));
        }
        unassignedTokens = unassignedTokens.sub(numberOfTokens);
        //add beneficiary to the schedule list only if adding first schedule
        if (schedules[_beneficiary].length == 0) {
            beneficiaries.push(_beneficiary);
        }
        schedules[_beneficiary].push(Schedule(_templateName, 0, _startTime));
        userToTemplates[_beneficiary].push(_templateName);
        templateToScheduleIndex[_beneficiary][_templateName] = schedules[_beneficiary].length - 1;
        templateToUsers[_templateName].push(_beneficiary);
        templateToUserIndex[_templateName][_beneficiary] = templateToUsers[_templateName].length - 1;
        emit AddSchedule(_beneficiary, _templateName, _startTime);
    }

    /**
     * @notice Modifies vesting schedules for each of beneficiary
     * @param _beneficiary beneficiary's addresses
     * @param _templateName name of the template
     * @param _startTime vesting start time
     */
    function modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) public withPerm(ADMIN) {
        _modifySchedule(_beneficiary, _templateName, _startTime);
    }

    function _modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal {
        _checkSchedule(_beneficiary, _templateName);
        require(now < _startTime, "Date in the past");
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        Schedule storage schedule = schedules[_beneficiary][index];
        /*solium-disable-next-line security/no-block-members*/
        require(now < schedule.startTime, "Schedule started");
        schedule.startTime = _startTime;
        emit ModifySchedule(_beneficiary, _templateName, _startTime);
    }

    /**
     * @notice Revokes beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _templateName name of the template
     */
    function revokeSchedule(address _beneficiary, bytes32 _templateName) external withPerm(ADMIN) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        _sendTokens(_beneficiary, index);
        Schedule[] storage userSchedules = schedules[_beneficiary];
        //update unassignedTokens
        uint256 releasedTokens = _getReleasedTokens(_beneficiary, index);
        unassignedTokens = unassignedTokens.add(templates[_templateName].numberOfTokens.sub(releasedTokens));
        //delete user schedule and relation between user and template
        if (index != userSchedules.length - 1) {
            userSchedules[index] = userSchedules[userSchedules.length - 1];
            userToTemplates[_beneficiary][index] = userToTemplates[_beneficiary][userToTemplates[_beneficiary].length - 1];
        }
        userSchedules.length--;
        userToTemplates[_beneficiary].length--;
        delete templateToScheduleIndex[_beneficiary][_templateName];
        //delete relation between template and user
        uint256 templateIndex = templateToUserIndex[_templateName][_beneficiary];
        if (templateIndex != templateToUsers[_templateName].length - 1) {
            templateToUsers[_templateName][templateIndex] = templateToUsers[_templateName][templateToUsers[_templateName].length - 1];
        }
        templateToUsers[_templateName].length--;
        delete templateToUserIndex[_templateName][_beneficiary];

        emit RevokeSchedule(_beneficiary, _templateName);
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
            Template storage template = templates[userSchedules[i].templateName];
            unassignedTokens = unassignedTokens.add(template.numberOfTokens.sub(releasedTokens));
            delete templateToScheduleIndex[_beneficiary][userSchedules[i].templateName];
        }
        userSchedules.length = 0;
        delete userToTemplates[_beneficiary];
        emit RevokeAllSchedules(_beneficiary);
    }

    /**
     * @notice Returns beneficiary's schedule
     * @param _beneficiary beneficiary's address
     * @param _templateName name of the template
     * @return beneficiary's schedule
     */
    function getSchedule(address _beneficiary, bytes32 _templateName) external view returns(uint256, uint256, uint256, uint256, State) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        Schedule storage schedule = schedules[_beneficiary][index];
        return (
            templates[schedule.templateName].numberOfTokens,
            templates[schedule.templateName].duration,
            templates[schedule.templateName].frequency,
            schedule.startTime,
            getScheduleState(_beneficiary, _templateName)
        );
    }

    /**
     * @notice Returns state of the schedule
     * @param _beneficiary beneficiary's address
     * @return state of the schedule
     */
    function getScheduleState(address _beneficiary, bytes32 _templateName) public view returns(State) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        Schedule memory schedule = schedules[_beneficiary][index];
        if (now < schedule.startTime) {
            return State.CREATED;
        } else if (now > schedule.startTime && now < schedule.startTime.add(templates[_templateName].duration)) {
            return State.STARTED;
        } else {
            return State.COMPLETED;
        }
    }

    /**
     * @notice Returns list of template names
     * @param _beneficiary beneficiary's address
     * @return list of template names
     */
    function getTemplateNames(address _beneficiary) external view returns(bytes32[]) {
        require(_beneficiary != address(0), "Invalid address");
        return userToTemplates[_beneficiary];
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
        Template storage template = templates[schedule.templateName];
        /*solium-disable-next-line security/no-block-members*/
        if (now > schedule.startTime) {
            uint256 periodCount = template.duration.div(template.frequency);
            /*solium-disable-next-line security/no-block-members*/
            uint256 periodNumber = (now.sub(schedule.startTime)).div(template.frequency);
            if (periodNumber > periodCount) {
                periodNumber = periodCount;
            }
            return template.numberOfTokens.mul(periodNumber).div(periodCount);
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
     * @param _templateNames array of the template names
     * @param _numberOfTokens array of number of tokens
     * @param _durations array of vesting duration
     * @param _frequencies array of vesting frequency
     * @param _startTimes array of vesting start time
     */
    function addScheduleMulti(
        address[] _beneficiaries,
        bytes32[] _templateNames,
        uint256[] _numberOfTokens,
        uint256[] _durations,
        uint256[] _frequencies,
        uint256[] _startTimes
    )
        public
        withPerm(ADMIN)
    {
        require(
            _beneficiaries.length == _templateNames.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _numberOfTokens.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _durations.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _frequencies.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _startTimes.length,
            "Arrays sizes mismatch"
        );
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _addSchedule(_beneficiaries[i], _templateNames[i], _numberOfTokens[i], _durations[i], _frequencies[i], _startTimes[i]);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules from template for each of beneficiaries
     * @param _beneficiaries array of beneficiary's addresses
     * @param _templateNames array of the template names
     * @param _startTimes array of vesting start time
     */
    function addScheduleFromTemplateMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes) external withPerm(ADMIN) {
        require(_beneficiaries.length == _templateNames.length && _beneficiaries.length == _startTimes.length, "Arrays sizes mismatch");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _addScheduleFromTemplate(_beneficiaries[i], _templateNames[i], _startTimes[i]);
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
     * @param _templateNames array of the template names
     * @param _startTimes array of vesting start time
     */
    function modifyScheduleMulti(
        address[] _beneficiaries,
        bytes32[] _templateNames,
        uint256[] _startTimes
    )
        public
        withPerm(ADMIN)
    {
        require(
            _beneficiaries.length == _templateNames.length && /*solium-disable-line operator-whitespace*/
            _beneficiaries.length == _startTimes.length,
            "Arrays sizes mismatch"
        );
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _modifySchedule(_beneficiaries[i], _templateNames[i], _startTimes[i]);
        }
    }

    function _checkSchedule(address _beneficiary, bytes32 _templateName) internal view {
        require(_beneficiary != address(0), "Invalid address");
        uint256 index = templateToScheduleIndex[_beneficiary][_templateName];
        require(
            index < schedules[_beneficiary].length &&
            schedules[_beneficiary][index].templateName == _templateName,
            "Schedule not found"
        );
    }

    function _isTemplateExists(bytes32 _name) internal view returns(bool) {
        return templates[_name].numberOfTokens > 0;
    }

    function _isTemplateUsed(bytes32 _name) internal view returns(bool) {
        return templateToUsers[_name].length > 0;
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
