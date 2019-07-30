pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";
import "../../../libraries/VolumeRestrictionLib.sol";
import "../TransferManager.sol";

contract VolumeRestrictionTM is VolumeRestrictionTMStorage, TransferManager {
    using SafeMath for uint256;

    // Emit when the token holder is added/removed from the exemption list
    event ChangedExemptWalletList(address indexed _wallet, bool _exempted);
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
     */
    function executeTransfer(address _from, address /*_to */, uint256 _amount, bytes calldata /*_data*/) external onlySecurityToken returns (Result success) {
        uint256 fromTimestamp;
        uint256 sumOfLastPeriod;
        uint256 daysCovered;
        uint256 dailyTime;
        uint256 endTime;
        bool isGlobal;
        (success, fromTimestamp, sumOfLastPeriod, daysCovered, dailyTime, endTime, ,isGlobal) = _verifyTransfer(_from, _amount);
        if (fromTimestamp != 0 || dailyTime != 0) {
            _updateStorage(
                _from,
                _amount,
                fromTimestamp,
                sumOfLastPeriod,
                daysCovered,
                dailyTime,
                endTime,
                isGlobal
            );
        }
        return success;
    }

    /**
     * @notice Used to verify the transfer/transferFrom transaction and prevent tranaction
     * whose volume of tokens will voilate the maximum volume transfer restriction
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(
        address _from,
        address /*_to*/ ,
        uint256 _amount,
        bytes memory /*_data*/
    )
        public
        view
        returns (Result, bytes32)
    {

        (Result success,,,,,,,) = _verifyTransfer(_from, _amount);
        if (success == Result.INVALID)
            return (success, bytes32(uint256(address(this)) << 96));
        return (Result.NA, bytes32(0));
    }

    /**
     * @notice Used to verify the transfer/transferFrom transaction and prevent tranaction
     * whose volume of tokens will voilate the maximum volume transfer restriction
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function _verifyTransfer(
        address _from,
        uint256 _amount
    )
        internal
        view
        returns (Result, uint256, uint256, uint256, uint256, uint256, uint256, bool)
    {
        // If `_from` is present in the exemptionList or it is `0x0` address then it will not follow the vol restriction
        if (!paused && _from != address(0) && exemptions.exemptIndex[_from] == 0) {
            // Checking the individual restriction if the `_from` comes in the individual category
            if ((individualRestrictions.individualRestriction[_from].endTime >= now && individualRestrictions.individualRestriction[_from].startTime <= now)
                || (individualRestrictions.individualDailyRestriction[_from].endTime >= now && individualRestrictions.individualDailyRestriction[_from].startTime <= now)) {

                return _restrictionCheck(_amount, _from, false, individualRestrictions.individualRestriction[_from]);
                // If the `_from` doesn't fall under the individual category. It will processed with in the global category automatically
            } else if ((globalRestrictions.defaultRestriction.endTime >= now && globalRestrictions.defaultRestriction.startTime <= now)
                || (globalRestrictions.defaultDailyRestriction.endTime >= now && globalRestrictions.defaultDailyRestriction.startTime <= now)) {

                return _restrictionCheck(_amount, _from, true, globalRestrictions.defaultRestriction);
            }
        }
        return (Result.NA, 0, 0, 0, 0, 0, 0, false);
    }

    /**
     * @notice Add/Remove wallet address from the exempt list
     * @param _wallet Ethereum wallet/contract address that need to be exempted
     * @param _exempted Boolean value used to add (i.e true) or remove (i.e false) from the list
     */
    function changeExemptWalletList(address _wallet, bool _exempted) public withPerm(ADMIN) {
        require(_wallet != address(0));
        require((exemptions.exemptIndex[_wallet] == 0) == _exempted);
        if (_exempted) {
            exemptions.exemptAddresses.push(_wallet);
            exemptions.exemptIndex[_wallet] = exemptions.exemptAddresses.length;
        } else {
            exemptions.exemptAddresses[exemptions.exemptIndex[_wallet] - 1] = exemptions.exemptAddresses[exemptions.exemptAddresses.length - 1];
            exemptions.exemptIndex[exemptions.exemptAddresses[exemptions.exemptIndex[_wallet] - 1]] = exemptions.exemptIndex[_wallet];
            delete exemptions.exemptIndex[_wallet];
            exemptions.exemptAddresses.length--;
        }
        emit ChangedExemptWalletList(_wallet, _exempted);
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
        public
        withPerm(ADMIN)
    {
        // It will help to reduce the chances of transaction failure (Specially when the issuer
        // wants to set the startTime near to the current block.timestamp) and minting delayed because
        // of the gas fee or network congestion that lead to the process block timestamp may grater
        // than the given startTime.
        uint256 startTime = _getValidStartTime(_startTime);
        require(_holder != address(0) && exemptions.exemptIndex[_holder] == 0, "Invalid address");
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);

        if (individualRestrictions.individualRestriction[_holder].endTime != 0) {
            removeIndividualRestriction(_holder);
        }
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
        VolumeRestrictionLib
            .addRestrictionData(
                holderToRestrictionType,
                _holder,
                TypeOfPeriod.MultipleDays,
                individualRestrictions.individualRestriction[_holder].endTime,
                getDataStore()
            );
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
     * @notice Use to add the new individual daily restriction for all token holder
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
        public
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, now, false);
        if (individualRestrictions.individualDailyRestriction[_holder].endTime != 0) {
            removeIndividualDailyRestriction(_holder);
        }
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            startTime,
            1,
            _endTime,
            _restrictionType
        );
        VolumeRestrictionLib
            .addRestrictionData(
                holderToRestrictionType,
                _holder,
                TypeOfPeriod.OneDay,
                individualRestrictions.individualRestriction[_holder].endTime,
                getDataStore()
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addIndividualDailyRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        RestrictionType[] memory _restrictionTypes
    )
        public
    {
        //NB - we duplicate _startTimes below to allow function reuse
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function addIndividualRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        RestrictionType[] memory _restrictionTypes
    )
        public
    {
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
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
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        globalRestrictions.defaultRestriction = VolumeRestriction(
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
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, now, false);
        globalRestrictions.defaultDailyRestriction = VolumeRestriction(
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
    function removeIndividualRestriction(address _holder) public withPerm(ADMIN) {
        _removeIndividualRestriction(_holder);
    }

    function _removeIndividualRestriction(address _holder) internal {
        require(_holder != address(0));
        require(individualRestrictions.individualRestriction[_holder].endTime != 0);
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderToRestrictionType, _holder, getDataStore(), TypeOfPeriod.OneDay);
        bucketData.userToBucket[_holder].lastTradedDayTime = 0;
        bucketData.userToBucket[_holder].sumOfLastPeriod = 0;
        bucketData.userToBucket[_holder].daysCovered = 0;
        emit IndividualRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _holders Array of address of the user
     */
    function removeIndividualRestrictionMulti(address[] memory _holders) public withPerm(ADMIN) {
        for (uint256 i = 0; i < _holders.length; i++) {
            _removeIndividualRestriction(_holders[i]);
        }
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holder Address of the user
     */
    function removeIndividualDailyRestriction(address _holder) public withPerm(ADMIN) {
        _removeIndividualDailyRestriction(_holder);
    }

    function _removeIndividualDailyRestriction(address _holder) internal {
        require(_holder != address(0));
        require(individualRestrictions.individualDailyRestriction[_holder].endTime != 0);
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(0, 0, 0, 0, RestrictionType(0));
        VolumeRestrictionLib.deleteHolderFromList(holderToRestrictionType, _holder, getDataStore(), TypeOfPeriod.MultipleDays);
        bucketData.userToBucket[_holder].dailyLastTradedDayTime = 0;
        emit IndividualDailyRestrictionRemoved(_holder);
    }

    /**
     * @notice use to remove the individual daily restriction for a given address
     * @param _holders Array of address of the user
     */
    function removeIndividualDailyRestrictionMulti(address[] memory _holders) public withPerm(ADMIN) {
        for (uint256 i = 0; i < _holders.length; i++) {
            _removeIndividualDailyRestriction(_holders[i]);
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
        public
        withPerm(ADMIN)
    {
        _isAllowedToModify(individualRestrictions.individualRestriction[_holder].startTime);
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        individualRestrictions.individualRestriction[_holder] = VolumeRestriction(
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
        public
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        uint256 checkTime = (individualRestrictions.individualDailyRestriction[_holder].startTime <= now ? individualRestrictions.individualDailyRestriction[_holder].startTime : now);
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType, checkTime, true);
        individualRestrictions.individualDailyRestriction[_holder] = VolumeRestriction(
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
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        RestrictionType[] memory _restrictionTypes
    )
        public
    {
        //NB - we duplicate _startTimes below to allow function reuse
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _startTimes, _endTimes, _restrictionTypes);
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
     * @param _restrictionTypes Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
     * or `Percentage` (tokens are calculated as per the totalSupply in the fly).
     */
    function modifyIndividualRestrictionMulti(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        RestrictionType[] memory _restrictionTypes
    )
        public
    {
        _checkLengthOfArray(_holders, _allowedTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
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
        external
        withPerm(ADMIN)
    {
        _isAllowedToModify(globalRestrictions.defaultRestriction.startTime);
        uint256 startTime = _getValidStartTime(_startTime);
        _checkInputParams(_allowedTokens, startTime, _rollingPeriodInDays, _endTime, _restrictionType, now, false);
        globalRestrictions.defaultRestriction = VolumeRestriction(
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
        external
        withPerm(ADMIN)
    {
        uint256 startTime = _getValidStartTime(_startTime);
        // If old startTime is already passed then new startTime should be greater than or equal to the
        // old startTime otherwise any past startTime can be allowed in compare to earlier startTime.
        _checkInputParams(_allowedTokens, startTime, 1, _endTime, _restrictionType,
            (globalRestrictions.defaultDailyRestriction.startTime <= now ? globalRestrictions.defaultDailyRestriction.startTime : now),
            true
        );
        globalRestrictions.defaultDailyRestriction = VolumeRestriction(
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
        uint256 _amount,
        address _from,
        bool _isDefault,
        VolumeRestriction memory _restriction
    )
        internal
        view
        returns (
        Result success,
        uint256 fromTimestamp,
        uint256 sumOfLastPeriod,
        uint256 daysCovered,
        uint256 dailyTime,
        uint256 endTime,
        uint256 allowedAmountToTransact,
        bool allowedDaily
    ) {
        // using the variable to avoid stack too deep error
        VolumeRestriction memory dailyRestriction = _isDefault ? globalRestrictions.defaultDailyRestriction :individualRestrictions.individualDailyRestriction[_from];
        BucketDetails memory _bucketDetails = _isDefault ? bucketData.defaultUserToBucket[_from]: bucketData.userToBucket[_from];
        daysCovered = _restriction.rollingPeriodInDays;
        // This variable works for both allowedDefault or allowedIndividual
        bool allowedDefault = true;
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
                _from,
                _isDefault,
                fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now),

                daysCovered,
                _bucketDetails
            );
            // validation of the transaction amount
            // reusing the local variable to avoid stack too deep error
            // here variable allowedAmountToTransact is representing the allowedAmount
            (allowedDefault, allowedAmountToTransact) = _checkValidAmountToTransact(_amount, _from, _isDefault, _restriction, sumOfLastPeriod);
            if (!allowedDefault) {
                allowedDefault = false;
            }
        }

        // reusing the local variable to avoid stack too deep error
        // here variable endTime is representing the allowedDailyAmount
        (allowedDaily, dailyTime, endTime) = _dailyTxCheck(_amount, _from, _isDefault, _bucketDetails.dailyLastTradedDayTime, dailyRestriction);
        success = ((allowedDaily && allowedDefault) == true ? Result.NA : Result.INVALID);
        allowedAmountToTransact = _validAllowedAmount(dailyRestriction, _restriction, allowedAmountToTransact, endTime);
        endTime = dailyRestriction.endTime;
        allowedDaily = _isDefault;
    }

    function _validAllowedAmount(
        VolumeRestriction memory dailyRestriction,
        VolumeRestriction memory restriction,
        uint256 allowedAmount,
        uint256 allowedDailyAmount
    )
        internal
        view
        returns (uint256)
    {
        if (now > dailyRestriction.endTime || now < dailyRestriction.startTime)
            return allowedAmount;
        else if (now > restriction.endTime || now < restriction.startTime)
            return allowedDailyAmount;
        else
            return Math.min(allowedDailyAmount, allowedAmount);
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
        BucketDetails storage bucketDetails = _isDefault ? bucketData.userToBucket[_from] : bucketData.defaultUserToBucket[_from];
        uint256 amountTradedLastDay = _isDefault ? bucketData.bucket[_from][bucketDetails.lastTradedDayTime]: bucketData.defaultBucket[_from][bucketDetails.lastTradedDayTime];
        return VolumeRestrictionLib.isValidAmountAfterRestrictionChanges(
            amountTradedLastDay,
            _amount,
            _sumOfLastPeriod,
            _allowedAmount,
            bucketDetails.lastTradedTimestamp
        );
    }

    function _dailyTxCheck(
        uint256 _amount,
        address _from,
        bool _isDefault,
        uint256 _dailyLastTradedDayTime,
        VolumeRestriction memory _restriction
    )
        internal
        view
        returns(bool, uint256, uint256)
    {
        // Checking whether the daily restriction is added or not if yes then calculate
        // the total amount get traded on a particular day (~ _fromTime)
        if ( now <= _restriction.endTime && now >= _restriction.startTime) {
            uint256 txSumOfDay = 0;
            if (_dailyLastTradedDayTime == 0 || _dailyLastTradedDayTime < _restriction.startTime)
                // This if condition will be executed when the individual daily restriction executed first time
                _dailyLastTradedDayTime = _restriction.startTime.add(BokkyPooBahsDateTimeLibrary.diffDays(_restriction.startTime, now).mul(1 days));
            else if (now.sub(_dailyLastTradedDayTime) >= 1 days)
                _dailyLastTradedDayTime = _dailyLastTradedDayTime.add(BokkyPooBahsDateTimeLibrary.diffDays(_dailyLastTradedDayTime, now).mul(1 days));
            // Assgining total sum traded on dailyLastTradedDayTime timestamp
            if (_isDefault)
                txSumOfDay = bucketData.defaultBucket[_from][_dailyLastTradedDayTime];
            else
                txSumOfDay = bucketData.bucket[_from][_dailyLastTradedDayTime];
            (bool isAllowed, uint256 allowedAmount) = _checkValidAmountToTransact(_amount, _from, _isDefault, _restriction, txSumOfDay);
            return (isAllowed, _dailyLastTradedDayTime, allowedAmount);
        }
        return (true, _dailyLastTradedDayTime, _amount);
    }

    /// Internal function for the bucket check
    function _bucketCheck(
        address _from,
        bool isDefault,
        uint256 _fromTime,
        uint256 _diffDays,
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
                    if (isDefault)
                        sumOfLastPeriod = sumOfLastPeriod.sub(bucketData.defaultBucket[_from][temp]);
                    else
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
        uint256 _amountToTransact,
        address _from,
        bool _isDefault,
        VolumeRestriction memory _restriction,
        uint256 _sumOfLastPeriod
    )
        internal
        view
        returns (bool, uint256)
    {
        uint256 allowedAmount = _allowedAmountToTransact(_sumOfLastPeriod, _restriction);
        // Validation on the amount to transact
        bool allowed = allowedAmount >= _amountToTransact;
        return ((allowed && _isValidAmountAfterRestrictionChanges(_isDefault, _from, _amountToTransact, _sumOfLastPeriod, allowedAmount)), allowedAmount);
    }

    function _allowedAmountToTransact(
        uint256 _sumOfLastPeriod,
        VolumeRestriction memory _restriction
    )
        internal
        view
        returns (uint256)
    {
        uint256 _allowedAmount = 0;
        if (_restriction.typeOfRestriction == RestrictionType.Percentage) {
            _allowedAmount = (_restriction.allowedTokens.mul(securityToken.totalSupply())) / uint256(10) ** 18;
        } else {
            _allowedAmount = _restriction.allowedTokens;
        }
        return _allowedAmount.sub(_sumOfLastPeriod);
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
            _updateStorageActual(_from, _amount, _lastTradedDayTime, _sumOfLastPeriod, _daysCovered, _dailyLastTradedDayTime, _endTime, true,  defaultUserToBucketDetails);
        }
        else {
            BucketDetails storage userToBucketDetails = bucketData.userToBucket[_from];
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
                    bucketData.defaultBucket[_from][_lastTradedDayTime] = bucketData.defaultBucket[_from][_lastTradedDayTime].add(_amount);
                else
                    bucketData.bucket[_from][_lastTradedDayTime] = bucketData.bucket[_from][_lastTradedDayTime].add(_amount);
            }
            if ((_dailyLastTradedDayTime != _lastTradedDayTime) && _dailyLastTradedDayTime != 0 && now <= _endTime) {
                // Increasing the total amount of the day by `_amount`
                if (isDefault)
                    bucketData.defaultBucket[_from][_dailyLastTradedDayTime] = bucketData.defaultBucket[_from][_dailyLastTradedDayTime].add(_amount);
                else
                    bucketData.bucket[_from][_dailyLastTradedDayTime] = bucketData.bucket[_from][_dailyLastTradedDayTime].add(_amount);
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
     * @notice return the amount of tokens for a given user as per the partition
     * @param _partition Identifier
     * @param _tokenHolder Whom token amount need to query
     * @param _additionalBalance It is the `_value` that transfer during transfer/transferFrom function call
     */
    function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view returns(uint256) {
        uint256 allowedAmountToTransact;
        uint256 fromTimestamp;
        uint256 dailyTime;
        uint256 currentBalance = (msg.sender == address(securityToken)) ? (securityToken.balanceOf(_tokenHolder)).add(_additionalBalance) : securityToken.balanceOf(_tokenHolder);
        if (paused)
            return (_partition == UNLOCKED ? currentBalance: 0);

        (,fromTimestamp,,,dailyTime,,allowedAmountToTransact,) = _verifyTransfer(_tokenHolder, 0);
        if (_partition == LOCKED) {
            if (allowedAmountToTransact == 0 && fromTimestamp == 0 && dailyTime == 0)
                return 0;
            else if (allowedAmountToTransact == 0)
                return currentBalance;
            else
                return (currentBalance.sub(allowedAmountToTransact));
        }
        else if (_partition == UNLOCKED) {
            if (allowedAmountToTransact == 0 && fromTimestamp == 0 && dailyTime == 0)
                return currentBalance;
            else if (allowedAmountToTransact == 0)
                return 0;
            else
                return allowedAmountToTransact;
        }
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
    function getIndividualBucketDetailsToUser(address _user) public view returns(uint256, uint256, uint256, uint256, uint256) {
        return _getBucketDetails(bucketData.userToBucket[_user]);
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
    function getDefaultBucketDetailsToUser(address _user) public view returns(uint256, uint256, uint256, uint256, uint256) {
        return _getBucketDetails(bucketData.defaultUserToBucket[_user]);
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
        return (bucketData.bucket[_user][_at].add(bucketData.defaultBucket[_user][_at]));
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
        RestrictionType[] memory typeOfRestriction
    ) {
        return VolumeRestrictionLib.getRestrictionData(holderToRestrictionType, individualRestrictions, getDataStore());
    }

    function _checkLengthOfArray(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        RestrictionType[] memory _restrictionTypes
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
