pragma solidity ^0.4.24;

import "./../../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract LockupVolumeRestrictionTM is ITransferManager {

    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    // a per-user lockup
    struct LockUp {
        uint256 lockupAmount; // Amount to be locked
        uint256 startTime; // when this lockup starts (seconds)
        uint256 lockUpPeriodSeconds; // total period of lockup (seconds)
        uint256 releaseFrequencySeconds; // how often to release a tranche of tokens (seconds)
    }

    // maps user addresses to an array of lockups for that user
    mapping (address => LockUp[]) internal lockUps;

    event AddNewLockUp(
        address indexed userAddress,
        uint256 lockupAmount,
        uint256 startTime,
        uint256 lockUpPeriodSeconds,
        uint256 releaseFrequencySeconds,
        uint256 indexed lockupIndex
    );

    event RemoveLockUp(
        address indexed userAddress,
        uint256 indexed lockupIndex
    );

    event ModifyLockUp(
        address indexed userAddress,
        uint256 lockupAmount,
        uint256 startTime,
        uint256 lockUpPeriodSeconds,
        uint256 releaseFrequencySeconds,
        uint256 indexed lockupIndex
    );

    event ChangeLockupIndex(
        address indexed _userAddress,
        uint256 indexed _oldLockupIndex,
        uint256 indexed _newLockupIndex,
        uint256 _timestamp
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

    /** @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bytes /* _data */, bool /*_isTransfer*/) public returns(Result) {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && lockUps[_from].length != 0) {  
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount);
        }
        return Result.NA;
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockupAmount Amount of tokens that need to lock.
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     */
    function addLockUp(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    ) 
        public 
        withPerm(ADMIN)
    {   
        /*solium-disable-next-line security/no-block-members*/
        require(_startTime >= now, "start time is in past");
        _checkLockUpParams(_userAddress, _lockupAmount, _lockUpPeriodSeconds, _releaseFrequencySeconds);

        lockUps[_userAddress].push(LockUp(_lockupAmount, _startTime, _lockUpPeriodSeconds, _releaseFrequencySeconds));

        emit AddNewLockUp(
            _userAddress,
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            lockUps[_userAddress].length -1
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param _userAddresses Array of address of the user whose tokens should be locked up
     * @param _lockupAmounts Array of the amounts that need to be locked for the different addresses.
     * @param _startTimes Array of When this lockup starts (seconds)
     * @param _lockUpPeriodsSeconds Array of total periods of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     */
    function addLockUpMulti(
        address[] _userAddresses,
        uint256[] _lockupAmounts,
        uint256[] _startTimes,
        uint256[] _lockUpPeriodsSeconds,
        uint256[] _releaseFrequenciesSeconds
    ) 
        external
        withPerm(ADMIN)
    {
        require(
            _userAddresses.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _lockupAmounts.length,
            "Input array length mismatch"
        );

        for (uint i = 0; i < _userAddresses.length; i++) {
            addLockUp(_userAddresses[i], _lockupAmounts[i], _startTimes[i], _lockUpPeriodsSeconds[i], _releaseFrequenciesSeconds[i]);
        }

    }

    /**
     * @notice Lets the admin remove a user's lock up
     * @param _userAddress Address of the user whose tokens are locked up
     * @param _lockupIndex Index of the lockup need to be removed.
     */
    function removeLockUp(address _userAddress, uint256 _lockupIndex) public withPerm(ADMIN) {
        require(lockUps[_userAddress].length > _lockupIndex, "Invalid index");
        LockUp[] storage userLockup = lockUps[_userAddress];

        emit RemoveLockUp(
            _userAddress,
            _lockupIndex
        );

        if (_lockupIndex != userLockup.length - 1) {
            // move the last element in the array into the index that is desired to be removed.
            userLockup[_lockupIndex] = userLockup[userLockup.length - 1];
            /*solium-disable-next-line security/no-block-members*/
            emit ChangeLockupIndex(_userAddress, userLockup.length - 1, _lockupIndex, now);
        }
        userLockup.length--;
    }

    /**
     * @notice Use to remove the lockup for multiple users
     * @param _userAddresses Array of addresses of the user whose tokens are locked up
     * @param _lockupIndexes Array of the indexes to the lockup that needs to be removed. 
     */
    function removeLockUpMulti(address[] _userAddresses, uint256[] _lockupIndexes) external withPerm(ADMIN) {
        require(_userAddresses.length == _lockupIndexes.length, "Array length mismatch");
        for (uint i = 0; i < _userAddresses.length; i++) {
            removeLockUp(_userAddresses[i], _lockupIndexes[i]);
        }
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockupAmount Amount of tokens that needs to be locked
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupIndex Index of the lockup that needs to be modified.
     */
    function modifyLockUp(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        uint256 _lockupIndex
    ) 
        public 
        withPerm(ADMIN) 
    {
        require(lockUps[_userAddress].length > _lockupIndex, "Invalid index");
        
        // Get the lockup from the master list and edit it
        LockUp[] storage userLockup = lockUps[_userAddress];
        // If _startTime is equal to the previous startTime then it only allow to modify 
        // when there is no tokens gets unlocked from the lockup 
        if (_startTime == userLockup[_lockupIndex].startTime) {
            require(_getUnlockedAmountForLockup(userLockup, _lockupIndex) == uint256(0));
        } else {
            /*solium-disable-next-line security/no-block-members*/
            require(_startTime >= now, "start time is in past");
        }
        _checkLockUpParams(
            _userAddress,
            _lockupAmount,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );

        userLockup[_lockupIndex] =  LockUp(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );
        
        emit ModifyLockUp(
            _userAddress,
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupIndex
        );
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a multiple address.
     * @param _userAddresses Array of address of the user whose tokens should be locked up
     * @param _lockupAmounts Array of the amount of tokens that needs to be locked for the respective addresses.
     * @param _startTimes Array of the start time of the lockups (seconds)
     * @param _lockUpPeriodsSeconds Array of unix timestamp for the list of lockups (seconds).
     * @param _releaseFrequenciesSeconds How often to release a tranche of tokens (seconds)
     * @param _lockupIndexes Array of the lockup indexes that needs to be modified 
     */
    function modifyLockUpMulti(
        address[] _userAddresses,
        uint256[] _lockupAmounts,
        uint256[] _startTimes,
        uint256[] _lockUpPeriodsSeconds,
        uint256[] _releaseFrequenciesSeconds,
        uint256[] _lockupIndexes
    ) public withPerm(ADMIN) {
        require(
            _userAddresses.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _lockupAmounts.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _lockupIndexes.length,
            "Input array length mismatch"
        );
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            modifyLockUp(
                _userAddresses[i],
                _lockupAmounts[i],
                _startTimes[i],
                _lockUpPeriodsSeconds[i],
                _releaseFrequenciesSeconds[i],
                _lockupIndexes[i]
            );
        }
    }

    /**
     * @notice Get the length of the lockups array for a specific user address
     * @param _userAddress Address of the user whose tokens should be locked up
     */
    function getLockUpsLength(address _userAddress) public view returns (uint) {
        return lockUps[_userAddress].length;
    }

    /**
     * @notice Get a specific element in a user's lockups array given the user's address and the element index
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockUpIndex The index of the LockUp to edit for the given userAddress
     */
    function getLockUp( address _userAddress, uint _lockUpIndex) public view returns (
        uint256 lockupAmount,
        uint256 startTime,
        uint256 lockUpPeriodSeconds,
        uint256 releaseFrequencySeconds,
        uint256 unlockedAmount
    ) {
        require(lockUps[_userAddress].length > _lockUpIndex, "Invalid index");
        LockUp[] memory userLockup = lockUps[_userAddress];
        return (
            userLockup[_lockUpIndex].lockupAmount,
            userLockup[_lockUpIndex].startTime,
            userLockup[_lockUpIndex].lockUpPeriodSeconds,
            userLockup[_lockUpIndex].releaseFrequencySeconds,
            _getUnlockedAmountForLockup(userLockup, _lockUpIndex)
        );
    }

    /**
     * @notice Checks whether the transfer is allowed
     * @param _userAddress Address of the user whose lock ups should be checked
     * @param _amount Amount of tokens that need to transact
     */
    function _checkIfValidTransfer(address _userAddress, uint256 _amount) internal view returns (Result) {
        LockUp[] memory userLockup = lockUps[_userAddress];
        uint256 totalRemainingLockedAmount = 0;
        for (uint256 i = 0; i < userLockup.length; i++) {
            // Find out the remaining locked amount for a given lockup
            uint256 remainingLockedAmount = userLockup[i].lockupAmount.sub(_getUnlockedAmountForLockup(userLockup, i));
            // aggregating all the remaining locked amount for all the lockups for a given address
            totalRemainingLockedAmount = totalRemainingLockedAmount.add(remainingLockedAmount);
        }
        // Present balance of the user
        uint256 currentBalance = ISecurityToken(securityToken).balanceOf(_userAddress);
        if ((currentBalance.sub(_amount)) >= totalRemainingLockedAmount) {
            return Result.VALID;
        }
        return Result.INVALID;
    }

    /**
     * @notice Provide the unlock amount for the given lockup for a particular user
     */
    function _getUnlockedAmountForLockup(LockUp[] userLockup, uint256 _lockupIndex) internal view returns (uint256) {
            // Calculate the no. of periods for a lockup 
            uint256 noOfPeriods = (userLockup[_lockupIndex].lockUpPeriodSeconds).div(userLockup[_lockupIndex].releaseFrequencySeconds);
            // Calculate the transaction time lies in which period
            uint256 elapsedPeriod = (now.sub(userLockup[_lockupIndex].startTime)).div(userLockup[_lockupIndex].releaseFrequencySeconds);
            // Calculate the allowed unlocked amount per period
            uint256 amountPerPeriod = (userLockup[_lockupIndex].lockupAmount).div(noOfPeriods);
            // Find out the unlocked amount for a given lockup
            uint256 unLockedAmount = elapsedPeriod.mul(amountPerPeriod);
            return unLockedAmount;
    }

    /**
     * @notice Parameter checking function for creating or editing a lockup.  This function will cause an exception if any of the parameters are bad.
     * @param _userAddress Address whom lockup is being applied
     * @param _lockupAmount Amount that needs to be locked
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     */
    function _checkLockUpParams(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    ) 
        internal 
        view 
    {   
        require(_userAddress != address(0), "Invalid address");
        require(_lockUpPeriodSeconds != 0, "lockUpPeriodSeconds cannot be zero");
        require(_releaseFrequencySeconds != 0, "releaseFrequencySeconds cannot be zero");

        // check that the total amount to be released isn't too granular
        require(
            _lockupAmount % ISecurityToken(securityToken).granularity() == 0,
            "The total amount to be released is more granular than allowed by the token"
        );

        // check that releaseFrequencySeconds evenly divides lockUpPeriodSeconds
        require(
            _lockUpPeriodSeconds % _releaseFrequencySeconds == 0,
            "lockUpPeriodSeconds must be evenly divisible by releaseFrequencySeconds"
        );

        // make sure the amount to be released per period is not too granular for the token
        uint256 totalPeriods = _lockUpPeriodSeconds.div(_releaseFrequencySeconds);
        uint256 amountPerPeriod = _lockupAmount.div(totalPeriods);
        require(
            amountPerPeriod % ISecurityToken(securityToken).granularity() == 0,
            "The amount to be released per period is more granular than allowed by the token"
        );
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
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
