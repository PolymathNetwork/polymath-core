pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Wallet.sol";
import "./VestingEscrowWalletStorage.sol";

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWallet is VestingEscrowWalletStorage, Wallet {
    using SafeMath for uint256;

    // States used to represent the status of the schedule
    enum State {CREATED, STARTED, COMPLETED}

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
    // Emit when the treasury wallet gets changed
    event TreasuryWalletChanged(address _newWallet, address _oldWallet);

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
        return this.configure.selector;
    }

    /**
     * @notice Used to initialize the treasury wallet address
     * @param _treasuryWallet Address of the treasury wallet
     */
    function configure(address _treasuryWallet) public onlyFactory {
        _setWallet(_treasuryWallet);
    }

    /**
     * @notice Used to change the treasury wallet address
     * @param _newTreasuryWallet Address of the treasury wallet
     */
    function changeTreasuryWallet(address _newTreasuryWallet) public {
        _onlySecurityTokenOwner();
        _setWallet(_newTreasuryWallet);
    }

    function _setWallet(address _newTreasuryWallet) internal {
        emit TreasuryWalletChanged(_newTreasuryWallet, treasuryWallet);
        treasuryWallet = _newTreasuryWallet;
    }

    /**
     * @notice Used to deposit tokens from treasury wallet to the vesting escrow wallet
     * @param _numberOfTokens Number of tokens that should be deposited
     */
    function depositTokens(uint256 _numberOfTokens) external withPerm(ADMIN) {
        _depositTokens(_numberOfTokens);
    }

    function _depositTokens(uint256 _numberOfTokens) internal {
        require(_numberOfTokens > 0, "Should be > 0");
        require(
            securityToken.transferFrom(msg.sender, address(this), _numberOfTokens),
            "Failed transferFrom"
        );
        unassignedTokens = unassignedTokens.add(_numberOfTokens);
        emit DepositTokens(_numberOfTokens, msg.sender);
    }

    /**
     * @notice Sends unassigned tokens to the treasury wallet
     * @param _amount Amount of tokens that should be send to the treasury wallet
     */
    function sendToTreasury(uint256 _amount) public withPerm(OPERATOR) {
        require(_amount > 0, "Amount cannot be zero");
        require(_amount <= unassignedTokens, "Amount is greater than unassigned tokens");
        unassignedTokens = unassignedTokens - _amount;
        require(securityToken.transfer(getTreasuryWallet(), _amount), "Transfer failed");
        emit SendToTreasury(_amount, msg.sender);
    }

    /**
     * @notice Returns the treasury wallet address
     */
    function getTreasuryWallet() public view returns(address) {
        if (treasuryWallet == address(0)) {
            address wallet = IDataStore(getDataStore()).getAddress(TREASURY);
            require(wallet != address(0), "Invalid address");
            return wallet;
        } else
            return treasuryWallet;
    }

    /**
     * @notice Pushes available tokens to the beneficiary's address
     * @param _beneficiary Address of the beneficiary who will receive tokens
     */
    function pushAvailableTokens(address _beneficiary) public withPerm(OPERATOR) {
        _sendTokens(_beneficiary);
    }

    /**
     * @notice Used to withdraw available tokens by beneficiary
     */
    function pullAvailableTokens() external whenNotPaused {
        _sendTokens(msg.sender);
    }

    /**
     * @notice Adds template that can be used for creating schedule
     * @param _name Name of the template will be created
     * @param _numberOfTokens Number of tokens that should be assigned to schedule
     * @param _duration Duration of the vesting schedule
     * @param _frequency Frequency of the vesting schedule
     */
    function addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external withPerm(ADMIN) {
        _addTemplate(_name, _numberOfTokens, _duration, _frequency);
    }

    function _addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal {
        require(_name != bytes32(0), "Invalid name");
        require(!_isTemplateExists(_name), "Already exists");
        _validateTemplate(_numberOfTokens, _duration, _frequency);
        templateNames.push(_name);
        templates[_name] = Template(_numberOfTokens, _duration, _frequency, templateNames.length - 1);
        emit AddTemplate(_name, _numberOfTokens, _duration, _frequency);
    }

    /**
     * @notice Removes template with a given name
     * @param _name Name of the template that will be removed
     */
    function removeTemplate(bytes32 _name) external withPerm(ADMIN) {
        require(_isTemplateExists(_name), "Template not found");
        require(templateToUsers[_name].length == 0, "Template is used");
        uint256 index = templates[_name].index;
        if (index != templateNames.length - 1) {
            templateNames[index] = templateNames[templateNames.length - 1];
            templates[templateNames[index]].index = index;
        }
        templateNames.length--;
        // delete template data
        delete templates[_name];
        emit RemoveTemplate(_name);
    }

    /**
     * @notice Returns count of the templates those can be used for creating schedule
     * @return Count of the templates
     */
    function getTemplateCount() external view returns(uint256) {
        return templateNames.length;
    }

    /**
     * @notice Gets the list of the template names those can be used for creating schedule
     * @return bytes32 Array of all template names were created
     */
    function getAllTemplateNames() external view returns(bytes32[] memory) {
        return templateNames;
    }

    /**
     * @notice Adds vesting schedules for each of the beneficiary's address
     * @param _beneficiary Address of the beneficiary for whom it is scheduled
     * @param _templateName Name of the template that will be created
     * @param _numberOfTokens Total number of tokens for created schedule
     * @param _duration Duration of the created vesting schedule
     * @param _frequency Frequency of the created vesting schedule
     * @param _startTime Start time of the created vesting schedule
     */
    function addSchedule(
        address _beneficiary,
        bytes32 _templateName,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
    )
        external
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
     * @notice Adds vesting schedules from template for the beneficiary
     * @param _beneficiary Address of the beneficiary for whom it is scheduled
     * @param _templateName Name of the exists template
     * @param _startTime Start time of the created vesting schedule
     */
    function addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) external withPerm(ADMIN) {
        _addScheduleFromTemplate(_beneficiary, _templateName, _startTime);
    }

    function _addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal {
        require(_beneficiary != address(0), "Invalid address");
        require(_isTemplateExists(_templateName), "Template not found");
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        require(
            schedules[_beneficiary].length == 0 ||
            schedules[_beneficiary][index].templateName != _templateName,
            "Already added"
        );
        require(_startTime >= now, "Date in the past");
        uint256 numberOfTokens = templates[_templateName].numberOfTokens;
        if (numberOfTokens > unassignedTokens) {
            _depositTokens(numberOfTokens.sub(unassignedTokens));
        }
        unassignedTokens = unassignedTokens.sub(numberOfTokens);
        if (!beneficiaryAdded[_beneficiary]) {
            beneficiaries.push(_beneficiary);
            beneficiaryAdded[_beneficiary] = true;
        }
        schedules[_beneficiary].push(Schedule(_templateName, 0, _startTime));
        userToTemplates[_beneficiary].push(_templateName);
        userToTemplateIndex[_beneficiary][_templateName] = schedules[_beneficiary].length - 1;
        templateToUsers[_templateName].push(_beneficiary);
        templateToUserIndex[_templateName][_beneficiary] = templateToUsers[_templateName].length - 1;
        emit AddSchedule(_beneficiary, _templateName, _startTime);
    }

    /**
     * @notice Modifies vesting schedules for each of the beneficiary
     * @param _beneficiary Address of the beneficiary for whom it is modified
     * @param _templateName Name of the template was used for schedule creation
     * @param _startTime Start time of the created vesting schedule
     */
    function modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) external withPerm(ADMIN) {
        _modifySchedule(_beneficiary, _templateName, _startTime);
    }

    function _modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal {
        _checkSchedule(_beneficiary, _templateName);
        require(_startTime > now, "Date in the past");
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        Schedule storage schedule = schedules[_beneficiary][index];
        /*solium-disable-next-line security/no-block-members*/
        require(now < schedule.startTime, "Schedule started");
        schedule.startTime = _startTime;
        emit ModifySchedule(_beneficiary, _templateName, _startTime);
    }

    /**
     * @notice Revokes vesting schedule with given template name for given beneficiary
     * @param _beneficiary Address of the beneficiary for whom it is revoked
     * @param _templateName Name of the template was used for schedule creation
     */
    function revokeSchedule(address _beneficiary, bytes32 _templateName) external withPerm(ADMIN) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        _sendTokensPerSchedule(_beneficiary, index);
        uint256 releasedTokens = _getReleasedTokens(_beneficiary, index);
        unassignedTokens = unassignedTokens.add(templates[_templateName].numberOfTokens.sub(releasedTokens));
        _deleteUserToTemplates(_beneficiary, _templateName);
        _deleteTemplateToUsers(_beneficiary, _templateName);
        emit RevokeSchedule(_beneficiary, _templateName);
    }

    function _deleteUserToTemplates(address _beneficiary, bytes32 _templateName) internal {
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        Schedule[] storage userSchedules = schedules[_beneficiary];
        if (index != userSchedules.length - 1) {
            userSchedules[index] = userSchedules[userSchedules.length - 1];
            userToTemplates[_beneficiary][index] = userToTemplates[_beneficiary][userToTemplates[_beneficiary].length - 1];
            userToTemplateIndex[_beneficiary][userSchedules[index].templateName] = index;
        }
        userSchedules.length--;
        userToTemplates[_beneficiary].length--;
        delete userToTemplateIndex[_beneficiary][_templateName];
    }

    function _deleteTemplateToUsers(address _beneficiary, bytes32 _templateName) internal {
        uint256 templateIndex = templateToUserIndex[_templateName][_beneficiary];
        if (templateIndex != templateToUsers[_templateName].length - 1) {
            templateToUsers[_templateName][templateIndex] = templateToUsers[_templateName][templateToUsers[_templateName].length - 1];
            templateToUserIndex[_templateName][templateToUsers[_templateName][templateIndex]] = templateIndex;
        }
        templateToUsers[_templateName].length--;
        delete templateToUserIndex[_templateName][_beneficiary];
    }

    /**
     * @notice Revokes all vesting schedules for given beneficiary's address
     * @param _beneficiary Address of the beneficiary for whom all schedules will be revoked
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
            Template memory template = templates[userSchedules[i].templateName];
            unassignedTokens = unassignedTokens.add(template.numberOfTokens.sub(releasedTokens));
            delete userToTemplateIndex[_beneficiary][userSchedules[i].templateName];
            _deleteTemplateToUsers(_beneficiary, userSchedules[i].templateName);
        }
        delete schedules[_beneficiary];
        delete userToTemplates[_beneficiary];
        emit RevokeAllSchedules(_beneficiary);
    }

    /**
     * @notice Returns beneficiary's schedule created using template name
     * @param _beneficiary Address of the beneficiary who will receive tokens
     * @param _templateName Name of the template was used for schedule creation
     * @return beneficiary's schedule data (numberOfTokens, duration, frequency, startTime, claimedTokens, State)
     */
    function getSchedule(address _beneficiary, bytes32 _templateName) external view returns(uint256, uint256, uint256, uint256, uint256, State) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        Schedule memory schedule = schedules[_beneficiary][index];
        return (
            templates[schedule.templateName].numberOfTokens,
            templates[schedule.templateName].duration,
            templates[schedule.templateName].frequency,
            schedule.startTime,
            schedule.claimedTokens,
            _getScheduleState(_beneficiary, _templateName)
        );
    }

    function _getScheduleState(address _beneficiary, bytes32 _templateName) internal view returns(State) {
        _checkSchedule(_beneficiary, _templateName);
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
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
     * @notice Returns list of the template names for given beneficiary's address
     * @param _beneficiary Address of the beneficiary
     * @return List of the template names that were used for schedule creation
     */
    function getTemplateNames(address _beneficiary) external view returns(bytes32[] memory) {
        require(_beneficiary != address(0), "Invalid address");
        return userToTemplates[_beneficiary];
    }

    /**
     * @notice Returns count of the schedules were created for given beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return Count of beneficiary's schedules
     */
    function getScheduleCount(address _beneficiary) external view returns(uint256) {
        require(_beneficiary != address(0), "Invalid address");
        return schedules[_beneficiary].length;
    }

    function _getAvailableTokens(address _beneficiary, uint256 _index) internal view returns(uint256) {
        Schedule memory schedule = schedules[_beneficiary][_index];
        uint256 releasedTokens = _getReleasedTokens(_beneficiary, _index);
        return releasedTokens.sub(schedule.claimedTokens);
    }

    function _getReleasedTokens(address _beneficiary, uint256 _index) internal view returns(uint256) {
        Schedule memory schedule = schedules[_beneficiary][_index];
        Template memory template = templates[schedule.templateName];
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
     * @notice Used to bulk send available tokens for each of the beneficiaries
     * @param _fromIndex Start index of array of beneficiary's addresses
     * @param _toIndex End index of array of beneficiary's addresses
     */
    function pushAvailableTokensMulti(uint256 _fromIndex, uint256 _toIndex) public withPerm(OPERATOR) {
        require(_toIndex < beneficiaries.length, "Array out of bound");
        for (uint256 i = _fromIndex; i <= _toIndex; i++) {
            if (schedules[beneficiaries[i]].length !=0)
                pushAvailableTokens(beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk add vesting schedules for each of beneficiary
     * @param _beneficiaries Array of the beneficiary's addresses
     * @param _templateNames Array of the template names
     * @param _numberOfTokens Array of number of tokens should be assigned to schedules
     * @param _durations Array of the vesting duration
     * @param _frequencies Array of the vesting frequency
     * @param _startTimes Array of the vesting start time
     */
    function addScheduleMulti(
        address[] memory _beneficiaries,
        bytes32[] memory _templateNames,
        uint256[] memory _numberOfTokens,
        uint256[] memory _durations,
        uint256[] memory _frequencies,
        uint256[] memory _startTimes
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
     * @notice Used to bulk add vesting schedules from template for each of the beneficiary
     * @param _beneficiaries Array of beneficiary's addresses
     * @param _templateNames Array of the template names were used for schedule creation
     * @param _startTimes Array of the vesting start time
     */
    function addScheduleFromTemplateMulti(
        address[] memory _beneficiaries,
        bytes32[] memory _templateNames,
        uint256[] memory _startTimes
    )
        public
        withPerm(ADMIN)
    {
        require(_beneficiaries.length == _templateNames.length && _beneficiaries.length == _startTimes.length, "Arrays sizes mismatch");
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _addScheduleFromTemplate(_beneficiaries[i], _templateNames[i], _startTimes[i]);
        }
    }

    /**
     * @notice Used to bulk revoke vesting schedules for each of the beneficiaries
     * @param _beneficiaries Array of the beneficiary's addresses
     */
    function revokeSchedulesMulti(address[] memory _beneficiaries) public withPerm(ADMIN) {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            _revokeAllSchedules(_beneficiaries[i]);
        }
    }

    /**
     * @notice Used to bulk modify vesting schedules for each of the beneficiaries
     * @param _beneficiaries Array of the beneficiary's addresses
     * @param _templateNames Array of the template names
     * @param _startTimes Array of the vesting start time
     */
    function modifyScheduleMulti(
        address[] memory _beneficiaries,
        bytes32[] memory _templateNames,
        uint256[] memory _startTimes
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
        uint256 index = userToTemplateIndex[_beneficiary][_templateName];
        require(
            index < schedules[_beneficiary].length &&
            schedules[_beneficiary][index].templateName == _templateName,
            "Schedule not found"
        );
    }

    function _isTemplateExists(bytes32 _name) internal view returns(bool) {
        return templates[_name].numberOfTokens > 0;
    }

    function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal view {
        require(_numberOfTokens > 0, "Zero amount");
        require(_duration % _frequency == 0, "Invalid frequency");
        uint256 periodCount = _duration.div(_frequency);
        require(_numberOfTokens % periodCount == 0);
        uint256 amountPerPeriod = _numberOfTokens.div(periodCount);
        require(amountPerPeriod % securityToken.granularity() == 0, "Invalid granularity");
    }

    function _sendTokens(address _beneficiary) internal {
        for (uint256 i = 0; i < schedules[_beneficiary].length; i++) {
            _sendTokensPerSchedule(_beneficiary, i);
        }
    }

    function _sendTokensPerSchedule(address _beneficiary, uint256 _index) internal {
        uint256 amount = _getAvailableTokens(_beneficiary, _index);
        if (amount > 0) {
            schedules[_beneficiary][_index].claimedTokens = schedules[_beneficiary][_index].claimedTokens.add(amount);
            require(securityToken.transfer(_beneficiary, amount), "Transfer failed");
            emit SendTokens(_beneficiary, amount);
        }
    }

    /**
     * @notice Return the permissions flag that are associated with VestingEscrowWallet
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = ADMIN;
        allPermissions[1] = OPERATOR;
        return allPermissions;
    }

}
