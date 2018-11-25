pragma solidity ^0.4.24;

import "../../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";

contract VolumeRestrictionTM is ITransferManager {
    
    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    enum RestrictionType { Fixed, Variable }

    struct VolumeRestriction {
        uint256 allowedTokens;
        uint256 allowedPercentageOfTokens;
        uint256 startTime;
        uint256 rollingPeriodInDays;
        uint256 endTime;
        RestrictionType typeOfRestriction;
    }

    struct BucketDetails {
        uint256[] timestamps;
        uint256 sumOfLastPeriod;   // It is the sum of transacted amount within the last rollingPeriodDays 
    }

    // Global restriction that applies to all token holders
    VolumeRestriction public globalRestriction;
    // Daily global restriction that applies to all token holders (Total ST traded daily is restricted)
    VolumeRestriction public dailyGlobalRestriction;
    // Variable stores the data matrix for the globa restrictions
    BucketDetails internal globalBucketDetails;
    // Restriction stored corresponds to a particular token holder
    mapping(address => VolumeRestriction) public individualRestriction;
    // Storing _from => day's timestamp => total amount transact in a day --individual
    mapping(address => mapping(uint256 => uint256)) internal bucket;
    // Storing the information that used to validate the transaction
    mapping(address => BucketDetails) internal bucketToUser;
    // List of wallets that are exempted from all the restrictions applied by the this contract
    mapping(address => bool) public exemptList;
    // Store the amount of tokens get transacted in a day 
    mapping(uint256 => uint256) public globalBucket;

    // Emit when the token holder is added/removed from the exemption list
    event ChangedExemptWalletList(address indexed _wallet, bool _change);
    // Emit when the new individual restriction is added corresponds to new token holders
    event AddNewIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the individual restriction is modified for a given address
    event ModifyIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the new global restriction is added
    event AddGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the new daily (global) restriction is added
    event AddDailyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when global restriction get modified
    event ModifyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when daily global restriction get modified
    event ModifyDailyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );
    // Emit when the individual restriction gets removed
    event IndividualRestrictionRemoved(address _user);
    // Emit when the global restriction gets removed
    event GlobalRestrictionRemoved();
    // Emit when the daily global restriction gets removed
    event DailyGlobalRestrictionRemoved();

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
            require(msg.sender == securityToken || !_isTransfer, "Sender is not the owner");
            // Checking the individual restriction if the `_from` comes in the individual category 
            if (individualRestriction[_from].endTime >= now && individualRestriction[_from].startTime <= now) {
                return _individualRestrictionCheck(_from, _amount, _isTransfer);
                // If the `_from` doesn't fall under the individual category. It will processed with in the global category automatically
            } else if (globalRestriction.endTime >= now && globalRestriction.startTime <= now) {
                return _globalRestrictionCheck(_from, _amount, _isTransfer);
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
        require(_wallet != address(0), "0x0 address not allowed");
        exemptList[_wallet] = _change;
        emit ChangedExemptWalletList(_wallet, _change);
    }

    /**
     * @notice Use to add the new individual restriction for a given token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function addIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        public
        withPerm(ADMIN)
    {
        _addIndividualRestriction(
            _holder,
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to add the new individual restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _allowedPercentageOfTokens Array of percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _rollingPeriodInDays Array of rolling period in days (Minimum value should be 1 day)
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function addIndividualRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _allowedPercentageOfTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes 
    )
        public
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_allowedTokens, _allowedPercentageOfTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        require(_holders.length == _allowedTokens.length, "Array length mismatch");
        for (uint256 i = 0; i < _holders.length; i++) {
            _addIndividualRestriction(
                _holders[i],
                _allowedTokens[i],
                _allowedPercentageOfTokens[i],
                _startTimes[i],
                _rollingPeriodInDays[i],
                _endTimes[i],
                _restrictionTypes[i] 
            );
        }
    }

    /**
     * @notice Use to add the new global restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function addGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        external
        withPerm(ADMIN)
    {   
        require(
            globalRestriction.endTime == 0 || globalRestriction.endTime > now,
            "Restriction already present"
        );
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        globalRestriction = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddGlobalRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to add the new global daily restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function addDailyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        external
        withPerm(ADMIN)
    {   
        require(
            dailyGlobalRestriction.endTime == 0 || dailyGlobalRestriction.endTime > now,
            "Restriction already present"
        );
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, 1, _endTime, _restrictionType);
        dailyGlobalRestriction = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            1,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddDailyGlobalRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            1,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _user Address of the user 
     */
    function removeIndividualRestriction(address _user) external withPerm(ADMIN) {
        _removeIndividualRestriction(_user);
    }

    /**
     * @notice use to remove the individual restriction for a given address
     * @param _users Array of address of the user 
     */
    function removeIndividualRestrictionMulti(address[] _users) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _users.length; i++) {
            _removeIndividualRestriction(_users[i]);
        }
    }

    /**
     * @notice Use to remove the global restriction
     */
    function removeGlobalRestriction() external withPerm(ADMIN) {
        require(globalRestriction.endTime != 0, "Not present");
        globalRestriction = VolumeRestriction(0, 0, 0, 0, 0, RestrictionType(0));
        globalBucketDetails.timestamps.length = 0;
        globalBucketDetails.sumOfLastPeriod = 0;
        emit GlobalRestrictionRemoved();
    }

    /**
     * @notice Use to remove the daily global restriction
     */
    function removeDailyGlobalRestriction() external withPerm(ADMIN) {
        require(dailyGlobalRestriction.endTime != 0, "Not present");
        dailyGlobalRestriction = VolumeRestriction(0, 0, 0, 0, 0, RestrictionType(0));
        emit DailyGlobalRestrictionRemoved();
    } 

    /**
     * @notice Use to modify the existing individual restriction for a given token holder
     * @param _holder Address of the token holder, whom restriction will be implied
     * @param _allowedTokens Amount of tokens allowed to be trade for a given address.
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function modifyIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        public
        withPerm(ADMIN)
    {
        _modifyIndividualRestriction(
            _holder,
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to modify the existing individual restriction for multiple token holders
     * @param _holders Array of address of the token holders, whom restriction will be implied
     * @param _allowedTokens Array of amount of tokens allowed to be trade for a given address.
     * @param _allowedPercentageOfTokens Array of percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTimes Array of unix timestamps at which restrictions get into effect
     * @param _rollingPeriodInDays Array of rolling period in days (Minimum value should be 1 day)
     * @param _endTimes Array of unix timestamps at which restriction effects will gets end.
     * @param _restrictionTypes Array of restriction types value will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function modifyIndividualRestrictionMulti(
        address[] _holders,
        uint256[] _allowedTokens,
        uint256[] _allowedPercentageOfTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes  
    )
        public
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_allowedTokens, _allowedPercentageOfTokens, _startTimes, _rollingPeriodInDays, _endTimes, _restrictionTypes);
        require(_holders.length == _allowedTokens.length, "Array length mismatch");
        for (uint256 i = 0; i < _holders.length; i++) {
            _modifyIndividualRestriction(
                _holders[i],
                _allowedTokens[i],
                _allowedPercentageOfTokens[i],
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
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function modifyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {   
        require(globalRestriction.startTime > now, "Not allowed to modify");    
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        globalRestriction = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyGlobalRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Use to modify the daily global restriction for all token holder
     * @param _allowedTokens Amount of tokens allowed to be traded for all token holder.
     * @param _allowedPercentageOfTokens Percentage of tokens w.r.t to totalSupply allowed to transact.
     * @param _startTime Unix timestamp at which restriction get into effect
     * @param _rollingPeriodInDays Rolling period in days (Minimum value should be 1 day)
     * @param _endTime Unix timestamp at which restriction effects will gets end.
     * @param _restrictionType It will be 0 or 1 (i.e 0 for fixed while 1 for variable)
     */
    function modifyDailyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType
    )
        external
        withPerm(ADMIN)
    {   
        require(dailyGlobalRestriction.startTime > now, "Not allowed to modify");    
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        dailyGlobalRestriction = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyDailyGlobalRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    /**
     * @notice Internal function have a logic to validate the txn amount with global restriction 
     */
    function _globalRestrictionCheck(address _from, uint256 _amount, bool _isTransfer) internal returns (Result) {
        uint256[] memory timestamps = globalBucketDetails.timestamps;
        uint256 fromTimestamp;
        uint256 sumOfLastPeriod = 0;
        if (timestamps.length == 0) {
            // It will execute when the txn is performed first time after the addition of global restriction
            fromTimestamp = globalRestriction.startTime;
        } else {
            // picking up the preivous timestamp
            fromTimestamp = timestamps[timestamps.length -1];
        }
        // Calculating the difference of days
        uint256 diffDays = BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now); 
        uint256[] memory passedTimestamps = new uint256[](diffDays);
        // Check with the bucket and parse all the new timestamps to calculate the sumOfLastPeriod
        // re-using the local variables to avoid the stack too deep error.
        (sumOfLastPeriod, fromTimestamp, passedTimestamps) = _bucketCheck(
            fromTimestamp,
            diffDays,
            _from,
            globalBucketDetails,
            true,
            globalRestriction
        );
        // Total amout that is transacted uptill now for `fromTimestamp` day
        uint256 txSumOfDay = globalBucket[fromTimestamp];
        // Global transaction check
        if (_globalTxCheck(sumOfLastPeriod, txSumOfDay, _amount)) {
            // allow modification in storage when `_isTransfer` equals true
            if(_isTransfer) {
                // update the global storage
                _updateGlobalStorage(
                    passedTimestamps,
                    fromTimestamp,
                    _amount,
                    diffDays,
                    sumOfLastPeriod
                );
            }
            return Result.NA;
        }
        return Result.INVALID;
    }

    /**
     * @notice Internal function to update the state variables related to global restriction
     */
    function _updateGlobalStorage(
        uint256[] passedTimestamps,
        uint256 _fromTime,
        uint256 _amount,
        uint256 _diffDays,
        uint256 _sumOfLastPeriod
    )
        internal
    {
        if (_diffDays != 0) {
            for (uint256 i = 0; i < passedTimestamps.length; i++) {
                // Add the timestamp that is already passed
                globalBucketDetails.timestamps.push(passedTimestamps[i]);
            }
        }
        // This condition is the works only when the transaction performed just after the startTime (_diffDays == 0)
        if (globalBucketDetails.timestamps.length == 0) {
            globalBucketDetails.timestamps.push(_fromTime);
        }
        if(_amount != 0) {
            // updating the sumOfLastPeriod
            globalBucketDetails.sumOfLastPeriod = _sumOfLastPeriod.add(_amount);

            // Re-using the local variable to avoid stack too deep error
            _fromTime = globalBucketDetails.timestamps[globalBucketDetails.timestamps.length -1];
            globalBucket[_fromTime] = globalBucket[_fromTime].add(_amount);
        }
    }

    /// Internal function for the bucket check
    function _bucketCheck(
        uint256 _fromTime,
        uint256 _diffDays,
        address _from,
        BucketDetails _bucketDetails,
        bool _isGlobal,
        VolumeRestriction _restriction
    )
        internal
        view
        returns (uint256, uint256, uint256[])
    {
        uint256[] memory passedTimestamps = new uint256[](_diffDays);
        uint256 counter = _bucketDetails.timestamps.length;
        uint256 i = 0;
        if (_diffDays != 0) {
            for (i = 0; i < _diffDays; i++) {
                // calculating the timestamp that will used as an index of the next bucket
                // i.e buckets period will be look like this T1 to T2-1, T2 to T3-1 .... 
                // where T1,T2,T3 are timestamps having 24 hrs difference
                _fromTime = _fromTime.add(1 days);

                // This condition is to check whether the first rolling period is covered or not
                // if not then it continues and adding 0 value into sumOfLastPeriod without subtracting
                // the earlier value at that index
                if (counter >= _restriction.rollingPeriodInDays) {
                    if (_isGlobal) {
                        // Subtracting the former value(Sum of all the txn amount of that day) from the sumOfLastPeriod
                        _bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.
                        sub(globalBucket[_bucketDetails.timestamps[counter.sub(_restriction.rollingPeriodInDays)]]);
                    } else {
                        // Subtracting the former value(Sum of all the txn amount of that day) from the sumOfLastPeriod
                        _bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.
                        sub(bucket[_from][_bucketDetails.timestamps[counter.sub(_restriction.rollingPeriodInDays)]]);
                    }
                    
                }

                // Adding the last amount that is transacted on the `_fromTime` not actually doing it but left written to understand
                // the alogrithm
                //_bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.add(uint256(0));
                // Storing all those timestamps whose total transacted value is 0
                passedTimestamps[i] = _fromTime;
                counter++;
            }
        }
        return (_bucketDetails.sumOfLastPeriod, _fromTime, passedTimestamps);
    }

    /**
     * @notice Internal function used to validate the transaction for a given address
     * If it validates then it also update the storage corressponds to the individual restriction
     */
    function _individualRestrictionCheck(
        address _from,
        uint256 _amount,
        bool _isTransfer
    )
        internal
        returns(Result)
    {   
        uint256 fromTimestamp;
        uint256 sumOfLastPeriod = 0;
        if (bucketToUser[_from].timestamps.length == 0) {
            // It will execute when the txn is performed first time after the addition of individual restriction
            fromTimestamp = individualRestriction[_from].startTime;
        } else {
            // Picking up the last timestamp
            fromTimestamp = bucketToUser[_from].timestamps[bucketToUser[_from].timestamps.length -1];
        }
        // Calculating the difference of days
        uint256 diffDays = BokkyPooBahsDateTimeLibrary.diffDays(fromTimestamp, now); 
        uint256[] memory passedTimestamps = new uint256[](diffDays);
        // Check with the bucket and parse all the new timestamps to calculate the sumOfLastPeriod
        // re-using the local variables to avoid the stack too deep error.
        (sumOfLastPeriod, fromTimestamp, passedTimestamps) = _bucketCheck(
            fromTimestamp,
            diffDays,
            _from,
            bucketToUser[_from],
            false,
            individualRestriction[_from]
        );
        if (_checkValidAmountToTransact(sumOfLastPeriod, _amount, individualRestriction[_from])) {
            if (_isTransfer) {
                _updateIndividualStorage(
                    passedTimestamps,
                    _from,
                    fromTimestamp,
                    _amount,
                    diffDays,
                    sumOfLastPeriod
                );
            }
            return Result.NA;
        } 
        return Result.INVALID;  
    }


    function _globalTxCheck(
        uint256 _sumOfLastPeriod,
        uint256 _dailyAmount,
        uint256 _amount
    ) 
        internal
        view
        returns(bool)
    {
        // Checking whether the global day restriction is added or not if yes then calculate
        // the total amount get traded on a particular day (~ _fromTime)
        if (!_checkValidAmountToTransact(_dailyAmount, _amount, dailyGlobalRestriction) &&
                now <= dailyGlobalRestriction.endTime && now >= dailyGlobalRestriction.startTime
        ) {
            return false;
        }
        return _checkValidAmountToTransact(_sumOfLastPeriod, _amount, globalRestriction);
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
        if (_restriction.typeOfRestriction == RestrictionType.Variable) {
            _allowedAmount = (_restriction.allowedPercentageOfTokens.mul(ISecurityToken(securityToken).totalSupply()))/ 10 ** 18;
        } else {
            _allowedAmount = _restriction.allowedTokens;
        }
        // Validation on the amount to transact
        if (_allowedAmount >= _sumOfLastPeriod.add(_amountToTransact)) {
            return true;
        } else {
            return false;
        }
    }

    function _updateIndividualStorage(
        uint256[] passedTimestamps,
        address _from,
        uint256 _fromTime,
        uint256 _amount,
        uint256 _diffDays,
        uint256 _sumOfLastPeriod
    )
        internal 
    {
        if (_diffDays != 0) {
            for (uint256 i = 0; i < passedTimestamps.length; i++) {
                // Add the timestamp that is already passed
                bucketToUser[_from].timestamps.push(passedTimestamps[i]);
            }
        }
        // This condition is the works only when the transaction performed just after the startTime (_diffDays == 0)
        if (bucketToUser[_from].timestamps.length == 0) {
            bucketToUser[_from].timestamps.push(_fromTime);
        }
        if(_amount != 0) {
            bucketToUser[_from].sumOfLastPeriod = _sumOfLastPeriod.add(_amount);

            // Re-using the local variable to avoid stack too deep error
            _fromTime = bucketToUser[_from].timestamps[bucketToUser[_from].timestamps.length -1];
            bucket[_from][_fromTime] = bucket[_from][_fromTime].add(_amount);
        }
        
    }

    function _removeIndividualRestriction(address _user) internal {
        require(_user != address(0), "Invalid address");
        require(individualRestriction[_user].endTime != 0, "Not present");
        individualRestriction[_user] = VolumeRestriction(0, 0, 0, 0, 0, RestrictionType(0));
        bucketToUser[_user].timestamps.length = 0;
        bucketToUser[_user].sumOfLastPeriod = 0;
        emit IndividualRestrictionRemoved(_user);
    }

    function _modifyIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        require(individualRestriction[_holder].startTime > now, "Not allowed to modify");

        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit ModifyIndividualRestriction(
            _holder,
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    function _addIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _restrictionType 
    )
        internal
    {   
        require(
            individualRestriction[_holder].endTime == 0 || individualRestriction[_holder].endTime > now,
            "Restriction already present"
        );
        require(_holder != address(0) && !exemptList[_holder], "Invalid address");
        _checkInputParams(_allowedTokens, _allowedPercentageOfTokens, _startTime, _rollingPeriodInDays, _endTime, _restrictionType);
        
        individualRestriction[_holder] = VolumeRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            RestrictionType(_restrictionType)
        );
        emit AddNewIndividualRestriction(
            _holder,
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
    }

    function _checkInputParams(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime, 
        uint256 _rollingPeriodDays, 
        uint256 _endTime,
        uint256 _restrictionType 
    ) 
        internal
        pure
    {
        require(_restrictionType == 0 || _restrictionType == 1, "Invalid restriction type");
        if (_restrictionType == uint256(RestrictionType.Fixed)) {
            require(_allowedTokens > 0, "Invalid value of allowed tokens");
        } else {
            require(
                _allowedPercentageOfTokens > 0 && _allowedPercentageOfTokens <= 100 * 10 ** 16,
                "Percentage of tokens not within (0,100]"
            );
        }
        require(_startTime > 0 && _endTime > _startTime);
        // Maximum limit for the rollingPeriod is 365 days
        require(_rollingPeriodDays >= 1 && _rollingPeriodDays <= 365);
        require(BokkyPooBahsDateTimeLibrary.diffDays(_startTime, _endTime) >= _rollingPeriodDays);
    }   

    function _checkLengthOfArray(
        uint256[] _allowedTokens,
        uint256[] _allowedPercentageOfTokens,
        uint256[] _startTimes,
        uint256[] _rollingPeriodInDays,
        uint256[] _endTimes,
        uint256[] _restrictionTypes
    )
        internal
        pure 
    {
        require(
            _allowedTokens.length == _allowedPercentageOfTokens.length &&
            _allowedPercentageOfTokens.length == _startTimes.length &&
            _startTimes.length == _rollingPeriodInDays.length &&
            _rollingPeriodInDays.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Array length mismatch"
        );
    }

    /**
     * @notice Use to get the bucket details for a given address
     * @param _user Address of the token holder for whom the bucket details has queried
     * @return uint256 Array of the timestamps
     * @return uint256 sumOfLastPeriod
     */
    function getBucketDetailsToUser(address _user) external view returns(uint256[], uint256) {
        return(
            bucketToUser[_user].timestamps,
            bucketToUser[_user].sumOfLastPeriod
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
     * @notice Use to get the global bucket details
     * @return uint256 Array of timestamps
     * @return uint256 sumOfLastPeriod
     * @return uint256 Total amount traded on the latest timestamp
     */
    function getGlobalBucketDetails() external view returns(uint256[], uint256, uint256) {
        return(
            globalBucketDetails.timestamps,
            globalBucketDetails.sumOfLastPeriod,
            globalBucket[globalBucketDetails.timestamps[globalBucketDetails.timestamps.length - 1]]
        );
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
