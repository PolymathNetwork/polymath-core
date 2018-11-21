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
        uint256 sumOfLastPeriod;
        uint256 daysCovered;
        uint256 latestTimestampIndex;
    }

    uint256 globalSumOfLastPeriod;

    VolumeRestriction globalRestriction;

    mapping(address => VolumeRestriction) public individualRestriction;
    // Storing _from => day's timestamp => total amount transact in a day
    mapping(address => mapping(uint256 => uint256)) internal bucket;
    // Storing the information that used to validate the transaction
    mapping(address => BucketDetails) internal bucketToUser;
    // List of wallets that are exempted from all the restrictions applied by the this contract
    mapping(address => bool) public exemptList;
    mapping(address => BucketDetails) internal globalBucketToUser;

    event ChangedExemptWalletList(address indexed _wallet, bool _change);
    
    event AddNewIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );

    event ModifyIndividualRestriction(
        address indexed _holder,
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );

    event AddNewGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );

    event ModifyGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime,
        uint256 _typeOfRestriction
    );

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
     * @param _to Address of the reciever
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes /*_data*/, bool _isTransfer) public returns (Result) {
        if (!paused && _from != address(0) && !exemptList[_from]) {
            require(msg.sender == securityToken || !_isTransfer);
            return _checkRestriction(_from, _amount, _isTransfer);
        } else {
            return Result.NA;
        } 
    }

    function _checkRestriction(address _from, uint256 _amount, bool _isTransfer) internal returns (Result) {
        if (individualRestriction[_from].endTime >= now && individualRestriction[_from].startTime <= now) {
            BucketDetails memory _bucketDetails = bucketToUser[_from];
            uint256 _diffDays;
            if (_bucketDetails.timestamps[0] == 0) {
                _diffDays = BokkyPooBahsDateTimeLibrary.diffDays(individualRestriction[_from].startTime, now);
                return _individualBucketCheck(
                    individualRestriction[_from].startTime,
                    _diffDays,
                    _from,
                    individualRestriction[_from],
                    _amount,
                    _isTransfer
                );
            } else {
                _diffDays = BokkyPooBahsDateTimeLibrary.diffDays(_bucketDetails.timestamps[_bucketDetails.latestTimestampIndex], now);
                return _individualBucketCheck(
                    _bucketDetails.timestamps[_bucketDetails.latestTimestampIndex],
                    _diffDays,
                    _from,
                    individualRestriction[_from],
                    _amount,
                    _isTransfer
                );
            }
        } else if (now <= globalRestriction.endTime && now >= globalRestriction.startTime) {
            // TODO: Add the global bucket check
            // Algorithm should be loop to all(who doesn't have the individual restriction) the individualBucketCheck
            // and get the amount that was transacted till now.
            // Calculate the sum of that amount + new txn amount and compare with allowed percentage or fixed amount
            // amount of tokens 
            _globalBucketCheck();
        } else {
            return Result.NA;
        }
    }

    function _globalBucketCheck() internal {
        // TODO: Definition pending
    }

    function _individualBucketCheck(
        uint256 _fromTime,
        uint256 _diffDays,
        address _from,
        VolumeRestriction _restriction,
        uint256 _amount,
        bool _isTransfer 
    ) 
        internal
        returns (Result)
    {
        BucketDetails memory _bucketDetails = bucketToUser[_from];
        uint256[] memory passedTimestamps = new uint256[](_diffDays);
        uint256[] memory counters = new uint256[](_diffDays);
        // using the existing memory variable instead of creating new one (avoiding stack too deep error)
        // uint256 counter = _bucketDetails.latestTimestampIndex;
        uint256 i = 0;
        bool valid;
        for (i = 1; i <= _diffDays; i++) {
            // calculating the timestamp that will used as an index of the next bucket
            // i.e buckets period will be look like this T1 to T2-1, T2 to T3-1 .... 
            // where T1,T2,T3 are timestamps having 24 hrs difference
            _fromTime = _fromTime.add(1 days);
             // Creating the round array
            if (_bucketDetails.latestTimestampIndex > _restriction.rollingPeriodInDays -1) {
                    _bucketDetails.latestTimestampIndex = 0;
            }
            // This condition is to check whether the first rolling period is covered or not
            // if not then it continues and adding 0 value into sumOfLastPeriod without subtracting
            // the earlier value at that index
            if (_bucketDetails.daysCovered <= _restriction.rollingPeriodInDays) {
                _bucketDetails.daysCovered++;
            } else {
                // temporarily storing the previous value of timestamp at the "_bucketDetails.latestTimestampIndex" index 
                uint256 _previousTimestamp = _bucketDetails.timestamps[_bucketDetails.latestTimestampIndex];
                // Subtracting the former value(Sum of all the txn amount of that day) from the sumOfLastPeriod
                _bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.sub(bucket[_from][_previousTimestamp]);
            }
            // Adding the last amount that is transacted on the _fromTime
            _bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.add(uint256(0));
            // Storing the passed timestamp in the array 
            _bucketDetails.timestamps[_bucketDetails.latestTimestampIndex] =  _fromTime;
            // Storing all those timestamps whose total transacted value is 0
            passedTimestamps[i] = _fromTime;
            counters[i] = _bucketDetails.latestTimestampIndex;
            _bucketDetails.latestTimestampIndex ++; 
        }
        if (_restriction.typeOfRestriction == RestrictionType.Variable) {
            uint256 _allowedAmount = (_restriction.allowedTokens.mul(ISecurityToken(securityToken).totalSupply()))/ 10 ** 18;
            valid = _checkValidAmountToTransact(_bucketDetails.sumOfLastPeriod, _amount, _allowedAmount);
        } else {
            valid = _checkValidAmountToTransact(_bucketDetails.sumOfLastPeriod, _amount, _restriction.allowedTokens);
        }
        if (!valid) {
            return Result.INVALID;
        } else {
            if (_isTransfer) {
                for (i = 0; i < passedTimestamps.length; i++) {
                    // Assigning the sum of transacted amount on the passed day
                    bucket[_from][passedTimestamps[i]] = 0;
                    // To save gas by not assigning a memory timestamp array to storage timestamp array.
                    bucketToUser[_from].timestamps[counters[i]] = _bucketDetails.timestamps[counters[i]];
                }
                bucketToUser[_from].sumOfLastPeriod = _bucketDetails.sumOfLastPeriod + _amount;
                bucketToUser[_from].daysCovered = _bucketDetails.daysCovered;
                // Storing the index of the latest timestamp from the array of timestamp that is being processed
                bucketToUser[_from].latestTimestampIndex = _bucketDetails.latestTimestampIndex;
                bucket[_from][_bucketDetails.timestamps[_bucketDetails.latestTimestampIndex]] = bucket[_from][_bucketDetails.timestamps[_bucketDetails.latestTimestampIndex]].add(_amount);
            }
            return Result.NA;
        }
        
    }

    function _checkValidAmountToTransact(
        uint256 _sumOfLastPeriod,
        uint256 _amountToTransact,
        uint256 _allowedTokens
    ) 
        internal
        pure
        returns (bool)
    {
        if (_allowedTokens >= _sumOfLastPeriod.add(_amountToTransact)) {
            return true;
        } else {
            return false;
        }
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
        public
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
        emit AddNewGlobalRestriction(
            _allowedTokens,
            _allowedPercentageOfTokens,
            _startTime,
            _rollingPeriodInDays,
            _endTime,
            _restrictionType
        );
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
        public
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
        bucketToUser[_holder] = BucketDetails(new uint256[](_rollingPeriodInDays), 0, 0, 0);
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
        bucketToUser[_holder] = BucketDetails(new uint256[](_rollingPeriodInDays), 0, 0, 0);
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
