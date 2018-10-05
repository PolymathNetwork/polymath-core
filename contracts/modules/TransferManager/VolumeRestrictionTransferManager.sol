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
        uint alreadyWithdrawn; // amount already withdrawn for this lockup
    }

    // maps user addresses to an array of lockups for that user
    mapping (address => LockUp[]) internal lockUps;

    event AddNewLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount,
        uint indexed addedIndex
    );

    event RemoveLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount,
        uint indexed removedIndex
    );

    event ModifyLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint totalAmount,
        uint indexed modifiedIndex
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
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bytes /* _data */, bool  _isTransfer) public returns(Result) {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && lockUps[_from].length != 0) {
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount, _isTransfer);
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

        lockUps[userAddress].push(LockUp(lockUpPeriodSeconds, releaseFrequencySeconds, startTime, totalAmount, 0));

        emit AddNewLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount,
            lockUps[userAddress].length - 1
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
            toRemove.totalAmount,
            lockUpIndex
        );

        if (lockUpIndex < userLockUps.length - 1) {
            // move the last element in the array into the index that is desired to be removed.
            userLockUps[lockUpIndex] = userLockUps[userLockUps.length - 1];
        }
        // delete the last element
        userLockUps.length--;
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
        lockUps[userAddress][lockUpIndex] = LockUp(
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount,
            lockUps[userAddress][lockUpIndex].alreadyWithdrawn
        );

        emit ModifyLockUp(
            userAddress,
            lockUpPeriodSeconds,
            releaseFrequencySeconds,
            startTime,
            totalAmount,
            lockUpIndex
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
    function getLockUp(address userAddress, uint lockUpIndex) public view returns (uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount, uint alreadyWithdrawn) {
        require(lockUpIndex < lockUps[userAddress].length, "Array out of bounds exception");
        LockUp storage userLockUp = lockUps[userAddress][lockUpIndex];
        return (
            userLockUp.lockUpPeriodSeconds,
            userLockUp.releaseFrequencySeconds,
            userLockUp.startTime,
            userLockUp.totalAmount,
            userLockUp.alreadyWithdrawn
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

    /**
     * @notice Takes a userAddress as input, and returns a uint that represents the number of tokens allowed to be withdrawn right now
     * @param userAddress Address of the user whose lock ups should be checked
     */
    function _checkIfValidTransfer(address userAddress, uint amount, bool isTransfer) internal returns (Result) {
        // get lock up array for this user
        LockUp[] storage userLockUps = lockUps[userAddress];

        // maps the index of userLockUps to the amount allowed in this transfer
        uint[] memory allowedAmountPerLockup = new uint[](userLockUps.length);

        uint[3] memory tokenSums = [
            uint256(0), // allowed amount right now
            uint256(0), // total locked up, ever
            uint256(0) // already withdrawn, ever
        ];

        // loop over the user's lock ups
        for (uint i = 0; i < userLockUps.length; i++) {
            LockUp storage aLockUp = userLockUps[i];

            uint allowedAmountForThisLockup = 0;

            // check if lockup has entirely passed
            if (now >= aLockUp.startTime.add(aLockUp.lockUpPeriodSeconds)) {
                // lockup has passed, or not started yet.  allow all.
                allowedAmountForThisLockup = aLockUp.totalAmount.sub(aLockUp.alreadyWithdrawn);
            } else if (now >= aLockUp.startTime) {
                // lockup is active. calculate how many to allow to be withdrawn right now
                // calculate how many periods have elapsed already
                uint elapsedPeriods = (now.sub(aLockUp.startTime)).div(aLockUp.releaseFrequencySeconds);
                // calculate the total number of periods, overall
                uint totalPeriods = aLockUp.lockUpPeriodSeconds.div(aLockUp.releaseFrequencySeconds);
                // calculate how much should be released per period
                uint amountPerPeriod = aLockUp.totalAmount.div(totalPeriods);
                // calculate the number of tokens that should be released,
                // multiplied by the number of periods that have elapsed already
                // and add it to the total tokenSums[0]
                allowedAmountForThisLockup = amountPerPeriod.mul(elapsedPeriods).sub(aLockUp.alreadyWithdrawn);

            }
            // tokenSums[0] is allowed sum
            tokenSums[0] = tokenSums[0].add(allowedAmountForThisLockup);
            // tokenSums[1] is total locked up
            tokenSums[1] = tokenSums[1].add(aLockUp.totalAmount);
            // tokenSums[2] is total already withdrawn
            tokenSums[2] = tokenSums[2].add(aLockUp.alreadyWithdrawn);

            allowedAmountPerLockup[i] = allowedAmountForThisLockup;
        }

        // tokenSums[0] is allowed sum
        if (amount <= tokenSums[0]) {
            // transfer is valid and will succeed.
            if (!isTransfer) {
                // if this isn't a real transfer, don't subtract the withdrawn amounts from the lockups.  it's a "read only" txn
                return Result.VALID;
            }

            // we are going to write the withdrawn balances back to the lockups, so make sure that the person calling this function is the securityToken itself, since its public
            require(msg.sender == securityToken, "Sender is not securityToken");

            // subtract amounts so they are now known to be withdrawen
            for (i = 0; i < userLockUps.length; i++) {
                aLockUp = userLockUps[i];

                // tokenSums[0] is allowed sum
                if (allowedAmountPerLockup[i] >= tokenSums[0]) {
                    aLockUp.alreadyWithdrawn = aLockUp.alreadyWithdrawn.add(tokenSums[0]);
                    // we withdrew the entire tokenSums[0] from the lockup.  We are done.
                    break;
                } else {
                    // we have to split the tokenSums[0] across mutiple lockUps
                    aLockUp.alreadyWithdrawn = aLockUp.alreadyWithdrawn.add(allowedAmountPerLockup[i]);
                    // subtract the amount withdrawn from this lockup
                    tokenSums[0] = tokenSums[0].sub(allowedAmountPerLockup[i]);
                }

            }
            return Result.VALID;
        }

        return _checkIfUnlockedTokenTransferIsPossible(userAddress, amount, tokenSums[1], tokenSums[2]);
    }

    function _checkIfUnlockedTokenTransferIsPossible(address userAddress, uint amount, uint totalSum, uint alreadyWithdrawnSum) internal view returns (Result) {
        // the amount the user wants to withdraw is greater than their allowed amounts according to the lockups.  however, if the user has like, 10 tokens, but only 4 are locked up, we should let the transfer go through for those 6 that aren't locked up
        uint currentUserBalance = ISecurityToken(securityToken).balanceOf(userAddress);
        uint stillLockedAmount = totalSum.sub(alreadyWithdrawnSum);
        if (currentUserBalance >= stillLockedAmount && amount <= currentUserBalance.sub(stillLockedAmount)) {
            // the user has more tokens in their balance than are actually locked up.  they should be allowed to withdraw the difference
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
    function _checkLockUpParams(uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint totalAmount) internal view {
        require(lockUpPeriodSeconds != 0, "lockUpPeriodSeconds cannot be zero");
        require(releaseFrequencySeconds != 0, "releaseFrequencySeconds cannot be zero");
        require(totalAmount != 0, "totalAmount cannot be zero");

        // check that the total amount to be released isn't too granular
        require(
            totalAmount % ISecurityToken(securityToken).granularity() == 0,
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
            amountPerPeriod % ISecurityToken(securityToken).granularity() == 0,
            "The amount to be released per period is more granular than allowed by the token"
        );
    }
}
