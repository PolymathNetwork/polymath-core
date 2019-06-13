pragma solidity 0.5.8;

import "../../TransferManager/TransferManager.sol";
import "./LockUpTransferManagerStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

contract LockUpTransferManager is LockUpTransferManagerStorage, TransferManager {
    using SafeMath for uint256;

    event AddLockUpToUser(
        address indexed _userAddress,
        bytes32 indexed _lockupName
    );

    event RemoveLockUpFromUser(
        address indexed _userAddress,
        bytes32 indexed _lockupName
    );

    event ModifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 indexed _lockupName
    );

    event AddNewLockUpType(
        bytes32 indexed _lockupName,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    );

    event RemoveLockUpType(bytes32 indexed _lockupName);

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
     */
    function executeTransfer(address  _from, address /*_to*/, uint256  _amount, bytes calldata /*_data*/) external returns(Result) {
        (Result success,) = _verifyTransfer(_from, _amount);
        return success;
    }

    /** @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(
        address  _from,
        address /* _to*/,
        uint256  _amount,
        bytes memory /* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        return _verifyTransfer(_from, _amount);
    }

    /** @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function _verifyTransfer(
        address  _from,
        uint256  _amount
    )
        internal
        view
        returns(Result, bytes32)
    {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && userToLockups[_from].length != 0) {
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount);
        }
        return (Result.NA, bytes32(0));
    }


    /**
     * @notice Use to add the new lockup type
     * @param _lockupAmount Amount of tokens that need to lock.
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName Name of the lockup
     */
    function addNewLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
        _addNewLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Use to add the new lockup type
     * @param _lockupAmounts Array of amount of tokens that need to lock.
     * @param _startTimes Array of startTimes when this lockup starts (seconds)
     * @param _lockUpPeriodsSeconds Array of total period of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of names of the lockup
     */
    function addNewLockUpTypeMulti(
        uint256[] memory _lockupAmounts,
        uint256[] memory _startTimes,
        uint256[] memory _lockUpPeriodsSeconds,
        uint256[] memory _releaseFrequenciesSeconds,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        require(
            _lockupNames.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _lockupAmounts.length,
            "Length mismatch"
        );
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _addNewLockUpType(
                _lockupAmounts[i],
                _startTimes[i],
                _lockUpPeriodsSeconds[i],
                _releaseFrequenciesSeconds[i],
                _lockupNames[i]
            );
        }
    }

    /**
     * @notice Add the lockup to a user
     * @param _userAddress Address of the user
     * @param _lockupName Name of the lockup
     */
    function addLockUpByName(
        address _userAddress,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
        _addLockUpByName(_userAddress, _lockupName);
    }

    /**
     * @notice Add lockups to users
     * @param _userAddresses Array of addresses of the users
     * @param _lockupNames Array of names of the lockups
     */
    function addLockUpByNameMulti(
        address[] memory _userAddresses,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        _checkLengthOfArray(_userAddresses.length, _lockupNames.length);
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _addLockUpByName(_userAddresses[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockupAmount Amount of tokens that need to lock.
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName Name of the lockup
     */
    function addNewLockUpToUser(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
        _addNewLockUpToUser(
            _userAddress,
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param _userAddresses Array of address of the user whose tokens should be locked up
     * @param _lockupAmounts Array of the amounts that need to be locked for the different addresses.
     * @param _startTimes Array of When this lockup starts (seconds)
     * @param _lockUpPeriodsSeconds Array of total periods of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of names of the lockup
     */
    function addNewLockUpToUserMulti(
        address[] memory _userAddresses,
        uint256[] memory _lockupAmounts,
        uint256[] memory _startTimes,
        uint256[] memory _lockUpPeriodsSeconds,
        uint256[] memory _releaseFrequenciesSeconds,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        require(
            _userAddresses.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _lockupAmounts.length &&
            _userAddresses.length == _lockupNames.length,
            "Length mismatch"
        );
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _addNewLockUpToUser(_userAddresses[i], _lockupAmounts[i], _startTimes[i], _lockUpPeriodsSeconds[i], _releaseFrequenciesSeconds[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin remove a user's lock up
     * @param _userAddress Address of the user whose tokens are locked up
     * @param _lockupName Name of the lockup need to be removed.
     */
    function removeLockUpFromUser(address _userAddress, bytes32 _lockupName) external withPerm(ADMIN) {
        _removeLockUpFromUser(_userAddress, _lockupName);
    }

    /**
     * @notice Used to remove the lockup type
     * @param _lockupName Name of the lockup
     */
    function removeLockupType(bytes32 _lockupName) external withPerm(ADMIN) {
        _removeLockupType(_lockupName);
    }

    /**
     * @notice Used to remove the multiple lockup type
     * @param _lockupNames Array of the lockup names.
     */
    function removeLockupTypeMulti(bytes32[] memory _lockupNames) public withPerm(ADMIN) {
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _removeLockupType(_lockupNames[i]);
        }
    }

    /**
     * @notice Use to remove the lockup for multiple users
     * @param _userAddresses Array of addresses of the user whose tokens are locked up
     * @param _lockupNames Array of the names of the lockup that needs to be removed.
     */
    function removeLockUpFromUserMulti(address[] memory _userAddresses, bytes32[] memory _lockupNames) public withPerm(ADMIN) {
        _checkLengthOfArray(_userAddresses.length, _lockupNames.length);
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _removeLockUpFromUser(_userAddresses[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin modify a lockup.
     * @param _lockupAmount Amount of tokens that needs to be locked
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName name of the lockup that needs to be modified.
     */
    function modifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
        _modifyLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a multiple address.
     * @param _lockupAmounts Array of the amount of tokens that needs to be locked for the respective addresses.
     * @param _startTimes Array of the start time of the lockups (seconds)
     * @param _lockUpPeriodsSeconds Array of unix timestamp for the list of lockups (seconds).
     * @param _releaseFrequenciesSeconds How often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of the lockup names that needs to be modified
     */
    function modifyLockUpTypeMulti(
        uint256[] memory _lockupAmounts,
        uint256[] memory _startTimes,
        uint256[] memory _lockUpPeriodsSeconds,
        uint256[] memory _releaseFrequenciesSeconds,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        require(
            _lockupNames.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _lockupAmounts.length,
            "Length mismatch"
        );
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _modifyLockUpType(
                _lockupAmounts[i],
                _startTimes[i],
                _lockUpPeriodsSeconds[i],
                _releaseFrequenciesSeconds[i],
                _lockupNames[i]
            );
        }
    }

    /**
     * @notice Get a specific element in a user's lockups array given the user's address and the element index
     * @param _lockupName The name of the lockup
     */
    function getLockUp(bytes32 _lockupName) public view returns (
        uint256 lockupAmount,
        uint256 startTime,
        uint256 lockUpPeriodSeconds,
        uint256 releaseFrequencySeconds,
        uint256 unlockedAmount
    ) {
        if (lockups[_lockupName].lockupAmount != 0) {
            return (
                lockups[_lockupName].lockupAmount,
                lockups[_lockupName].startTime,
                lockups[_lockupName].lockUpPeriodSeconds,
                lockups[_lockupName].releaseFrequencySeconds,
                _getUnlockedAmountForLockup(_lockupName)
            );
        }
        return (uint256(0), uint256(0), uint256(0), uint256(0), uint256(0));
    }

    /**
     * @notice Return the data of the lockups
     */
    function getAllLockupData() external view returns(
        bytes32[] memory lockupNames,
        uint256[] memory lockupAmounts,
        uint256[] memory startTimes,
        uint256[] memory lockUpPeriodSeconds,
        uint256[] memory releaseFrequencySeconds,
        uint256[] memory unlockedAmounts
    )
    {
        uint256 length = lockupArray.length;
        lockupAmounts = new uint256[](length);
        startTimes = new uint256[](length);
        lockUpPeriodSeconds = new uint256[](length);
        releaseFrequencySeconds = new uint256[](length);
        unlockedAmounts = new uint256[](length);
        lockupNames = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            (lockupAmounts[i], startTimes[i], lockUpPeriodSeconds[i], releaseFrequencySeconds[i], unlockedAmounts[i]) = getLockUp(lockupArray[i]);
            lockupNames[i] = lockupArray[i];
        }
    }

   /**
    * @notice get the list of the users of a lockup type
    * @param _lockupName Name of the lockup type
    * @return address List of users associated with the given lockup name
    */
    function getListOfAddresses(bytes32 _lockupName) external view returns(address[] memory) {
        _validLockUpCheck(_lockupName);
        return lockupToUsers[_lockupName];
    }

    /**
     * @notice get the list of lockups names
     * @return bytes32 Array of lockups names
     */
    function getAllLockups() external view returns(bytes32[] memory) {
        return lockupArray;
    }

    /**
     * @notice get the list of the lockups for a given user
     * @param _user Address of the user
     * @return bytes32 List of lockups names associated with the given address
     */
    function getLockupsNamesToUser(address _user) external view returns(bytes32[] memory) {
        return userToLockups[_user];
    }

    /**
     * @notice Use to get the total locked tokens for a given user
     * @param _userAddress Address of the user
     * @return uint256 Total locked tokens amount
     */
    function getLockedTokenToUser(address _userAddress) public view returns(uint256) {
        _checkZeroAddress(_userAddress);
        bytes32[] memory userLockupNames = userToLockups[_userAddress];
        uint256 totalRemainingLockedAmount = 0;
        for (uint256 i = 0; i < userLockupNames.length; i++) {
            // Find out the remaining locked amount for a given lockup
            uint256 remainingLockedAmount = lockups[userLockupNames[i]].lockupAmount.sub(_getUnlockedAmountForLockup(userLockupNames[i]));
            // aggregating all the remaining locked amount for all the lockups for a given address
            totalRemainingLockedAmount = totalRemainingLockedAmount.add(remainingLockedAmount);
        }
        return totalRemainingLockedAmount;
    }

    /**
     * @notice Checks whether the transfer is allowed
     * @param _userAddress Address of the user whose lock ups should be checked
     * @param _amount Amount of tokens that need to transact
     */
    function _checkIfValidTransfer(address _userAddress, uint256 _amount) internal view returns (Result, bytes32) {
        uint256 totalRemainingLockedAmount = getLockedTokenToUser(_userAddress);
        // Present balance of the user
        uint256 currentBalance = securityToken.balanceOf(_userAddress);
        if ((currentBalance.sub(_amount)) >= totalRemainingLockedAmount) {
            return (Result.NA, bytes32(0));
        }
        return (Result.INVALID, bytes32(uint256(address(this)) << 96));
    }

    /**
     * @notice Provide the unlock amount for the given lockup for a particular user
     */
    function _getUnlockedAmountForLockup(bytes32 _lockupName) internal view returns (uint256) {
        /*solium-disable-next-line security/no-block-members*/
        if (lockups[_lockupName].startTime > now) {
            return 0;
        } else if (lockups[_lockupName].startTime.add(lockups[_lockupName].lockUpPeriodSeconds) <= now) {
            return lockups[_lockupName].lockupAmount;
        } else {
            // Calculate the no. of periods for a lockup
            uint256 noOfPeriods = (lockups[_lockupName].lockUpPeriodSeconds).div(lockups[_lockupName].releaseFrequencySeconds);
            // Calculate the transaction time lies in which period
            /*solium-disable-next-line security/no-block-members*/
            uint256 elapsedPeriod = (now.sub(lockups[_lockupName].startTime)).div(lockups[_lockupName].releaseFrequencySeconds);
            // Find out the unlocked amount for a given lockup
            uint256 unLockedAmount = (lockups[_lockupName].lockupAmount.mul(elapsedPeriod)).div(noOfPeriods);
            return unLockedAmount;
        }
    }

    function _removeLockupType(bytes32 _lockupName) internal {
        _validLockUpCheck(_lockupName);
        require(lockupToUsers[_lockupName].length == 0, "Users attached to lockup");
        // delete lockup type
        delete(lockups[_lockupName]);
        uint256 i = 0;
        for (i = 0; i < lockupArray.length; i++) {
            if (lockupArray[i] == _lockupName) {
                break;
            }
        }
        if (i != lockupArray.length -1) {
            lockupArray[i] = lockupArray[lockupArray.length -1];
        }
        lockupArray.length--;
        emit RemoveLockUpType(_lockupName);
    }

    function _modifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        /*solium-disable-next-line security/no-block-members*/
        if (_startTime == 0) {
            _startTime = now;
        }
        _checkValidStartTime(_startTime);
        _validLockUpCheck(_lockupName);
        _checkLockUpParams(
            _lockupAmount,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );

        lockups[_lockupName] =  LockUp(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );

        emit ModifyLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    function _removeLockUpFromUser(address _userAddress, bytes32 _lockupName) internal {
        _checkZeroAddress(_userAddress);
        _checkValidName(_lockupName);
        require(
            userToLockups[_userAddress][userToLockupIndex[_userAddress][_lockupName]] == _lockupName,
            "User not in lockup"
        );

        // delete the user from the lockup type
        uint256 _lockupIndex = lockupToUserIndex[_lockupName][_userAddress];
        uint256 _len = lockupToUsers[_lockupName].length;
        if ( _lockupIndex != _len - 1) {
            lockupToUsers[_lockupName][_lockupIndex] = lockupToUsers[_lockupName][_len - 1];
            lockupToUserIndex[_lockupName][lockupToUsers[_lockupName][_lockupIndex]] = _lockupIndex;
        }
        lockupToUsers[_lockupName].length--;
        // delete the user index from the lockup
        delete(lockupToUserIndex[_lockupName][_userAddress]);
        // delete the lockup from the user
        uint256 _userIndex = userToLockupIndex[_userAddress][_lockupName];
        _len = userToLockups[_userAddress].length;
        if ( _userIndex != _len - 1) {
            userToLockups[_userAddress][_userIndex] = userToLockups[_userAddress][_len - 1];
            userToLockupIndex[_userAddress][userToLockups[_userAddress][_userIndex]] = _userIndex;
        }
        userToLockups[_userAddress].length--;
        // delete the lockup index from the user
        delete(userToLockupIndex[_userAddress][_lockupName]);
        emit RemoveLockUpFromUser(_userAddress, _lockupName);
    }

    function _addNewLockUpToUser(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        _checkZeroAddress(_userAddress);
        _addNewLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
        _addLockUpByName(_userAddress, _lockupName);
    }

    function _addLockUpByName(
        address _userAddress,
        bytes32 _lockupName
    )
        internal
    {
        _checkZeroAddress(_userAddress);
        _checkValidStartTime(lockups[_lockupName].startTime);
        if(userToLockups[_userAddress].length > 0) {
            require(
                userToLockups[_userAddress][userToLockupIndex[_userAddress][_lockupName]] != _lockupName,
                "User already in lockup"
            );
        }
        userToLockupIndex[_userAddress][_lockupName] = userToLockups[_userAddress].length;
        lockupToUserIndex[_lockupName][_userAddress] = lockupToUsers[_lockupName].length;
        userToLockups[_userAddress].push(_lockupName);
        lockupToUsers[_lockupName].push(_userAddress);
        emit AddLockUpToUser(_userAddress, _lockupName);
    }

    function _addNewLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        /*solium-disable-next-line security/no-block-members*/
        if (_startTime == 0) {
            _startTime = now;
        }
        _checkValidName(_lockupName);
        require(lockups[_lockupName].lockupAmount == 0, "Already exist");
        _checkValidStartTime(_startTime);
        _checkLockUpParams(_lockupAmount, _lockUpPeriodSeconds, _releaseFrequencySeconds);
        lockups[_lockupName] = LockUp(_lockupAmount, _startTime, _lockUpPeriodSeconds, _releaseFrequencySeconds);
        lockupArray.push(_lockupName);
        emit AddNewLockUpType(_lockupName, _lockupAmount, _startTime, _lockUpPeriodSeconds, _releaseFrequencySeconds);
    }

    /**
     * @notice Parameter checking function for creating or editing a lockup.
     *  This function will cause an exception if any of the parameters are bad.
     * @param _lockupAmount Amount that needs to be locked
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     */
    function _checkLockUpParams(
        uint256 _lockupAmount,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    )
        internal
        pure
    {
        require(
            _lockUpPeriodSeconds != 0 &&
            _releaseFrequencySeconds != 0 &&
            _lockupAmount != 0,
            "Cannot be zero"
        );
    }

    function _checkValidStartTime(uint256 _startTime) internal view {
        require(_startTime >= now, "Invalid startTime or expired");
    }

    function _checkZeroAddress(address _userAddress) internal pure {
        require(_userAddress != address(0), "Invalid address");
    }

    function _validLockUpCheck(bytes32 _lockupName) internal view {
        require(lockups[_lockupName].startTime != 0, "Doesn't exist");
    }

    function _checkValidName(bytes32 _name) internal pure {
        require(_name != bytes32(0), "Invalid name");
    }

    function _checkLengthOfArray(uint256 _length1, uint256 _length2) internal pure {
        require(_length1 == _length2, "Length mismatch");
    }

    /**
     * @notice return the amount of tokens for a given user as per the partition
     * @param _partition Identifier
     * @param _tokenHolder Whom token amount need to query
     * @param _additionalBalance It is the `_value` that transfer during transfer/transferFrom function call
     */
    function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view returns(uint256){
        uint256 currentBalance = (msg.sender == address(securityToken)) ? (securityToken.balanceOf(_tokenHolder)).add(_additionalBalance) : securityToken.balanceOf(_tokenHolder);
        uint256 lockedBalance = Math.min(getLockedTokenToUser(_tokenHolder), currentBalance);
        if (paused) {
            return (_partition == UNLOCKED ? currentBalance : uint256(0));
        } else {
            if (_partition == LOCKED)
                return lockedBalance;
            else if (_partition == UNLOCKED)
                return currentBalance.sub(lockedBalance);
        }
        return uint256(0);
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
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
