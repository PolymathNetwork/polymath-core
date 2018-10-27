pragma solidity ^0.4.24;

import "./../../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract LockupVolumeRestrictionTM is ITransferManager {

    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    // a per-user lockup
    struct LockUp {
        uint lockUpPeriodSeconds; // total period of lockup (seconds)
        uint releaseFrequencySeconds; // how often to release a tranche of tokens (seconds)
        uint startTime; // when this lockup starts (seconds)
        uint alreadyWithdrawn; // amount already withdrawn for this lockup
    }

    // maps user addresses to an array of lockups for that user
    mapping (address => LockUp) internal lockUps;

    event AddNewLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime
    );

    event RemoveLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime
    );

    event ModifyLockUp(
        address indexed userAddress,
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime
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
        if (!paused && _from != address(0) && lockUps[_from].startTime != 0) {
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount, _isTransfer);
        }
        return Result.NA;
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _startTime When this lockup starts (seconds)
     */
    function addLockUp(
        address _userAddress,
        uint _lockUpPeriodSeconds,
        uint _releaseFrequencySeconds,
        uint _startTime
        ) public withPerm(ADMIN) {
        uint256 startTime = _startTime;
        _checkLockUpParams(_userAddress, _lockUpPeriodSeconds, _releaseFrequencySeconds, 0);

        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            /*solium-disable-next-line security/no-block-members*/
            startTime = now;
        }

        lockUps[_userAddress] = LockUp(_lockUpPeriodSeconds, _releaseFrequencySeconds, startTime, 0);

        emit AddNewLockUp(
            _userAddress,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            startTime
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param _userAddresses Array of address of the user whose tokens should be locked up
     * @param _lockUpPeriodsSeconds Array of total periods of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param _startTimes Array of When this lockup starts (seconds)
     */
    function addLockUpMulti(
        address[] _userAddresses,
        uint[] _lockUpPeriodsSeconds,
        uint[] _releaseFrequenciesSeconds,
        uint[] _startTimes
        ) external withPerm(ADMIN) {
        require(
            _userAddresses.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _startTimes.length,
            "Input array length mismatch"
        );

        for (uint i = 0; i < _userAddresses.length; i++) {
            addLockUp(_userAddresses[i], _lockUpPeriodsSeconds[i], _releaseFrequenciesSeconds[i], _startTimes[i]);
        }

    }

    /**
     * @notice Lets the admin remove a user's lock up
     * @param _userAddress Address of the user whose tokens are locked up
     */
    function removeLockUp(address _userAddress) public withPerm(ADMIN) {


        LockUp memory toRemove = lockUps[_userAddress];

        emit RemoveLockUp(
            _userAddress,
            toRemove.lockUpPeriodSeconds,
            toRemove.releaseFrequencySeconds,
            toRemove.startTime
        );

        delete lockUps[_userAddress];
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _startTime When this lockup starts (seconds)
     */
    function modifyLockUp(
        address _userAddress,
        uint _lockUpPeriodSeconds,
        uint _releaseFrequencySeconds,
        uint _startTime
        ) public withPerm(ADMIN) {

        uint256 startTime = _startTime;
        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            /*solium-disable-next-line security/no-block-members*/
            startTime = now;
        }

        _checkLockUpParams(
            _userAddress,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            lockUps[_userAddress].alreadyWithdrawn
        );

        // Get the lockup from the master list and edit it
        lockUps[_userAddress] = LockUp(
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            startTime,
            lockUps[_userAddress].alreadyWithdrawn
        );

        emit ModifyLockUp(
            _userAddress,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            startTime
        );
    }


    /**
     * @notice Get a specific element in a user's lockups array given the user's address and the element index
     * @param _userAddress Address of the user whose tokens should be locked up
     */
    function getLockUp(address _userAddress)
        public view returns (
        uint lockUpPeriodSeconds,
        uint releaseFrequencySeconds,
        uint startTime,
        uint alreadyWithdrawn
        ) {
        return (
            lockUps[_userAddress].lockUpPeriodSeconds,
            lockUps[_userAddress].releaseFrequencySeconds,
            lockUps[_userAddress].startTime,
            lockUps[_userAddress].alreadyWithdrawn
        );
    }

    /**
     * @notice Takes a userAddress as input, and returns a uint that represents the number of tokens allowed to be withdrawn right now
     * @param userAddress Address of the user whose lock ups should be checked
     */
    function _checkIfValidTransfer(address userAddress, uint amount, bool isTransfer) internal returns (Result) {


        uint alreadyWithdrawn = lockUps[userAddress].alreadyWithdrawn;
        uint userBalance = ISecurityToken(securityToken).balanceOf(userAddress);
        uint totalAmount = alreadyWithdrawn.add(userBalance);
        // lockup is active. calculate how many to allow to be withdrawn right now
        // calculate how many periods have elapsed already
        /*solium-disable-next-line security/no-block-members*/
        uint elapsedPeriods = (now.sub(lockUps[userAddress].startTime)).div(lockUps[userAddress].releaseFrequencySeconds);
        // calculate the total number of periods, overall
        uint totalPeriods = lockUps[userAddress].lockUpPeriodSeconds.div(lockUps[userAddress].releaseFrequencySeconds);
        uint amountPerPeriod = totalAmount.div(totalPeriods);
        // calculate the number of tokens that should be released,
        // multiplied by the number of periods that have elapsed already
        // and add it to the total tokenSums[0]
        uint allowedAmount = amountPerPeriod.mul(elapsedPeriods).sub(lockUps[userAddress].alreadyWithdrawn);


        if (amount <= allowedAmount || // transfer is allowed
            now >= lockUps[userAddress].startTime.add(lockUps[userAddress].lockUpPeriodSeconds) || // lockup is expired
            now < lockUps[userAddress].startTime) { // lockup hasn't started yet
            // transfer is valid and will succeed.
            if (!isTransfer) {
                // if this isn't a real transfer, don't subtract the withdrawn amounts from the lockups.  it's a "read only" txn
                return Result.VALID;
            }

            // we are going to write the withdrawn balances back to the lockups, so make sure that the person calling this function is the securityToken itself, since its public
            require(msg.sender == securityToken, "Sender is not securityToken");

            lockUps[userAddress].alreadyWithdrawn = lockUps[userAddress].alreadyWithdrawn.add(amount);

            return Result.VALID;
        }
    }


    /**
     * @notice Parameter checking function for creating or editing a lockup.  This function will cause an exception if any of the parameters are bad.
     * @param lockUpPeriodSeconds Total period of lockup (seconds)
     * @param releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     */
    function _checkLockUpParams(address userAddress, uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint alreadyWithdrawn) internal view {
        require(lockUpPeriodSeconds != 0, "lockUpPeriodSeconds cannot be zero");
        require(releaseFrequencySeconds != 0, "releaseFrequencySeconds cannot be zero");

        uint userBalance = ISecurityToken(securityToken).balanceOf(userAddress);
        uint totalAmount = alreadyWithdrawn.add(userBalance);


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
