pragma solidity ^0.4.24;

import "../../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";

contract VolumeRestrictionTM is ITransferManager {
    
    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    enum RestrictionType { Fixed, Variable }

    enum Scope { Global, Individual }

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
    }

    VolumeRestriction globalRestriction;

    mapping(address => VolumeRestriction) public individualRestriction;
    // Storing _from => day's timestamp => total amount transact in a day --individual
    mapping(address => mapping(uint256 => uint256)) internal bucket;
    // Storing the information that used to validate the transaction
    mapping(address => BucketDetails) internal bucketToUser;
    // List of wallets that are exempted from all the restrictions applied by the this contract
    mapping(address => bool) public exemptList;

    address[] globalUsers;

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
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bytes /*_data*/, bool _isTransfer) public returns (Result) {
        if (!paused && _from != address(0) && !exemptList[_from]) {
            require(msg.sender == securityToken || !_isTransfer);
            return _checkRestriction(_from, _amount, _isTransfer);
        } else {
            return Result.NA;
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

    function _checkRestriction(address _from, uint256 _amount, bool _isTransfer) internal returns (Result) {
        uint256 _fromTimestamp;
        BucketDetails memory _bucketDetails = bucketToUser[_from];
        if (individualRestriction[_from].endTime >= now && individualRestriction[_from].startTime <= now) {
            if (_bucketDetails.timestamps.length == 0) {
                _fromTimestamp = individualRestriction[_from].startTime;
            } else {
                _fromTimestamp = _bucketDetails.timestamps[_bucketDetails.timestamps.length - 1];
            }
            return _bucketCheck(
                _fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(_fromTimestamp, now),
                _from,
                _amount,
                _isTransfer,
                Scope.Individual,
                individualRestriction[_from]
            );
        } else if (now <= globalRestriction.endTime && now >= globalRestriction.startTime) {
            // Algorithm should be loop to all(who doesn't have the individual restriction) the individualBucketCheck
            // and get the amount that was transacted till now.
            // Calculate the sum of that amount + new txn amount and compare with allowed percentage or fixed amount
            // amount of tokens
            if (_bucketDetails.timestamps.length == 0) {
                _fromTimestamp = globalRestriction.startTime;
            } else {
                _fromTimestamp = _bucketDetails.timestamps[_bucketDetails.timestamps.length - 1];
            }
            return _bucketCheck(
                _fromTimestamp,
                BokkyPooBahsDateTimeLibrary.diffDays(_fromTimestamp, now),
                _from,
                _amount,
                _isTransfer,
                Scope.Global,
                globalRestriction
            );
        } else {
            return Result.NA;
        }
    }

    function _bucketCheck(
        uint256 _fromTime,
        uint256 _diffDays,
        address _from,
        uint256 _amount,
        bool _isTransfer,
        Scope _scope,
        VolumeRestriction _restriction
    )
        internal
        returns (Result)
    {
        BucketDetails memory _bucketDetails = bucketToUser[_from];
        uint256[] memory passedTimestamps = new uint256[](_diffDays);
        // using the existing memory variable instead of creating new one (avoiding stack too deep error)
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
                    // Subtracting the former value(Sum of all the txn amount of that day) from the sumOfLastPeriod
                    _bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.
                    sub(bucket[_from][_bucketDetails.timestamps[counter.sub(_restriction.rollingPeriodInDays)]]);
                }

                // Adding the last amount that is transacted on the _fromTime
                //_bucketDetails.sumOfLastPeriod = _bucketDetails.sumOfLastPeriod.add(uint256(0));
                // Storing all those timestamps whose total transacted value is 0
                passedTimestamps[i] = _fromTime;
                counter++;
            }
        }
        if (_scope == Scope.Global) {
            i = _getTotalSumOfLastPeriod(_bucketDetails.sumOfLastPeriod, _from);
        } else {
            i = _bucketDetails.sumOfLastPeriod;
        }
        if (_checkValidAmountToTransact(i, _amount, _restriction)) {
            if (_isTransfer) {
                _updateStorage(
                    passedTimestamps,
                    _from,
                    _fromTime,
                    _amount,
                    _diffDays,
                    _scope,
                    _bucketDetails.sumOfLastPeriod
                );
            }
            return Result.NA;
        } 
        return Result.INVALID;
    }

    function _getTotalSumOfLastPeriod(uint256 _sumOfuser, address _from) internal view returns(uint256 globalSumOfLastPeriod) {
        for (uint256 i = 0; i < globalUsers.length; i++) {
            if (globalUsers[i] == _from) {
                globalSumOfLastPeriod.add(_sumOfuser);
            } else {
               uint256 _latestTimestampIndex = bucketToUser[globalUsers[i]].timestamps.length - 1;
               uint256 _latestTimestamp = bucketToUser[globalUsers[i]].timestamps[_latestTimestampIndex];
               if (BokkyPooBahsDateTimeLibrary.diffDays(_latestTimestamp, now) < globalRestriction.rollingPeriodInDays)
                    globalSumOfLastPeriod.add(bucketToUser[globalUsers[i]].sumOfLastPeriod);
            }
        }
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

    function _updateStorage(
        uint256[] passedTimestamps,
        address _from,
        uint256 _fromTime,
        uint256 _amount,
        uint256 _diffDays,
        Scope _scope,
        uint256 _sumOfLastPeriod
    )
        internal 
    {
        if (bucketToUser[_from].timestamps.length == 0 && _scope == Scope.Global) {
            globalUsers.push(_from);
        }
        if (_diffDays != 0) {
            for (uint256 i = 0; i < passedTimestamps.length; i++) {
                // Assigning the sum of transacted amount on the passed day
                // bucket[_from][passedTimestamps[i]] = 0;
                // To save gas by not assigning a memory timestamp array to storage timestamp array.
                bucketToUser[_from].timestamps.push(passedTimestamps[i]);
            }
        }
        // This condition is the works only when the transaction performed just after the startTime (_diffDays == 0)
        if (bucketToUser[_from].timestamps.length == 0) {
            bucketToUser[_from].timestamps.push(_fromTime);
        }
        bucketToUser[_from].sumOfLastPeriod = _sumOfLastPeriod.add(_amount);

        // Re-using the local variable to avoid stack too deep error
        _fromTime = bucketToUser[_from].timestamps[bucketToUser[_from].timestamps.length -1];
        bucket[_from][_fromTime] = bucket[_from][_fromTime].add(_amount);
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

    function getBucketDetailsToUser(address _user) external view returns(uint256[], uint256) {
        return(
            bucketToUser[_user].timestamps,
            bucketToUser[_user].sumOfLastPeriod
        );
    }

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
