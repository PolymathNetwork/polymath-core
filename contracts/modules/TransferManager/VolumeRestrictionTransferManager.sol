pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract VolumeRestrictionTransferManager is ITransferManager {

    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";
    
    // a per-user lockup
    struct LockUp {
        uint lockUpPeriodSeconds; // total period of lockup (seconds)
        uint releaseFrequencySeconds; // how often to release a tranche of tokens (seconds)
        uint startTime; // when this lockup starts (seconds)
        uint totalAmount; // total amount of locked up tokens
    }
    
    // maps user addresses to an array of lockups for that user
    mapping (address => LockUp[]) internal lockUps;

    enum LockUpOperationType { Add, Remove, Edit }

    event LogModifyLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount,
        LockUpOperationType indexed operationType
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

    
    /// @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bool /* _isTransfer */) public returns(Result) {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && lockUps[_from].length != 0) {
            // get total amount allowed right now
            uint allowedAmount = _currentAllowedAmount(_from);
            if (_amount <= allowedAmount) {
                return Result.VALID;
            }
            return Result.INVALID;
        }
        return Result.NA;
    }
    
    // lets the owner / admin create a volume restriction lockup.
    // takes a userAddress and lock up params, and creates a lockup for the user.  See the LockUp struct def for info on what each parameter actually is
    function addLockUp(address userAddress, uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) public withPerm(ADMIN) {
        
        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            startTime = now;
        }
        
        // Get an array of the user's lockups
        LockUp[] storage userLockUps = lockUps[userAddress];
        
        // create a new lock up and push it into the array of the user's lock ups
        LockUp memory newLockUp;
        newLockUp.lockUpPeriodSeconds = lockUpPeriodSeconds;
        newLockUp.releaseFrequencySeconds = releaseFrequencySeconds;
        newLockUp.startTime = startTime;
        newLockUp.totalAmount = totalAmount;
        userLockUps.push(newLockUp);

        emit LogModifyLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount,
            LockUpOperationType.Add
        );
    }

    // same as addLockup, but takes an array for each parameter
    function addLockUpMulti(address[] userAddresses, uint[] lockUpPeriodsSeconds, uint[] releaseFrequenciesSeconds, uint[] startTimes, uint[] totalAmounts) public withPerm(ADMIN) {
        
        // make sure input params are sane
        require(
            userAddresses.length == lockUpPeriodsSeconds.length && 
            userAddresses.length == releaseFrequenciesSeconds.length &&
            userAddresses.length == startTimes.length &&
            userAddresses.length == totalAmounts.length,
            "Input array length mis-match"
        );

        for (uint i = 0; i < userAddresses.length; i++) {
            addLockUp(userAddresses[i], lockUpPeriodsSeconds[i], releaseFrequenciesSeconds[i], startTimes[i], totalAmounts[i]);
        }

    }
    
    // remove a user's lock up
    function removeLockUp(address userAddress, uint lockUpIndex) public withPerm(ADMIN) {
        LockUp[] storage userLockUps = lockUps[userAddress];
        LockUp memory toRemove = userLockUps[lockUpIndex];

        emit LogModifyLockUp(
            userAddress,
            toRemove.lockUpPeriodSeconds,
            toRemove.releaseFrequencySeconds,
            toRemove.startTime,
            toRemove.totalAmount,
            LockUpOperationType.Remove
        );

        // move the last element in the array into the index that is desired to be removed.  
        userLockUps[lockUpIndex] = userLockUps[userLockUps.length - 1];
        // delete the last element
        userLockUps.length--;
    }

    function editLockUp(address userAddress, uint lockUpIndex, uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) public withPerm(ADMIN) {
        
        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            startTime = now;
        }
        
        // Get the lockup from the master list and edit it
        LockUp storage userLockUp = lockUps[userAddress][lockUpIndex];
        
        userLockUp.lockUpPeriodSeconds = lockUpPeriodSeconds;
        userLockUp.releaseFrequencySeconds = releaseFrequencySeconds;
        userLockUp.startTime = startTime;
        userLockUp.totalAmount = totalAmount;

        emit LogModifyLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount,
            LockUpOperationType.Edit
        );
    }
    
    // get the length of the lockups array for a specific user
    function getLockUpsLength(address userAddress) public view returns (uint) {
        return lockUps[userAddress].length;
    }
    
    // get a specific element in a user's lockups array given the user's address and the element index
    function getLockUp(address userAddress, uint lockUpIndex) public view returns (uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) {
        LockUp storage userLockUp = lockUps[userAddress][lockUpIndex];
        return (
            userLockUp.lockUpPeriodSeconds,
            userLockUp.releaseFrequencySeconds,
            userLockUp.startTime,
            userLockUp.totalAmount
        );
    }


    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Return the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    // this takes a userAddress as input, and returns a uint that represents the number of tokens allowed to be withdrawn right now
    function _currentAllowedAmount(address userAddress) internal view returns (uint) {
        // get lock up array for this user
        LockUp[] storage userLockUps = lockUps[userAddress];
        
        // we will return the total amount allowed for this user right now, across all their lock ups.
        uint allowedSum = 0;

        // save the total number of granted tokens, ever
        // so that we can subtract the already withdrawn balance from the amount to be allowed to withdraw
        uint totalSum = 0;
        
        // loop over the user's lock ups
        for (uint i = 0; i < userLockUps.length; i++) {
            LockUp storage aLockUp = userLockUps[i];

            // has lockup started yet?
            if (now < aLockUp.startTime) {
                // it has not.  don't let them transfer any tokens.
                continue;
            }

            // add total amount to totalSum
            totalSum = totalSum.add(aLockUp.totalAmount);

            // check if lockup has entirely passed
            if (now >= aLockUp.startTime.add(aLockUp.lockUpPeriodSeconds)) {
                // lockup has passed, or not started yet.  allow all.
                allowedSum = allowedSum.add(aLockUp.totalAmount);
            } else {
                // lockup is still active. calculate how many to allow to be withdrawn right now
                
                // calculate how many periods have elapsed already
                uint elapsedPeriods = (now.sub(aLockUp.startTime)).div(aLockUp.releaseFrequencySeconds);
                // calculate the total number of periods, overall
                uint totalPeriods = aLockUp.lockUpPeriodSeconds.div(aLockUp.releaseFrequencySeconds);
                // calculate how much should be released per period
                uint amountPerPeriod = aLockUp.totalAmount.div(totalPeriods);
                // calculate the number of tokens that should be released,
                // multiplied by the number of periods that have elapsed already
                // and add it to the total allowedSum
                allowedSum = allowedSum.add(amountPerPeriod.mul(elapsedPeriods));
            }
        }

        // subtract already withdrawn amount
        uint currentUserBalance = ISecurityToken(securityToken).balanceOf(userAddress);
        uint alreadyWithdrawn = totalSum.sub(currentUserBalance);
        uint allowedAmount = allowedSum.sub(alreadyWithdrawn);

        return allowedAmount;
    }
}