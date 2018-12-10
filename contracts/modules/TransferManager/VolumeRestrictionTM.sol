pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "./VolumeRestrictionTMStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../libraries/BokkyPooBahsDateTimeLibrary.sol";

contract VolumeRestrictionTM is VolumeRestrictionTMStorage, ITransferManager {
    
    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    // Emit when the token holder is added/removed from the exemption list
    event ChangedExemptWalletList(address indexed _wallet, bool _change);
    // Emit when the new individual restriction is added corresponds to new token holders
    event AddNewIndividualRestriction(
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
    // Emit when the new daily (Individual) restriction is added
    event AddIndividualDailyRestriction(
        address _holder,
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
    event IndividualRestrictionRemoved(address _holder);
    // Emit when individual daily restriction removed
    event IndividualDailyRestrictionRemoved(address _holder);
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
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bytes /*_data*/, bool _isTransfer) public returns (Result) {
        // If `_from` is present in the exemptionList or it is `0x0` address then it will not follow the vol restriction
        if (!paused && _from != address(0) && !exemptList[_from]) {
            // Function must only be called by the associated security token if _isTransfer == true
            require(msg.sender == securityToken || !_isTransfer);
            // Checking the individual restriction if the `_from` comes in the individual category 
            if ((individualRestriction[_from].endTime >= now && individualRestriction[_from].startTime <= now) 
                || (individualDailyRestriction[_from].endTime >= now && individualDailyRestriction[_from].startTime <= now)) {

                return _individualRestrictionCheck(_from, _amount, _isTransfer);
                // If the `_from` doesn't fall under the individual category. It will processed with in the global category automatically
            } else if ((defaultRestriction.endTime >= now && defaultRestriction.startTime <= now)
                || (defaultDailyRestriction.endTime >= now && defaultDailyRestriction.startTime <= now)) {
                
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
        require(_wallet != address(0), "Invalid address");
        exemptList[_wallet] = _change;
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
        external
        withPerm(ADMIN)
    {
        _addIndividualRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /// @notice Internal function to facilitate the addition of individual restriction
    function _addIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   
        
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(
            individualRestriction[_holder].endTime < now,
            "Already present"
        );
        require(_holder != address(0) && !exemptList[_holder], "Invalid address");
        require(startTime >= now, "Invalid startTime");  
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        
        if (individualRestriction[_holder].endTime != 0) {
            _removeIndividualRestriction(_holder);
        }
        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddNewIndividualRestriction(
            _holder,
            _allowedTokens,
            startTime,
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
        external
        withPerm(ADMIN)
    {   
        _addIndividualDailyRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _endTime,
            _restrictionType
        );
    }

    /// @notice Internal function to facilitate the addition of individual daily restriction
    function _addIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   

        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(
            individualDailyRestriction[_holder].endTime < now,
            "Not Allowed"
        );
        require(startTime >= now, "Invalid startTime");  
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType);
        individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddIndividualDailyRestriction(
            _holder,
            _allowedTokens,
            startTime,
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
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _endTimes,
        uint256[] _restrictionTypes 
    )
        public
        withPerm(ADMIN)
    {
        require(
            _allowedTokens.length == _startTimes.length &&
            _startTimes.length == _holders.length &&
            _holders.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < _holders.length; i++) {
            _addIndividualDailyRestriction(
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
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes 
    )
        public
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        require(_holders.length == _allowedTokens.length, "Length mismatch");
        for (uint256 i = 0; i < _holders.length; i++) {
            _addIndividualRestriction(
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
            defaultRestriction.endTime < now,
            "Not allowed"
        );
        require(startTime >= now, "Invalid startTime");  
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        defaultRestriction = VolumeRestriction(
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
            defaultDailyRestriction.endTime < now,
            "Not Allowed"
        );
        require(startTime >= now, "Invalid startTime");  
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType);
        defaultDailyRestriction = VolumeRestriction(
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
    function removeIndividualRestriction(address _holder) external withPerm(ADMIN) {
        _removeIndividualRestriction(_holder);
    }

    /// @notice Internal function to facilitate the removal of individual restriction
    function _removeIndividualRestriction(address _holder) internal {
        require(_holder != address(0), "Invalid address");
        require(individualRestriction[_holder].endTime != 0, "Not present");
        individualRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        userToBucket[_holder].lastTradedDayTime = 0;
        userToBucket[_holder].sumOfLastPeriod = 0;
        userToBucket[_holder].daysCovered = 0;
        emit IndividualRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _holders Array of address of the user 
     */
    function removeIndividualRestrictionMulti(address[] _holders) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _holders.length; i++) {
            _removeIndividualRestriction(_holders[i]);
        }
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holder Address of the user 
     */
    function removeIndividualDailyRestriction(address _holder) external withPerm(ADMIN) {
        _removeIndividualDailyRestriction(_holder);
    }

    /// @notice Internal function to facilitate the removal of individual daily restriction
    function _removeIndividualDailyRestriction(address _holder) internal {
        require(_holder != address(0), "Invalid address");
        require(individualDailyRestriction[_holder].endTime != 0, "Not present");
        individualDailyRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        userToBucket[_holder].dailyLastTradedDayTime = 0;
        emit IndividualDailyRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holders Array of address of the user 
     */
    function removeIndividualDailyRestrictionMulti(address[] _holders) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _holders.length; i++) {
            _removeIndividualDailyRestriction(_holders[i]);
        }
    }

    /**
     * @notice Use to remove the default restriction
     */
    function removeDefaultRestriction() public withPerm(ADMIN) {
        require(defaultRestriction.endTime != 0);
        defaultRestriction = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        emit DefaultRestrictionRemoved();
    }

    /**
     * @notice Use to remove the daily default restriction
     */
    function removeDefaultDailyRestriction() external withPerm(ADMIN) {
        require(defaultDailyRestriction.endTime != 0);
        defaultDailyRestriction = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
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
        external
        withPerm(ADMIN)
    {
        _modifyIndividualRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /// @notice Internal function to facilitate the modification of individual restriction
    function _modifyIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(individualRestriction[_holder].startTime > now, "Not allowed");
        require(startTime >= now, "Invalid startTime");  
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyIndividualRestriction(
            _holder,
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to modify the existing individual daily restriction for a given token holder
     * @dev It is possible to intialize the dailyLatestTradedTime by 0 for the given holder then 
     * changing of startTime will affect the 24 hrs span. i.e if in earlier restriction days start with
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
        external
        withPerm(ADMIN)
    {
        _modifyIndividualDailyRestriction(
            _holder,
            _allowedTokens,
            _startTime,
            _endTime,
            _restrictionType
        );
    }

    /// @notice Internal function to facilitate the modification of individual daily restriction
    function _modifyIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType);
        // Initializing the value with 0 to allow the trade with new startTime of the restriction
        userToBucket[_holder].dailyLastTradedDayTime = 0;
        individualDailyRestriction[_holder] = VolumeRestriction(
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
     * @notice Use to modify the existing individual daily restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for Percentage)
     */
    function modifyIndividualDailyRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _endTimes,
        uint256[] _restrictionTypes  
    )
        public
        withPerm(ADMIN)
    {
       require(
            _allowedTokens.length == _startTimes.length &&
            _startTimes.length == _holders.length &&
            _holders.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Array length mismatch"
        );
        require(_holders.length == _allowedTokens.length, "Length mismatch");
        for (uint256 i = 0; i < _holders.length; i++) {
            _modifyIndividualDailyRestriction(
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
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes  
    )
        public
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        require(_holders.length == _allowedTokens.length, "Length mismatch");
        for (uint256 i = 0; i < _holders.length; i++) {
            _modifyIndividualRestriction(
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
        require(defaultRestriction.startTime > now, "Not allowed"); 
        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }
        require(startTime >= now, "Invalid startTime");      
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        defaultRestriction = VolumeRestriction(
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
     * @dev If the start time is modified then it only affect the startTime of the restriction
     * while it may carries the earlier dailyLatestStartDayTime value. Not possible to initialize the value
     * of dailyLatestStartDayTime for every holder to 0.
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
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType);
        defaultDailyRestriction = VolumeRestriction(
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
        BucketDetails memory bucketDetails = defaultUserToBucket[_from];
        uint256 daysCovered = defaultRestriction.rollingPeriodInDays;
        uint256 fromTimestamp = 0;
        uint256 sumOfLastPeriod = 0;
        uint256 dailyTime = 0;
        bool allowedDefault = true;
        bool allowedDaily;
        if (defaultRestriction.endTime >= now && defaultRestriction.startTime <= now) {
            if (bucketDetails.lastTradedDayTime < defaultRestriction.startTime) {
                // It will execute when the txn is performed first time after the addition of individual restriction
                fromTimestamp = defaultRestriction.startTime;
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
            if (!_checkValidAmountToTransact(sumOfLastPeriod, _amount, defaultRestriction)) {
                allowedDefault = false;
            }
        }
        (allowedDaily, dailyTime) = _dailyTxCheck(_from, _amount, bucketDetails.dailyLastTradedDayTime, defaultDailyRestriction);
        
        if (_isTransfer) {
            _updateStorage(
                _from,
                _amount,
                fromTimestamp,
                sumOfLastPeriod,
                daysCovered,
                dailyTime,
                defaultDailyRestriction.endTime,
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
        BucketDetails memory bucketDetails = userToBucket[_from];
        VolumeRestriction memory dailyRestriction = individualDailyRestriction[_from];
        VolumeRestriction memory restriction = individualRestriction[_from];
        uint256 daysCovered = individualRestriction[_from].rollingPeriodInDays;
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
        VolumeRestriction restriction
    ) 
        internal
        view
        returns(bool, uint256)
    {
        // Checking whether the daily restriction is added or not if yes then calculate
        // the total amount get traded on a particular day (~ _fromTime)
        if ( now <= restriction.endTime && now >= restriction.startTime) {   
            uint256 txSumOfDay = 0;
            if (dailyLastTradedDayTime == 0)
                // This if condition will be executed when the individual daily restriction executed first time
                dailyLastTradedDayTime = restriction.startTime.add(BokkyPooBahsDateTimeLibrary.diffDays(restriction.startTime, now).mul(1 days));
            else if (now.sub(dailyLastTradedDayTime) >= 1 days)
                dailyLastTradedDayTime = dailyLastTradedDayTime.add(BokkyPooBahsDateTimeLibrary.diffDays(dailyLastTradedDayTime, now).mul(1 days));
            // Assgining total sum traded on dailyLastTradedDayTime timestamp
            txSumOfDay = bucket[from][dailyLastTradedDayTime];
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
                sumOfLastPeriod = sumOfLastPeriod.
                sub(bucket[_from][_bucketDetails.lastTradedDayTime.
                sub((_bucketDetails.daysCovered.sub(counter.sub(_rollingPeriodInDays))).mul(1 days))]);
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
        VolumeRestriction _restriction
    ) 
        internal
        view
        returns (bool)
    {    
        uint256 _allowedAmount = 0;
        if (_restriction.typeOfRestriction == RestrictionType.Percentage) {
            _allowedAmount = (_restriction.allowedTokens.mul(ISecurityToken(securityToken).totalSupply())) / uint256(10) ** 18;
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
        BucketDetails storage details;
        if (isDefault)
            details = defaultUserToBucket[_from];
        else
            details = userToBucket[_from];
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
                bucket[_from][_lastTradedDayTime] = bucket[_from][_lastTradedDayTime].add(_amount);
            }
            if ((_dailyLastTradedDayTime != _lastTradedDayTime) && _dailyLastTradedDayTime != 0 && now <= _endTime) {
                // Increasing the total amount of the day by `_amount`
                bucket[_from][_dailyLastTradedDayTime] = bucket[_from][_dailyLastTradedDayTime].add(_amount);
            }
        }  
    }

    function _checkInputParams(
        uint256 _allowedTokens,
        uint256 _startTime, 
        uint256 _rollingPeriodDays, 
        uint256 _endTime,
        uint256 _restrictionType 
    ) 
        internal
        pure
    {
        require(_restrictionType == 0 || _restrictionType == 1, "Invalid type");
        if (_restrictionType == uint256(RestrictionType.Fixed)) {
            require(_allowedTokens > 0, "Invalid value");
        } else {
            require(
                _allowedTokens > 0 && _allowedTokens <= 100 * 10 ** 16,
                "Percentage is not within (0,100]"
            );
        }
        require(_endTime > _startTime, "Invalid times");
        // Maximum limit for the rollingPeriod is 365 days
        require(_rollingPeriodDays >= 1 && _rollingPeriodDays <= 365, "Invalid rollingperiod");
        require(BokkyPooBahsDateTimeLibrary.diffDays(_startTime, _endTime) >= _rollingPeriodDays, "Invalid start & end time");
    }   

    function _checkLengthOfArray(
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes
    )
        internal
        pure 
    {
        require(
            _allowedTokens.length == _startTimes.length &&
            _startTimes.length == _rollingPeriodInDays.length &&
            _rollingPeriodInDays.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Array length mismatch"
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
    function getIndividualBucketDetailsToUser(address _user) external view returns(uint256, uint256, uint256, uint256) {
        return(
            userToBucket[_user].lastTradedDayTime,
            userToBucket[_user].sumOfLastPeriod,
            userToBucket[_user].daysCovered,
            userToBucket[_user].dailyLastTradedDayTime
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
    function getDefaultBucketDetailsToUser(address _user) external view returns(uint256, uint256, uint256, uint256) {
        return(
            defaultUserToBucket[_user].lastTradedDayTime,
            defaultUserToBucket[_user].sumOfLastPeriod,
            defaultUserToBucket[_user].daysCovered,
            defaultUserToBucket[_user].dailyLastTradedDayTime
        );
    }

    /**
     * @notice Use to get the volume of token that being traded at a particular day (`_at` + 24 hours) for a given user
     * @param _user Address of the token holder
     * @param _at Timestamp 
     */
    function getTotalTradeByuser(address _user, uint256 _at) external view returns(uint256) {
        return bucket[_user][_at];
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public view returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Returns the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}