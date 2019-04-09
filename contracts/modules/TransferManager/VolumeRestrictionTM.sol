pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../libraries/BokkyPooBahsDateTimeLibrary.sol";
import "../../libraries/VolumeRestrictionLib.sol";

contract VolumeRestrictionTM is VolumeRestrictionTMStorage, ITransferManager {

    using SafeMath for uint256;

    // permission definition
    bytes32 internal constant ADMIN = "ADMIN";

    // Emit when the token holder is added/removed from the exemption list
    event ChangedExemptWalletList(address indexed _wallet, bool _change);
    // Emit when the new individual restriction is added corresponds to new token holders
    event AddIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when the new daily (Individual) restriction is added
    event AddIndividualDailyRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when the individual restriction is modified for a given address
    event ModifyIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when individual daily restriction get modified
    event ModifyIndividualDailyRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when the new global restriction is added
    event AddDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when the new daily (Default) restriction is added
    event AddDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when default restriction get modified
    event ModifyDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
    );
    // Emit when daily default restriction get modified
    event ModifyDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _typeOfRestriction
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
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bytes /*_data*/, bool _isTransfer) public returns (Result) {
        // If `_from` is present in the exemptionList or it is `0x0` address then it will not follow the vol restriction
        if (!paused && _from != address(0) && exemptIndex[_from] == 0) {
            // Function must only be called by the associated security token if _isTransfer == true
            require(msg.sender == securityToken || !_isTransfer);
            // Checking the individual restriction if the `_from` comes in the individual category
            if ((individualRestriction[_from].endTime >= now && individualRestriction[_from].startTime <= now)
                || (individualDailyRestriction[_from].endTime >= now && individualDailyRestriction[_from].startTime <= now)) {

                return _restrictionCheck(_isTransfer, _from, _amount, userToBucket[_from], individualRestriction[_from], false);

                // If the `_from` doesn't fall under the individual category. It will processed with in the global category automatically
            } else if ((defaultRestriction.endTime >= now && defaultRestriction.startTime <= now)
                || (defaultDailyRestriction.endTime >= now && defaultDailyRestriction.startTime <= now)) {

                return _restrictionCheck(_isTransfer, _from, _amount, defaultUserToBucket[_from], defaultRestriction, true);
            }
        }
        return Result.NA;
    }

    /**
     * @notice Add/Remove wallet address from the exempt list
     * @param _wallet Ethereum wallet/contract address that need to be exempted
     * @param _change Boolean value used to add (i.e true) or remove (i.e false) from the list
     */
    function changeExemptWalletList(address _wallet, bool _change) external withPerm(ADMIN) {
        require(_wallet != address(0));
        uint256 exemptIndexWallet = exemptIndex[_wallet];
        require((exemptIndexWallet == 0) == _change);
        if (_change) {
            exemptAddresses.push(_wallet);
            exemptIndex[_wallet] = exemptAddresses.length;
        } else {
            exemptAddresses[exemptIndexWallet - 1] = exemptAddresses[exemptAddresses.length - 1];
            exemptIndex[exemptAddresses[exemptIndexWallet - 1]] = exemptIndexWallet;
            delete exemptIndex[_wallet];
            exemptAddresses.length --;
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _restrictionType
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
        RestrictionType _restrictionType
    )
        internal
    {
        // It will help to reduce the chances of transaction failure (Specially when the issuer
        // wants to set the startTime near to the current block.timestamp) and minting delayed because
        // of the gas fee or network congestion that lead to the process block timestamp may grater
        // than the given startTime.
        uint256 startTime = _getValidStartTime(_startTime);
        require(_holder != address(0) && exemptIndex[_holder] == 0, "Invalid address");
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);

        if (individualRestriction[_holder].endTime != 0) {
            _removeIndividualRestriction(_holder);
        }
        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
        VolumeRestrictionLib.addRestrictionData(holderData, _holder, TypeOfPeriod.MultipleDays, individualRestriction[_holder].endTime);
        emit AddIndividualRestriction(
            _holder,
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to add the new individual daily restriction for a given token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly). 
     */
    function addIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        RestrictionType _restrictionType
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
        RestrictionType _restrictionType
    )
        internal
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, now, false);
        if (individualDailyRestriction[_holder].endTime != 0) {
            _removeIndividualDailyRestriction(_holder);
        }
        individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
        );
        VolumeRestrictionLib.addRestrictionData(holderData, _holder, TypeOfPeriod.OneDay, individualRestriction[_holder].endTime);
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addIndividualDailyRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _endTimes,
        RestrictionType[] _restrictionTypes
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        //NB - we duplicate _startTimes below to allow function reuse
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addIndividualRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        RestrictionType[] _restrictionTypes
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _restrictionType
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        defaultRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        RestrictionType _restrictionType
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, now, false);
        defaultDailyRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
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
        require(_holder != address(0));
        require(individualRestriction[_holder].endTime != 0);
        individualRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderData, _holder, TypeOfPeriod.OneDay);
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
        require(_holder != address(0));
        require(individualDailyRestriction[_holder].endTime != 0);
        individualDailyRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderData, _holder, TypeOfPeriod.MultipleDays);
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
    function removeDefaultRestriction() external withPerm(ADMIN) {
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _restrictionType
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
        RestrictionType _restrictionType
    )
        internal
    {
        _isAllowedToModify(individualRestriction[_holder].startTime);
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
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
     * @dev Changing of startTime will affect the 24 hrs span. i.e if in earlier restriction days start with
     * morning and end on midnight while after the change day may start with afternoon and end with other day afternoon
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyIndividualDailyRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        RestrictionType _restrictionType
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
        RestrictionType _restrictionType
    )
        internal
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType,
          (individualDailyRestriction[_holder].startTime <= now ? individualDailyRestriction[_holder].startTime : now),
          true
        );
        individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
        );
        emit ModifyIndividualDailyRestriction(
            _holder,
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyIndividualDailyRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _endTimes,
        RestrictionType[] _restrictionTypes
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        //NB - we duplicate _startTimes below to allow function reuse
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyIndividualRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        RestrictionType[] _restrictionTypes
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyDefaultRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        RestrictionType _restrictionType
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        _isAllowedToModify(defaultRestriction.startTime);
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        defaultRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
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
     * @param _restrictionType Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyDefaultDailyRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _endTime,
        RestrictionType _restrictionType
    )
        public //Marked public to save code size
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        // If old startTime is already passed then new startTime should be greater than or equal to the
        // old startTime otherwise any past startTime can be allowed in compare to earlier startTime.
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType,
            (defaultDailyRestriction.startTime <= now ? defaultDailyRestriction.startTime : now),
            true
        );
        defaultDailyRestriction = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
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
    function _restrictionCheck(
        bool _isTransfer,
        address _from,
        uint256 _amount,
        BucketDetails memory _bucketDetails,
        VolumeRestriction memory _restriction,
        bool _isDefault
    )
        internal
        returns (Result)
    {
        // using the variable to avoid stack too deep error
        VolumeRestriction memory dailyRestriction = _isDefault ? defaultDailyRestriction :individualDailyRestriction[_from];
        uint256 daysCovered = _restriction.rollingPeriodInDays;
        uint256 fromTimestamp = 0;
        uint256 sumOfLastPeriod = 0;
        uint256 dailyTime = 0;
        // This variable works for both allowedDefault or allowedIndividual
        bool allowedDefault = true;
        bool allowedDaily;
        if (_restriction.endTime >= now && _restriction.startTime <= now) {
            if (_bucketDetails.lastTradedDayTime < _restriction.startTime) {
                // It will execute when the txn is performed first time after the addition of individual restriction
                fromTimestamp = _restriction.startTime;
            } else {
                // Picking up the last timestamp
                fromTimestamp = _bucketDetails.lastTradedDayTime;
            }

            // Check with the bucket and parse all the new timestamps to calculate the sumOfLastPeriod
            // re-using the local variables to avoid the stack too deep error.
            (sumOfLastPeriod, fromTimestamp, daysCovered) = _bucketCheck(
                fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now),
                _from,
                daysCovered,
                _bucketDetails,
                _isDefault
            );
            // validation of the transaction amount
            if (
                !_checkValidAmountToTransact(
                    _isDefault, _from, sumOfLastPeriod, _amount, _restriction.typeOfRestriction, _restriction.allowedTokens
                )
            ) {
                allowedDefault = false;
            }
        }

        (allowedDaily, dailyTime) = _dailyTxCheck(_from, _amount, _bucketDetails.dailyLastTradedDayTime, dailyRestriction, _isDefault);

        if (_isTransfer) {
            _updateStorage(
                _from,
                _amount,
                fromTimestamp,
                sumOfLastPeriod,
                daysCovered,
                dailyTime,
                _isDefault
            );
        }
        return ((allowedDaily && allowedDefault) == true ? Result.NA : Result.INVALID);
    }

    /**
     * @notice The function is used to check specific edge case where the user restriction type change from
     * default to individual or vice versa. It will return true when last transaction traded by the user
     * and the current txn timestamp lies in the same day.
     * NB - Instead of comparing the current day transaction amount, we are comparing the total amount traded
     * on the lastTradedDayTime that makes the restriction strict. The reason is not availability of amount 
     * that transacted on the current day (because of bucket desgin).
     */
    function _isValidAmountAfterRestrictionChanges(
        bool _isDefault,
        address _from,
        uint256 _amount,
        uint256 _sumOfLastPeriod,
        uint256 _allowedAmount
    )
        internal
        view
        returns(bool)
    {
        // Always use the alternate bucket details as per the current transaction restriction
        BucketDetails storage bucketDetails = _isDefault ? userToBucket[_from] : defaultUserToBucket[_from];
        uint256 amountTradedLastDay = _isDefault ? bucket[_from][bucketDetails.lastTradedDayTime]: defaultBucket[_from][bucketDetails.lastTradedDayTime];
        return VolumeRestrictionLib.isValidAmountAfterRestrictionChanges(
            amountTradedLastDay,
            _amount,
            _sumOfLastPeriod,
            _allowedAmount,
            bucketDetails.lastTradedTimestamp
        );
    }

    function _checkValidAmountToTransact(
        bool _isDefault,
        address _from,
        uint256 _sumOfLastPeriod,
        uint256 _amountToTransact,
        RestrictionType _typeOfRestriction,
        uint256 _allowedTokens
    )
        internal
        view
        returns (bool)
    {
        uint256 allowedAmount;
        if (_typeOfRestriction == RestrictionType.Percentage) {
            allowedAmount = (_allowedTokens.mul(ISecurityToken(securityToken).totalSupply())) / uint256(10) ** 18;
        } else {
            allowedAmount = _allowedTokens;
        }
        // Validation on the amount to transact
        bool allowed = allowedAmount >= _sumOfLastPeriod.add(_amountToTransact);
        return (allowed && _isValidAmountAfterRestrictionChanges(_isDefault, _from, _amountToTransact, _sumOfLastPeriod, allowedAmount));
    }

    function _dailyTxCheck(
        address _from,
        uint256 _amount,
        uint256 _dailyLastTradedDayTime,
        VolumeRestriction memory _restriction,
        bool _isDefault
    )
        internal
        view
        returns(bool, uint256)
    {
        // Checking whether the daily restriction is added or not if yes then calculate
        // the total amount get traded on a particular day (~ _fromTime)
        if ( now <= _restriction.endTime && now >= _restriction.startTime) {
            uint256 txSumOfDay = 0;
            // This if condition will be executed when the individual daily restriction executed first time
            if (_dailyLastTradedDayTime == 0 || _dailyLastTradedDayTime < _restriction.startTime)
                _dailyLastTradedDayTime = _restriction.startTime.add(BokkyPooBahsDateTimeLibrary.diffDays(_restriction.startTime, now).mul(1 days));
            else if (now.sub(_dailyLastTradedDayTime) >= 1 days)
                _dailyLastTradedDayTime = _dailyLastTradedDayTime.add(BokkyPooBahsDateTimeLibrary.diffDays(_dailyLastTradedDayTime, now).mul(1 days));
            // Assgining total sum traded on dailyLastTradedDayTime timestamp
            if (_isDefault)
                txSumOfDay = defaultBucket[_from][_dailyLastTradedDayTime];
            else
                txSumOfDay = bucket[_from][_dailyLastTradedDayTime];
            return (
                _checkValidAmountToTransact(
                _isDefault,
                _from,
                txSumOfDay,
                _amount,
                _restriction.typeOfRestriction,
                _restriction.allowedTokens
                ), 
                _dailyLastTradedDayTime
            );
        }
        return (true, _dailyLastTradedDayTime);
    }

    /// Internal function for the bucket check
    function _bucketCheck(
        uint256 _fromTime,
        uint256 _diffDays,
        address _from,
        uint256 _rollingPeriodInDays,
        BucketDetails memory _bucketDetails,
        bool isDefault
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
                    if (isDefault)
                        sumOfLastPeriod = sumOfLastPeriod.sub(defaultBucket[_from][temp]);
                    else
                        sumOfLastPeriod = sumOfLastPeriod.sub(bucket[_from][temp]);
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

    function _updateStorage(
        address _from,
        uint256 _amount,
        uint256 _lastTradedDayTime,
        uint256 _sumOfLastPeriod,
        uint256 _daysCovered,
        uint256 _dailyLastTradedDayTime,
        bool isDefault
    )
        internal
    {

        if (isDefault){
            BucketDetails storage defaultUserToBucketDetails = defaultUserToBucket[_from];
            _updateStorageActual(_from, _amount, _lastTradedDayTime, _sumOfLastPeriod, _daysCovered, _dailyLastTradedDayTime, defaultDailyRestriction.endTime, true, defaultUserToBucketDetails);
        }
        else {
            BucketDetails storage userToBucketDetails = userToBucket[_from];
            uint256 _endTime = individualDailyRestriction[_from].endTime;
            _updateStorageActual(_from, _amount, _lastTradedDayTime, _sumOfLastPeriod, _daysCovered, _dailyLastTradedDayTime, _endTime, false, userToBucketDetails);
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
        bool isDefault,
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
        // Assigning the latest transaction timestamp
        details.lastTradedTimestamp = now;
        if (_amount != 0) {
            if (_lastTradedDayTime !=0) {
                details.sumOfLastPeriod = _sumOfLastPeriod.add(_amount);
                // Increasing the total amount of the day by `_amount`
                if (isDefault)
                    defaultBucket[_from][_lastTradedDayTime] = defaultBucket[_from][_lastTradedDayTime].add(_amount);
                else
                    bucket[_from][_lastTradedDayTime] = bucket[_from][_lastTradedDayTime].add(_amount);
            }
            if ((_dailyLastTradedDayTime != _lastTradedDayTime) && _dailyLastTradedDayTime != 0 && now <= _endTime) {
                // Increasing the total amount of the day by `_amount`
                if (isDefault)
                    defaultBucket[_from][_dailyLastTradedDayTime] = defaultBucket[_from][_dailyLastTradedDayTime].add(_amount);
                else
                    bucket[_from][_dailyLastTradedDayTime] = bucket[_from][_dailyLastTradedDayTime].add(_amount);

            }
        }
    }

    function _checkInputParams(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodDays,
        uint256 _endTime,
        RestrictionType _restrictionType,
        uint256 _earliestStartTime,
        bool isModifyDaily
    )
        internal
        pure
    {
        if (isModifyDaily)
            require(_startTime >= _earliestStartTime, "Invalid startTime");
        else
            require(_startTime > _earliestStartTime, "Invalid startTime");
        require(_allowedTokens > 0);
        if (_restrictionType != RestrictionType.Fixed) {
            require(_allowedTokens <= 100 * 10 ** 16, "Invalid value");
        }
        // Maximum limit for the rollingPeriod is 365 days
        require(_rollingPeriodDays >= 1 && _rollingPeriodDays <= 365, "Invalid rollingperiod");
        require(
            BokkyPooBahsDateTimeLibrary.diffDays(_startTime, _endTime) >= _rollingPeriodDays,
            "Invalid times"
        );
    }

    function _isAllowedToModify(uint256 _startTime) internal view {
        require(_startTime > now);
    }

    function _getValidStartTime(uint256 _startTime) internal view returns(uint256) {
        if (_startTime == 0)
            _startTime = now + 1;
        return _startTime;
    }

    /**
     * @notice Use to get the bucket details for a given address
     * @param _user Address of the token holder for whom the bucket details has queried
     * @return uint256 lastTradedDayTime
     * @return uint256 sumOfLastPeriod
     * @return uint256 days covered
     * @return uint256 24h lastTradedDayTime
     * @return uint256 Timestamp at which last transaction get executed
     */
    function getIndividualBucketDetailsToUser(address _user) external view returns(uint256, uint256, uint256, uint256, uint256) {
        return _getBucketDetails(userToBucket[_user]);
    }

    /**
     * @notice Use to get the bucket details for a given address
     * @param _user Address of the token holder for whom the bucket details has queried
     * @return uint256 lastTradedDayTime
     * @return uint256 sumOfLastPeriod
     * @return uint256 days covered
     * @return uint256 24h lastTradedDayTime
     * @return uint256 Timestamp at which last transaction get executed
     */
    function getDefaultBucketDetailsToUser(address _user) external view returns(uint256, uint256, uint256, uint256, uint256) {
        return _getBucketDetails(defaultUserToBucket[_user]);
    }

    function _getBucketDetails(BucketDetails storage _bucket) internal view returns(
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        return(
            _bucket.lastTradedDayTime,
            _bucket.sumOfLastPeriod,
            _bucket.daysCovered,
            _bucket.dailyLastTradedDayTime,
            _bucket.lastTradedTimestamp
        );
    }

    /**
     * @notice Use to get the volume of token that being traded at a particular day (`_at` + 24 hours) for a given user
     * @param _user Address of the token holder
     * @param _at Timestamp
     */
    function getTotalTradedByUser(address _user, uint256 _at) external view returns(uint256) {
        return (bucket[_user][_at].add(defaultBucket[_user][_at]));
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public view returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Use to return the list of exempted addresses
     */
    function getExemptAddress() external view returns(address[]) {
        return exemptAddresses;
    }

    /**
     * @notice Provide the restriction details of all the restricted addresses
     * @return address List of the restricted addresses
     * @return uint256 List of the tokens allowed to the restricted addresses corresponds to restricted address
     * @return uint256 List of the start time of the restriction corresponds to restricted address
     * @return uint256 List of the rolling period in days for a restriction corresponds to restricted address.
     * @return uint256 List of the end time of the restriction corresponds to restricted address.
     * @return RestrictionType List of the type of restriction to validate the value of the `allowedTokens`
     * of the restriction corresponds to restricted address
     */
    function getRestrictedData() external view returns(
        address[] memory allAddresses,
        uint256[] memory allowedTokens,
        uint256[] memory startTime,
        uint256[] memory rollingPeriodInDays,
        uint256[] memory endTime,
        RestrictionType[] memory typeOfRestriction
    ) {
        uint256 counter = 0;
        uint256 i = 0;
        for (i = 0; i < holderData.restrictedAddresses.length; i++) {
            counter = counter + uint256(
                holderData.restrictedHolders[holderData.restrictedAddresses[i]].typeOfPeriod == TypeOfPeriod.Both ? TypeOfPeriod.Both : TypeOfPeriod.OneDay
            );
        }
        allAddresses = new address[](counter);
        allowedTokens = new uint256[](counter);
        startTime = new uint256[](counter);
        rollingPeriodInDays = new uint256[](counter);
        endTime = new uint256[](counter);
        typeOfRestriction = new RestrictionType[](counter);
        counter = 0;
        for (i = 0; i < holderData.restrictedAddresses.length; i++) {
            allAddresses[counter] =  holderData.restrictedAddresses[i];
            if (holderData.restrictedHolders[holderData.restrictedAddresses[i]].typeOfPeriod == TypeOfPeriod.MultipleDays) {
                _setValues(individualRestriction[holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            else if (holderData.restrictedHolders[holderData.restrictedAddresses[i]].typeOfPeriod == TypeOfPeriod.OneDay) {
                _setValues(individualDailyRestriction[holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            else if (holderData.restrictedHolders[holderData.restrictedAddresses[i]].typeOfPeriod == TypeOfPeriod.Both) {
                _setValues(individualRestriction[holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                counter = counter + 1;
                allAddresses[counter] =  holderData.restrictedAddresses[i];
                _setValues(individualDailyRestriction[holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            counter ++;
        }
    }

    function _setValues(
        VolumeRestriction memory _restriction,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTime,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTime,
        RestrictionType[] memory _typeOfRestriction,
        uint256 _index
    )
        internal
        pure
    {
        _allowedTokens[_index] = _restriction.allowedTokens;
        _startTime[_index] = _restriction.startTime;
        _rollingPeriodInDays[_index] = _restriction.rollingPeriodInDays;
        _endTime[_index] = _restriction.endTime;
        _typeOfRestriction[_index] = _restriction.typeOfRestriction;
    }

    function _checkLengthOfArray(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        RestrictionType[] _restrictionTypes
    )
        internal
        pure
    {
        require(
            _holders.length == _allowedTokens.length &&
            _allowedTokens.length == _startTimes.length &&
            _startTimes.length == _rollingPeriodInDays.length &&
            _rollingPeriodInDays.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Length mismatch"
        );
    }

    /**
     * @notice Returns the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[] memory allPermissions) {
        allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
    }

}
