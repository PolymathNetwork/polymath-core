pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../libraries/BokkyPooBahsDateTimeLibrary.sol";
import "../../libraries/VolumeRestrictionLib.sol";
import "./TransferManager.sol";

contract VolumeRestrictionTM is VolumeRestrictionTMStorage, TransferManager {
    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    // Emit when the token holder is added/removed from the exemption list
    event ChangedExemptWalletList(address indexed _wallet, bool _change);
    // Emit when the new individual restriction is added corresponds to new token holders
    event AddIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the new daily (Individual) restriction is added
    event AddIndividualDailyRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the individual restriction is modified for a given address
    event ModifyIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when individual daily restriction get modified
    event ModifyIndividualDailyRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the new global restriction is added
    event AddDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the new daily (Default) restriction is added
    event AddDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when default restriction get modified
    event ModifyDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when daily default restriction get modified
    event ModifyDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the individual restriction gets removed
    event IndividualRestrictionRemoved(address indexed _holder);
    // Emit when individual daily restriction removed
    event IndividualDailyRestrictionRemoved(address indexed _holder);
    // Emit when the default restriction gets removed
    event DefaultRestrictionRemoved();
    // Emit when the daily default restriction gets removed
    event DefaultDailyRestrictionRemoved();

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
     * @notice Used to verify the transfer/transferFrom transaction and prevent tranaction
     * whose volume of tokens will voilate the maximum volume transfer restriction
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bytes memory /*_data*/, bool _isTransfer) public returns (Result) {
        // If `_from` is present in the exemptionList or it is `0x0` address then it will not follow the vol restriction
        if (!paused && _from != address(0) && exemptions.exemptIndex[_from] == 0) {
            // Function must only be called by the associated security token if _isTransfer == true
            require(msg.sender == securityToken || !_isTransfer);
            // Checking the individual restriction if the `_from` comes in the individual category
            if ((individualRestrictions.individualRestriction[_from].endTime >= now && individualRestrictions.individualRestriction[_from].startTime <= now)
                || (individualRestrictions.individualDailyRestriction[_from].endTime >= now && individualRestrictions.individualDailyRestriction[_from].startTime <= now)) {

                return _individualRestrictionCheck(_from, _amount, _isTransfer);
                // If the `_from` doesn't fall under the individual category. It will processed with in the global category automatically
            } else if ((globalRestrictions.defaultRestriction.endTime >= now && globalRestrictions.defaultRestriction.startTime <= now)
                || (globalRestrictions.defaultDailyRestriction.endTime >= now && globalRestrictions.defaultDailyRestriction.startTime <= now)) {

                return _defaultRestrictionCheck(_from, _amount, _isTransfer);
            }
        }
        return Result.NA;
    }

    /**
     * @notice Add/Remove wallet address from the exempt list
     * @param _wallet Ethereum wallet/contract address that need to be exempted
     * @param _change Boolean value used to add (i.e true) or remove (i.e false) from the list
     */
    function changeExemptWalletList(address _wallet, bool _change) public withPerm(ADMIN) {
        require(_wallet != address(0));
        require((exemptions.exemptIndex[_wallet] == 0) == _change);
        if (_change) {
            exemptions.exemptAddresses.push(_wallet);
            exemptions.exemptIndex[_wallet] = exemptions.exemptAddresses.length;
        } else {
            exemptions.exemptAddresses[exemptions.exemptIndex[_wallet] - 1] = exemptions.exemptAddresses[exemptions.exemptAddresses.length - 1];
            exemptions.exemptIndex[exemptions.exemptAddresses[exemptions.exemptIndex[_wallet] - 1]] = exemptions.exemptIndex[_wallet];
            delete exemptions.exemptIndex[_wallet];
            exemptions.exemptAddresses.length --;
        }
        emit ChangedExemptWalletList(_wallet, _change);
    }

    /**
     * @notice Use to add the new individual restriction for a given token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        public
        withPerm(ADMIN)
    {
        require(
            individualRestrictions.individualRestriction[_holder].endTime < now,
            "Not Allowed"
        );
        if (_startTime == 0) {
            _startTime = now;
        }
        require(_holder != address(0) && exemptions.exemptIndex[_holder] == 0, "Invalid address");
        _checkInputParams(_allowedTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType, now);

        if (individualRestrictions.individualRestriction[_holder].endTime != 0) {
            removeIndividualRestriction(_holder);
        }
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        VolumeRestrictionLib.addRestrictionData(holderData, _holder, uint8(TypeOfPeriod.MultipleDays), individualRestrictions.individualRestriction[_holder].endTime);
        emit AddIndividualRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to add the new individual daily restriction for all token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType
    )
        public
        withPerm(ADMIN)
    {
        if (_startTime == 0) {
            _startTime = now;
        }
        require(
            individualRestrictions.individualDailyRestriction[_holder].endTime < now,
            "Not Allowed"
        );
        _checkInputParams(_allowedTokens, _startTime, 1, _endTime, _restrictionType, now);
        if (individualRestrictions.individualDailyRestriction[_holder].endTime != 0) {
            removeIndividualDailyRestriction(_holder);
        }
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        VolumeRestrictionLib.addRestrictionData(holderData, _holder, uint8(TypeOfPeriod.OneDay), individualRestrictions.individualRestriction[_holder].endTime);
        emit AddIndividualDailyRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            1,
            _endTime,
            _restrictionType
      );
    }

    /**
     * @notice Use to add the new individual daily restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addIndividualDailyRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        uint256[] memory _restrictionTypes
    )
        public
    {
        //NB - we duplicate _startTimes below to allow function reuse
        VolumeRestrictionLib._checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
        for (uint256 i = 0; i < _holders.length; i++) {
            addIndividualDailyRestriction(
                _holders[i],
                _allowedTokens[i],
                _startTimes[i],
                _endTimes[i],
                _restrictionTypes[i]
            );
        }
    }

    /**
     * @notice Use to add the new individual restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _rollingPeriodInDays Array of rolling period in days (Minimum value should be 1 day)
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addIndividualRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        uint256[] memory _restrictionTypes
    )
        public
    {
        VolumeRestrictionLib._checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        for (uint256 i = 0; i < _holders.length; i++) {
            addIndividualRestriction(
                _holders[i],
                _allowedTokens[i],
                _startTimes[i],
                _rollingPeriodInDays[i],
                _endTimes[i],
                _restrictionTypes[i]
            );
        }
    }

    /**
     * @notice Use to add the new default restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(
            globalRestrictions.defaultRestriction.endTime < now,
            "Not Allowed"
        );
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now);
        globalRestrictions.defaultRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddDefaultRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to add the new default daily restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function addDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(
            globalRestrictions.defaultDailyRestriction.endTime < now,
            "Not Allowed"
        );
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, now);
        globalRestrictions.defaultDailyRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddDefaultDailyRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _holder Address of the user
     */
    function removeIndividualRestriction(address _holder) public withPerm(ADMIN) {
        require(_holder != address(0));
        require(individualRestrictions.individualRestriction[_holder].endTime != 0);
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderData, _holder, uint8(TypeOfPeriod.OneDay));
        bucketData.userToBucket[_holder].lastTradedDayTime = 0;
        bucketData.userToBucket[_holder].sumOfLastPeriod = 0;
        bucketData.userToBucket[_holder].daysCovered = 0;
        emit IndividualRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _holders Array of address of the user
     */
    function removeIndividualRestrictionMulti(address[] calldata _holders) external {
        for (uint256 i = 0; i < _holders.length; i++) {
            removeIndividualRestriction(_holders[i]);
        }
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holder Address of the user
     */
    function removeIndividualDailyRestriction(address _holder) public withPerm(ADMIN) {
        require(_holder != address(0));
        require(individualRestrictions.individualDailyRestriction[_holder].endTime != 0);
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderData, _holder, uint8(TypeOfPeriod.MultipleDays));
        bucketData.userToBucket[_holder].dailyLastTradedDayTime = 0;
        emit IndividualDailyRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holders Array of address of the user
     */
    function removeIndividualDailyRestrictionMulti(address[] calldata _holders) external {
        for (uint256 i = 0; i < _holders.length; i++) {
            removeIndividualDailyRestriction(_holders[i]);
        }
    }

    /**
     * @notice Use to remove the default restriction
     */
    function removeDefaultRestriction() public withPerm(ADMIN) {
        require(globalRestrictions.defaultRestriction.endTime != 0);
        globalRestrictions.defaultRestriction = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        emit DefaultRestrictionRemoved();
    }

    /**
     * @notice Use to remove the daily default restriction
     */
    function removeDefaultDailyRestriction() external withPerm(ADMIN) {
        require(globalRestrictions.defaultDailyRestriction.endTime != 0);
        globalRestrictions.defaultDailyRestriction = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        emit DefaultDailyRestrictionRemoved();
    }

    /**
     * @notice Use to modify the existing individual restriction for a given token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        public
        withPerm(ADMIN)
    {
        if (_startTime == 0) {
            _startTime = now;
        }
        require(individualRestrictions.individualRestriction[_holder].startTime > now, "Not Allowed");
        _checkInputParams(_allowedTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType, now);
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyIndividualRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
      );
    }

    /**
     * @notice Use to modify the existing individual daily restriction for a given token holder
     * @dev Changing of startTime will affect the 24 hrs span. i.e if in earlier restriction days start with
     * morning and end on midnight while after the change day may start with afternoon and end with other day afternoon
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType
    )
        public
        withPerm(ADMIN)
    {
        if (_startTime == 0) {
            _startTime = now;
        }
        uint checkTime = (individualRestrictions.individualDailyRestriction[_holder].startTime <= now ? individualRestrictions.individualDailyRestriction[_holder].startTime : now);
        _checkInputParams(_allowedTokens, _startTime, 1, _endTime, _restrictionType, checkTime);
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyIndividualDailyRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            1,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to modify the existing individual daily restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyIndividualDailyRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        uint256[] memory _restrictionTypes
    )
        public
    {
        //NB - we duplicate _startTimes below to allow function reuse
        VolumeRestrictionLib._checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
        for (uint256 i = 0; i < _holders.length; i++) {
            modifyIndividualDailyRestriction(
                _holders[i],
                _allowedTokens[i],
                _startTimes[i],
                _endTimes[i],
                _restrictionTypes[i]
            );
        }
    }

    /**
     * @notice Use to modify the existing individual restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _rollingPeriodInDays Array of rolling period in days (Minimum value should be 1 day)
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyIndividualRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        uint256[] memory _restrictionTypes
    )
        public
    {
        VolumeRestrictionLib._checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        for (uint256 i = 0; i < _holders.length; i++) {
            modifyIndividualRestriction(
                _holders[i],
                _allowedTokens[i],
                _startTimes[i],
                _rollingPeriodInDays[i],
                _endTimes[i],
                _restrictionTypes[i]
            );
        }
    }

    /**
     * @notice Use to modify the global restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {
        require(globalRestrictions.defaultRestriction.startTime > now, "Not Allowed");
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now);
        globalRestrictions.defaultRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyDefaultRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to modify the daily default restriction for all token holder
     * @dev Changing of startTime will affect the 24 hrs span. i.e if in earlier restriction days start with
     * morning and end on midnight while after the change day may start with afternoon and end with other day afternoon.
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        // If old startTime is already passed then new startTime should be greater than or equal to the
        // old startTime otherwise any past startTime can be allowed in compare to earlier startTime.
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType,
            (globalRestrictions.defaultDailyRestriction.startTime <= now ? globalRestrictions.defaultDailyRestriction.startTime : now)
        );
        globalRestrictions.defaultDailyRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyDefaultDailyRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
        );
    }

    /**
    * @notice Internal function used to validate the transaction for a given address
    * If it validates then it also update the storage corressponds to the default restriction
    */
    function _defaultRestrictionCheck(address _from, uint256 _amount, bool _isTransfer) internal returns (Result) {
        // using the variable to avoid stack too deep error
        BucketDetails storage bucketDetails = bucketData.defaultUserToBucket[_from];
        uint256 daysCovered = globalRestrictions.defaultRestriction.rollingPeriodInDays;
        uint256 fromTimestamp = 0;
        uint256 sumOfLastPeriod = 0;
        uint256 dailyTime = 0;
        bool allowedDefault = true;
        bool allowedDaily;
        if (globalRestrictions.defaultRestriction.endTime >= now && globalRestrictions.defaultRestriction.startTime <= now) {
            if (bucketDetails.lastTradedDayTime < globalRestrictions.defaultRestriction.startTime) {
                // It will execute when the txn is performed first time after the addition of individual restriction
                fromTimestamp = globalRestrictions.defaultRestriction.startTime;
            } else {
                // Picking up the last timestamp
                fromTimestamp = bucketDetails.lastTradedDayTime;
            }

            // Check with the bucket and parse all the new timestamps to calculate the sumOfLastPeriod
            // re-using the local variables to avoid the stack too deep error.
            (sumOfLastPeriod, fromTimestamp, daysCovered) = _bucketCheck(
                fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now),
                _from,
                daysCovered,
                bucketDetails
            );
            // validation of the transaction amount
            if (!_checkValidAmountToTransact(sumOfLastPeriod, _amount, globalRestrictions.defaultRestriction)) {
                allowedDefault = false;
            }
        }
        (allowedDaily, dailyTime) = _dailyTxCheck(_from, _amount, bucketDetails.dailyLastTradedDayTime, globalRestrictions.defaultDailyRestriction);

        if (_isTransfer) {
            _updateStorage(
                _from,
                _amount,
                fromTimestamp,
                sumOfLastPeriod,
                daysCovered,
                dailyTime,
                globalRestrictions.defaultDailyRestriction.endTime,
                true
            );
        }
        return ((allowedDaily && allowedDefault) == true ? Result.NA : Result.INVALID);
    }

    /**
     * @notice Internal function used to validate the transaction for a given address
     * If it validates then it also update the storage corressponds to the individual restriction
     */
    function _individualRestrictionCheck(address _from, uint256 _amount, bool _isTransfer) internal returns (Result) {
        // using the variable to avoid stack too deep error
        BucketDetails memory bucketDetails = bucketData.userToBucket[_from];
        VolumeRestriction memory dailyRestriction = individualRestrictions.individualDailyRestriction[_from];
        VolumeRestriction memory restriction = individualRestrictions.individualRestriction[_from];
        uint256 daysCovered = restriction.rollingPeriodInDays;
        uint256 fromTimestamp = 0;
        uint256 sumOfLastPeriod = 0;
        uint256 dailyTime = 0;
        bool allowedIndividual = true;
        bool allowedDaily;
        if (restriction.endTime >= now && restriction.startTime <= now) {
            if (bucketDetails.lastTradedDayTime < restriction.startTime) {
                // It will execute when the txn is performed first time after the addition of individual restriction
                fromTimestamp = restriction.startTime;
            } else {
                // Picking up the last timestamp
                fromTimestamp = bucketDetails.lastTradedDayTime;
            }

            // Check with the bucket and parse all the new timestamps to calculate the sumOfLastPeriod
            // re-using the local variables to avoid the stack too deep error.
            (sumOfLastPeriod, fromTimestamp, daysCovered) = _bucketCheck(
                fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now),
                _from,
                daysCovered,
                bucketDetails
            );
            // validation of the transaction amount
            if (!_checkValidAmountToTransact(sumOfLastPeriod, _amount, restriction)) {
                allowedIndividual = false;
            }
        }
        (allowedDaily, dailyTime) = _dailyTxCheck(_from, _amount, bucketDetails.dailyLastTradedDayTime, dailyRestriction);
        if (_isTransfer) {
            _updateStorage(
                _from,
                _amount,
                fromTimestamp,
                sumOfLastPeriod,
                daysCovered,
                dailyTime,
                dailyRestriction.endTime,
                false
            );
        }

        return ((allowedDaily && allowedIndividual) ? Result.NA : Result.INVALID);
    }

    function _dailyTxCheck(
        address from,
        uint256 amount,
        uint256 dailyLastTradedDayTime,
        VolumeRestriction memory restriction
    )
        internal
        view
        returns(bool, uint256)
    {
        // Checking whether the daily restriction is added or not if yes then calculate
        // the total amount get traded on a particular day (~ _fromTime)
        if ( now <= restriction.endTime && now >= restriction.startTime) {
            uint256 txSumOfDay = 0;
            if (dailyLastTradedDayTime == 0 || dailyLastTradedDayTime < restriction.startTime)
                // This if condition will be executed when the individual daily restriction executed first time
                dailyLastTradedDayTime = restriction.startTime.add(BokkyPooBahsDateTimeLibrary.diffDays(restriction.startTime, now).mul(1 days));
            else if (now.sub(dailyLastTradedDayTime) >= 1 days)
                dailyLastTradedDayTime = dailyLastTradedDayTime.add(BokkyPooBahsDateTimeLibrary.diffDays(dailyLastTradedDayTime, now).mul(1 days));
            // Assgining total sum traded on dailyLastTradedDayTime timestamp
            txSumOfDay = bucketData.bucket[from][dailyLastTradedDayTime];
            return (_checkValidAmountToTransact(txSumOfDay, amount, restriction), dailyLastTradedDayTime);
        }
        return (true, dailyLastTradedDayTime);
    }

    /// Internal function for the bucket check
    function _bucketCheck(
        uint256 _fromTime,
        uint256 _diffDays,
        address _from,
        uint256 _rollingPeriodInDays,
        BucketDetails memory _bucketDetails
    )
        internal
        view
        returns (uint256, uint256, uint256)
    {
        uint256 counter = _bucketDetails.daysCovered;
        uint256 sumOfLastPeriod = _bucketDetails.sumOfLastPeriod;
        uint256 i = 0;
        if (_diffDays >= _rollingPeriodInDays) {
            // If the difference of days is greater than the rollingPeriod then sumOfLastPeriod will always be zero
            sumOfLastPeriod = 0;
            counter = counter.add(_diffDays);
        } else {
            for (i = 0; i < _diffDays; i++) {
                counter++;
                // This condition is to check whether the first rolling period is covered or not
                // if not then it continues and adding 0 value into sumOfLastPeriod without subtracting
                // the earlier value at that index
                if (counter >= _rollingPeriodInDays) {
                    // Subtracting the former value(Sum of all the txn amount of that day) from the sumOfLastPeriod
                    // The below line subtracts (the traded volume on days no longer covered by rolling period) from sumOfLastPeriod.
                    // Every loop execution subtracts one day's trade volume.
                    // Loop starts from the first day covered in sumOfLastPeriod upto the day that is covered by rolling period.
                    uint256 temp = _bucketDetails.daysCovered.sub(counter.sub(_rollingPeriodInDays));
                    temp = _bucketDetails.lastTradedDayTime.sub(temp.mul(1 days));
                    sumOfLastPeriod = sumOfLastPeriod.sub(bucketData.bucket[_from][temp]);
                }
                // Adding the last amount that is transacted on the `_fromTime` not actually doing it but left written to understand
                // the alogrithm
                //_bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.add(uint256(0));
            }
        }
        // calculating the timestamp that will used as an index of the next bucket
        // i.e buckets period will be look like this T1 to T2-1, T2 to T3-1 ....
        // where T1,T2,T3 are timestamps having 24 hrs difference
        _fromTime = _fromTime.add(_diffDays.mul(1 days));
        return (sumOfLastPeriod, _fromTime, counter);
    }

    function _checkValidAmountToTransact(
        uint256 _sumOfLastPeriod,
        uint256 _amountToTransact,
        VolumeRestriction memory _restriction
    )
        internal
        view
        returns (bool)
    {
        uint256 _allowedAmount = 0;
        if (_restriction.typeOfRestriction == RestrictionType.Percentage) {
            _allowedAmount = (_restriction.allowedTokens.mul(IERC20(securityToken).totalSupply())) / uint256(10) ** 18;
        } else {
            _allowedAmount = _restriction.allowedTokens;
        }
        // Validation on the amount to transact
        return (_allowedAmount >= _sumOfLastPeriod.add(_amountToTransact));
    }

    function _updateStorage(
        address _from,
        uint256 _amount,
        uint256 _lastTradedDayTime,
        uint256 _sumOfLastPeriod,
        uint256 _daysCovered,
        uint256 _dailyLastTradedDayTime,
        uint256 _endTime,
        bool isDefault
    )
        internal
    {

        if (isDefault){
            BucketDetails storage defaultUserToBucketDetails = bucketData.defaultUserToBucket[_from];
            _updateStorageActual(_from, _amount, _lastTradedDayTime, _sumOfLastPeriod, _daysCovered, _dailyLastTradedDayTime, _endTime, defaultUserToBucketDetails);
        }
        else {
            BucketDetails storage userToBucketDetails = bucketData.userToBucket[_from];
            _updateStorageActual(_from, _amount, _lastTradedDayTime, _sumOfLastPeriod, _daysCovered, _dailyLastTradedDayTime, _endTime, userToBucketDetails);
        }
    }

    function _updateStorageActual(
        address _from,
        uint256 _amount,
        uint256 _lastTradedDayTime,
        uint256 _sumOfLastPeriod,
        uint256 _daysCovered,
        uint256 _dailyLastTradedDayTime,
        uint256 _endTime,
        BucketDetails storage details
    )
        internal
    {
        // Cheap storage technique
        if (details.lastTradedDayTime != _lastTradedDayTime) {
            // Assigning the latest transaction timestamp of the day
            details.lastTradedDayTime = _lastTradedDayTime;
        }
        if (details.dailyLastTradedDayTime != _dailyLastTradedDayTime) {
            // Assigning the latest transaction timestamp of the day
            details.dailyLastTradedDayTime = _dailyLastTradedDayTime;
        }
        if (details.daysCovered != _daysCovered) {
            details.daysCovered = _daysCovered;
        }

        if (_amount != 0) {
            if (_lastTradedDayTime !=0) {
                details.sumOfLastPeriod = _sumOfLastPeriod.add(_amount);
                // Increasing the total amount of the day by `_amount`
                bucketData.bucket[_from][_lastTradedDayTime] = bucketData.bucket[_from][_lastTradedDayTime].add(_amount);
            }
            if ((_dailyLastTradedDayTime != _lastTradedDayTime) && _dailyLastTradedDayTime != 0 && now <= _endTime) {
                // Increasing the total amount of the day by `_amount`
                bucketData.bucket[_from][_dailyLastTradedDayTime] = bucketData.bucket[_from][_dailyLastTradedDayTime].add(_amount);
            }
        }
    }

    function _checkInputParams(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodDays,
        uint256 _endTime,
        uint256 _restrictionType,
        uint256 _earliestStartTime
    )
        internal
        pure
    {
        require(_restrictionType == 0 || _restrictionType == 1, "Invalid type");
        require(_startTime >= _earliestStartTime, "Invalid startTime");
        if (_restrictionType == uint256(RestrictionType.Fixed)) {
            require(_allowedTokens > 0, "Invalid value");
        } else {
            require(
                _allowedTokens > 0 && _allowedTokens <= 100 * 10 ** 16,
                "Invalid value"
            );
        }
        // Maximum limit for the rollingPeriod is 365 days
        require(_rollingPeriodDays >= 1 && _rollingPeriodDays <= 365, "Invalid rollingperiod");
        require(
            BokkyPooBahsDateTimeLibrary.diffDays(_startTime, _endTime) >= _rollingPeriodDays && _endTime > _startTime,
            "Invalid times"
        );
    }

    /**
     * @notice Use to get the bucket details for a given address
     * @param _user Address of the token holder for whom the bucket details has queried
     * @return uint256 lastTradedDayTime
     * @return uint256 sumOfLastPeriod
     * @return uint256 days covered
     * @return uint256 24h lastTradedDayTime
     */
    function getIndividualBucketDetailsToUser(address _user) public view returns(uint256, uint256, uint256, uint256) {
        return(
            bucketData.userToBucket[_user].lastTradedDayTime,
            bucketData.userToBucket[_user].sumOfLastPeriod,
            bucketData.userToBucket[_user].daysCovered,
            bucketData.userToBucket[_user].dailyLastTradedDayTime
        );
    }

    /**
     * @notice Use to get the bucket details for a given address
     * @param _user Address of the token holder for whom the bucket details has queried
     * @return uint256 lastTradedDayTime
     * @return uint256 sumOfLastPeriod
     * @return uint256 days covered
     * @return uint256 24h lastTradedDayTime
     */
    function getDefaultBucketDetailsToUser(address _user) public view returns(uint256, uint256, uint256, uint256) {
        return(
            bucketData.defaultUserToBucket[_user].lastTradedDayTime,
            bucketData.defaultUserToBucket[_user].sumOfLastPeriod,
            bucketData.defaultUserToBucket[_user].daysCovered,
            bucketData.defaultUserToBucket[_user].dailyLastTradedDayTime
        );
    }

    /**
     * @notice Use to get the volume of token that being traded at a particular day (`_at` + 24 hours) for a given user
     * @param _user Address of the token holder
     * @param _at Timestamp
     */
    function getTotalTradedByUser(address _user, uint256 _at) external view returns(uint256) {
        return bucketData.bucket[_user][_at];
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Use to return the list of exempted addresses
     */
    function getExemptAddress() external view returns(address[] memory) {
        return exemptions.exemptAddresses;
    }

    function getIndividualRestriction(address _investor) external view returns(uint256, uint256, uint256, uint256, RestrictionType) {
        return _volumeRestrictionSplay(individualRestrictions.individualRestriction[_investor]);
    }

    function getIndividualDailyRestriction(address _investor) external view returns(uint256, uint256, uint256, uint256, RestrictionType) {
        return _volumeRestrictionSplay(individualRestrictions.individualDailyRestriction[_investor]);
    }

    function getDefaultRestriction() external view returns(uint256, uint256, uint256, uint256, RestrictionType) {
        return _volumeRestrictionSplay(globalRestrictions.defaultRestriction);
    }

    function getDefaultDailyRestriction() external view returns(uint256, uint256, uint256, uint256, RestrictionType) {
        return _volumeRestrictionSplay(globalRestrictions.defaultDailyRestriction);
    }

    function _volumeRestrictionSplay(VolumeRestriction memory _volumeRestriction) internal pure returns(uint256, uint256, uint256, uint256, RestrictionType) {
        return (
            _volumeRestriction.allowedTokens,
            _volumeRestriction.startTime,
            _volumeRestriction.rollingPeriodInDays,
            _volumeRestriction.endTime,
            _volumeRestriction.typeOfRestriction
        );
    }

    /**
     * @notice Provide the restriction details of all the restricted addresses
     * @return address List of the restricted addresses
     * @return uint256 List of the tokens allowed to the restricted addresses corresponds to restricted address
     * @return uint256 List of the start time of the restriction corresponds to restricted address
     * @return uint256 List of the rolling period in days for a restriction corresponds to restricted address.
     * @return uint256 List of the end time of the restriction corresponds to restricted address.
     * @return uint8 List of the type of restriction to validate the value of the `allowedTokens`
     * of the restriction corresponds to restricted address
     */
    function getRestrictionData() external view returns(
        address[] memory allAddresses,
        uint256[] memory allowedTokens,
        uint256[] memory startTime,
        uint256[] memory rollingPeriodInDays,
        uint256[] memory endTime,
        uint8[] memory typeOfRestriction
    ) {
        return VolumeRestrictionLib.getRestrictionData(holderData, individualRestrictions);
    }



    /**
     * @notice Returns the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[] memory ) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
