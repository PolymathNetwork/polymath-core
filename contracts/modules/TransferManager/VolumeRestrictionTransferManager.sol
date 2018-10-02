pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "../../tokens/SecurityToken.sol";
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
        uint alreadyWithdrawn; // amount already withdrawn for this lockup
    }

    // maps user addresses to an array of lockups for that user
    mapping (address => LockUp[]) internal lockUps;

    event AddNewLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount
    );

    event RemoveLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount
    );

    event ModifyLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount
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
     */
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bool /* _isTransfer */) public returns(Result) {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && lockUps[_from].length != 0) {
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount);
        }
        return Result.NA;
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param userAddress Address of the user whose tokens should be locked up
     * @param lockUpPeriodSeconds Total period of lockup (seconds)
     * @param releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param startTime When this lockup starts (seconds)
     * @param totalAmount Total amount of locked up tokens
     */
    function addLockUp(address userAddress, uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) public withPerm(ADMIN) {

        _checkLockUpParams(lockUpPeriodSeconds, releaseFrequencySeconds, totalAmount);

        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            startTime = now;
        }

        lockUps[userAddress].push(LockUp(lockUpPeriodSeconds, releaseFrequencySeconds, startTime, totalAmount));

        emit AddNewLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param userAddresses Array of address of the user whose tokens should be locked up
     * @param lockUpPeriodsSeconds Array of total periods of lockup (seconds)
     * @param releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param startTimes Array of When this lockup starts (seconds)
     * @param totalAmounts Array of total amount of locked up tokens
     */
    function addLockUpMulti(address[] userAddresses, uint[] lockUpPeriodsSeconds, uint[] releaseFrequenciesSeconds, uint[] startTimes, uint[] totalAmounts) external withPerm(ADMIN) {

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

    /**
     * @notice Lets the admin remove a user's lock up
     * @param userAddress Address of the user whose tokens are locked up
     * @param lockUpIndex The index of the LockUp to remove for the given userAddress
     */
    function removeLockUp(address userAddress, uint lockUpIndex) public withPerm(ADMIN) {
        LockUp[] storage userLockUps = lockUps[userAddress];
        require(lockUpIndex < userLockUps.length, "Array out of bounds exception");

        LockUp memory toRemove = userLockUps[lockUpIndex];

        emit RemoveLockUp(
            userAddress,
            toRemove.lockUpPeriodSeconds,
            toRemove.releaseFrequencySeconds,
            toRemove.startTime,
            toRemove.totalAmount
        );

        if (lockUpIndex < userLockUps.length - 1) {
            // move the last element in the array into the index that is desired to be removed.
            userLockUps[lockUpIndex] = userLockUps[userLockUps.length - 1];
        }
        // delete the last element
        userLockUps.length--;

        if (userLockUps.length == 0) {
            // we removed the last lock up for the user.  reset their alreadyWithdrawn amount
            alreadyWithdrawn[userAddress] = 0;
        }
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a given address.
     * @param userAddress Address of the user whose tokens should be locked up
     * @param lockUpIndex The index of the LockUp to edit for the given userAddress
     * @param lockUpPeriodSeconds Total period of lockup (seconds)
     * @param releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param startTime When this lockup starts (seconds)
     * @param totalAmount Total amount of locked up tokens
     */
    function modifyLockUp(address userAddress, uint lockUpIndex, uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) public withPerm(ADMIN) {
        require(lockUpIndex < lockUps[userAddress].length, "Array out of bounds exception");

        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            startTime = now;
        }

        _checkLockUpParams(lockUpPeriodSeconds, releaseFrequencySeconds, totalAmount);

        // Get the lockup from the master list and edit it
        lockUps[userAddress][lockUpIndex] = LockUp(lockUpPeriodSeconds, releaseFrequencySeconds, startTime, totalAmount);

        emit ModifyLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount
        );
    }

    /**
     * @notice Get the length of the lockups array for a specific user address
     * @param userAddress Address of the user whose tokens should be locked up
     */
    function getLockUpsLength(address userAddress) public view returns (uint) {
        return lockUps[userAddress].length;
    }

    /**
     * @notice Get a specific element in a user's lockups array given the user's address and the element index
     * @param userAddress Address of the user whose tokens should be locked up
     * @param lockUpIndex The index of the LockUp to edit for the given userAddress
     */
    function getLockUp(address userAddress, uint lockUpIndex) public view returns (uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount) {
        require(lockUpIndex < lockUps[userAddress].length, "Array out of bounds exception");
        LockUp storage userLockUp = lockUps[userAddress][lockUpIndex];
        return (
            userLockUp.lockUpPeriodSeconds,
            userLockUp.releaseFrequencySeconds,
            userLockUp.startTime,
            userLockUp.totalAmount
        );
    }

    function getAlreadyWithdrawn(address userAddress) public view returns (uint) {
        return alreadyWithdrawn[userAddress];
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

    /**
     * @notice Takes a userAddress as input, and returns a uint that represents the number of tokens allowed to be withdrawn right now
     * @param userAddress Address of the user whose lock ups should be checked
     */
    function _checkIfValidTransfer(address userAddress, uint amount) internal view returns (Result) {
        // get lock up array for this user
        LockUp[] storage userLockUps = lockUps[userAddress];

        // maps the index of userLockUps to the amount allowed
        mapping (uint => uint) allowedAmountPerLockup;

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

            uint allowedAmountForThisLockup = 0;

            // check if lockup has entirely passed
            if (now >= aLockUp.startTime.add(aLockUp.lockUpPeriodSeconds)) {
                // lockup has passed, or not started yet.  allow all.
                allowedAmountForThisLockup = aLockUp.totalAmount.sub(aLockUp.alreadyWithdrawn);
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
                allowedAmountForThisLockup = amountPerPeriod.mul(elapsedPeriods).sub(aLockUp.alreadyWithdrawn)

            }
            allowedSum = allowedSum.add(allowedAmountForThisLockup);
            allowedAmountPerLockup[i] = allowedAmountForThisLockup
        }

        if (amount <= allowedSum) {
            // transfer is valid and will succeed.  probably.

            // subtract amounts so they are now known to be withdrawen
            for (uint i = 0; i < userLockUps.length; i++) {
                LockUp storage aLockUp = userLockUps[i];
                if (allowedAmountPerLockup[i] >= allowedSum) {
                    addLockUp.alreadyWithdrawn = addLockUp.alreadyWithdrawn.add(allowedSum);
                    // we withdrew the entire allowedSum from the lockup.  We are done.
                    break;
                } else {
                    // we have to split the allowedSum across mutiple lockUps
                    addLockUp.alreadyWithdrawn = addLockUp.alreadyWithdrawn.add(allowedAmountPerLockup[i]);
                    // subtract the amount withdrawn from this lockup
                    allowedSum = allowedSum.sub(allowedAmountPerLockup[i]);
                }

            }
            return Result.VALID;
        }

        return Result.INVALID;
    }

    /**
     * @notice Parameter checking function for creating or editing a lockup.  This function will cause an exception if any of the parameters are bad.
     * @param lockUpPeriodSeconds Total period of lockup (seconds)
     * @param releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param totalAmount Total amount of locked up tokens
     */
    function _checkLockUpParams(uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint totalAmount) internal {
        require(lockUpPeriodSeconds != 0, "lockUpPeriodSeconds cannot be zero");
        require(releaseFrequencySeconds != 0, "releaseFrequencySeconds cannot be zero");
        require(totalAmount != 0, "totalAmount cannot be zero");

        // check that the total amount to be released isn't too granular
        require(
            totalAmount % SecurityToken(securityToken).granularity() == 0,
            "The total amount to be released is more granular than allowed by the token"
        );

        // check that releaseFrequencySeconds evenly divides lockUpPeriodSeconds
        require(
            lockUpPeriodSeconds % releaseFrequencySeconds == 0,
            "lockUpPeriodSeconds must be evenly divisible by releaseFrequencySeconds"
        );

        // check that totalPeriods evenly divides totalAmount
        uint totalPeriods = lockUpPeriodSeconds.div(releaseFrequencySeconds);
        require(
            totalAmount % totalPeriods == 0,
            "The total amount being locked up must be evenly divisible by the number of total periods"
        );

        // make sure the amount to be released per period is not too granular for the token
        uint amountPerPeriod = totalAmount.div(totalPeriods);
        require(
            amountPerPeriod % SecurityToken(securityToken).granularity() == 0,
            "The amount to be released per period is more granular than allowed by the token"
        );
    }
}