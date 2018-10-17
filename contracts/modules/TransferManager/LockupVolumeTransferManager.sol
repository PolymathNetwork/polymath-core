pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract LockupVolumeTransferManager is ITransferManager {

    using SafeMath for uint256;
    
    bytes32 public constant ADMIN = "ADMIN";
    
    struct LockUp {
        uint startTime;
        uint lockUpPeriod;
        uint releaseFrequency;        
        uint lockUpAmount;
    }
    
    event AddLockUp (
        address indexed investor,
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,
        uint lockUpAmount,
        uint indexed addedIndex
    );

    event ModifyLockUp(
        address investor,
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,        
        uint lockUpAmount,        
        uint indexed modifiedIndex
    );

    event RemoveLockUp(
        address investor,
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,            
        uint lockUpAmount,
        uint indexed removedIndex
    );

    mapping (address => LockUp[]) internal investorToLockUps;

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

        if (!paused && _from != address(0)) {            
            uint currentLockUp = _getInvestorCurrentLockUpAmount(_from);
            uint currentBalance = ISecurityToken(securityToken).balanceOf(_from);
            uint currentAllowTransfer = currentBalance.sub(currentLockUp);

            if ( currentAllowTransfer >= _amount) {
                if(!_isTransfer){
                    return Result.VALID;
                }                
                require(msg.sender == securityToken, "Sender is not securityToken");                
                return Result.VALID;
            }            
            return Result.INVALID;
        }        
        return Result.NA;
    }

    /**
     * @notice get total lock for one specific investor
     * @param _investor address of investor
     */
    function _getInvestorCurrentLockUpAmount(address _investor) internal returns(uint) {        
        uint investorCurrentLockUpAmount = 0;

        for (uint i = 0; i < investorToLockUps[_investor].length; i++) {            
            LockUp storage aLockUp = investorToLockUps[_investor][i];            
            // if already end of lockup
            uint currentLockUpAmount = 0;

            // lockup not yet start
            if (now <= aLockUp.startTime) {                
                currentLockUpAmount = aLockUp.lockUpAmount;                
            }

            // inside valid lockup time
            if (now > aLockUp.startTime && now < aLockUp.startTime.add(aLockUp.lockUpPeriod)) {
                // calculate current amount is locked from this lockup
                uint elepsedPeriods = now.sub(aLockUp.startTime).div(aLockUp.releaseFrequency);
                uint totalPeriods = aLockUp.lockUpPeriod.div(aLockUp.releaseFrequency);
                uint amountPerPeriod = aLockUp.lockUpAmount.div(totalPeriods);
                currentLockUpAmount = totalPeriods.sub(elepsedPeriods).mul(amountPerPeriod);
            }

            // calculate current total lock for specific investor
            investorCurrentLockUpAmount = investorCurrentLockUpAmount.add(currentLockUpAmount);
        }        
        return investorCurrentLockUpAmount;
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param _investor Address of the user whose tokens should be locked up
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriod Total period of lockup (seconds)
     * @param _releaseFrequency How often to release a tranche of tokens (seconds)
     * @param _lockUpAmount Total amount of locked up tokens
     */
    function addLockUp(
        address _investor,
        uint _startTime,
        uint _lockUpPeriod,
        uint _releaseFrequency,
        uint _lockUpAmount
        )
        public
        withPerm(ADMIN)
    {        
        _checkLockUpParams(_lockUpPeriod, _releaseFrequency, _lockUpAmount);

        uint256 startTime = _startTime;
        if (_startTime == 0) {
            startTime = now;
        }

        LockUp memory newLockUp = LockUp(startTime, _lockUpPeriod, _releaseFrequency, _lockUpAmount);
        investorToLockUps[_investor].push(newLockUp);

        emit AddLockUp(
            _investor,
            startTime,
            _lockUpPeriod,
            _releaseFrequency,
            _lockUpAmount,
            investorToLockUps[_investor].length - 1
        );
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a given address.
     * @param _investor Address of the user whose tokens should be locked up     
     * @param _lockUpIndex The index of the LockUp to edit for the given userAddress
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriod Total period of lockup (seconds)
     * @param _releaseFrequency How often to release a tranche of tokens (seconds)
     * @param _lockUpAmount Total amount of locked up tokens
     */
    function modifyLockUp(
        address _investor,
        uint _lockUpIndex,
        uint _startTime,
        uint _lockUpPeriod,
        uint _releaseFrequency,        
        uint _lockUpAmount
        ) public withPerm(ADMIN) {
        require(_lockUpIndex < investorToLockUps[_investor].length, "Array out of bounds exception");

        uint256 startTime = _startTime;
        // if a startTime of 0 is passed in, then start now.
        if (startTime == 0) {
            startTime = now;
        }

        _checkLockUpParams(_lockUpPeriod, _releaseFrequency, _lockUpAmount);

        // Get the lockup from the master list and edit it
        investorToLockUps[_investor][_lockUpIndex] = LockUp(startTime, _lockUpPeriod, _releaseFrequency, _lockUpAmount);

        emit ModifyLockUp(            
            _investor,
            startTime,
            _lockUpPeriod,
            _releaseFrequency,            
            _lockUpAmount,
            _lockUpIndex
        );
    }

    /**
     * @notice Parameter checking function for creating or editing a lockup.  This function will cause an exception if any of the parameters are bad.
     * @param _lockupPeriod Total period of lockup (seconds)
     * @param _releaseFrequency How often to release a tranche of tokens (seconds)
     * @param _lockupAmount Total amount of locked up tokens
     */
    function _checkLockUpParams(uint _lockupPeriod, uint _releaseFrequency, uint _lockupAmount) internal view {

        require(_lockupPeriod != 0, "_lockupPeriod cannot be zero");
        require(_releaseFrequency != 0, "_releaseFrequency cannot be zero");
        require(_lockupAmount != 0, "_lockupAmount cannot be zero");

        // check that the total amount to be released isn't too granular
        require(
            _lockupAmount % ISecurityToken(securityToken).granularity() == 0,
            "The total amount to be released is more granular than allowed by the token"
        );

        // check that _releaseFrequency evenly divides _lockupPeriod
        require(
            _lockupPeriod % _releaseFrequency == 0,
            "_lockupPeriod must be evenly divisible by _releaseFrequency"
        );

        // check that totalPeriods evenly divides _lockupAmount
        uint totalPeriods = _lockupPeriod.div(_releaseFrequency);
        require(
            _lockupAmount % totalPeriods == 0,
            "The total amount being locked up must be evenly divisible by the number of total periods"
        );

        // make sure the amount to be released per period is not too granular for the token
        uint amountPerPeriod = _lockupAmount.div(totalPeriods);
        require(
            amountPerPeriod % ISecurityToken(securityToken).granularity() == 0,
            "The amount to be released per period is more granular than allowed by the token"
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param _investors Array of address of the user whose tokens should be locked up
     * @param _lockUpPeriods Array of total periods of lockup (seconds)
     * @param _releaseFrequencies Array of how often to release a tranche of tokens (seconds)
     * @param _startTimes Array of When this lockup starts (seconds)
     * @param _lockUpAmounts Array of total amount of locked up tokens
     */
    function addLockUpMulti(
        address[] _investors,
        uint[] _startTimes,
        uint[] _lockUpPeriods,
        uint[] _releaseFrequencies,        
        uint[] _lockUpAmounts
        ) external withPerm(ADMIN) {
        require(
            _investors.length == _lockUpPeriods.length &&
            _investors.length == _releaseFrequencies.length &&
            _investors.length == _startTimes.length &&
            _investors.length == _lockUpAmounts.length,
            "Input array length mismatch"
        );

        for (uint i = 0; i < _investors.length; i++) {
            addLockUp(_investors[i],_startTimes[i], _lockUpPeriods[i], _releaseFrequencies[i], _lockUpAmounts[i]);
        }
    }

     /**
     * @notice Lets the admin remove a user's lock up
     * @param _investor Address of the user whose tokens are locked up
     * @param _lockUpIndex The index of the LockUp to remove for the given userAddress
     */
    function removeLockUp(address _investor, uint _lockUpIndex) public withPerm(ADMIN) {
        LockUp[] storage userLockUps = investorToLockUps[_investor];
        require(_lockUpIndex < userLockUps.length, "Array out of bounds exception");

        LockUp memory toRemove = userLockUps[_lockUpIndex];

        emit RemoveLockUp(
            _investor,
            toRemove.startTime,
            toRemove.lockUpPeriod,
            toRemove.releaseFrequency,            
            toRemove.lockUpAmount,
            _lockUpIndex
        );

        if (_lockUpIndex < userLockUps.length - 1) {
            // move the last element in the array into the index that is desired to be removed.
            userLockUps[_lockUpIndex] = userLockUps[userLockUps.length - 1];
        }
        // delete the last element
        userLockUps.length--;
    }

     /**
     * @notice Get a specific element in a user's investorToLockUps array given the user's address and the element index
     * @param _investor Address of the user whose tokens should be locked up
     * @param _lockUpIndex The index of the LockUp to edit for the given userAddress
     */
    function getLockUp(
        address _investor,
        uint _lockUpIndex)
        public view returns (
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,        
        uint lockUpAmount) 
    {
        require(_lockUpIndex < investorToLockUps[_investor].length, "Array out of bounds exception");
        LockUp storage userLockUp = investorToLockUps[_investor][_lockUpIndex];
        return (
            userLockUp.startTime,
            userLockUp.lockUpPeriod,
            userLockUp.releaseFrequency,            
            userLockUp.lockUpAmount            
        );
    }

    /**
     * @notice Get the length of the lockups array for a specific user address
     * @param _investor Address of the user whose tokens should be locked up
     */
    function getLockUpsLength(address _investor) public view returns (uint) {
        return investorToLockUps[_investor].length;
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
}
