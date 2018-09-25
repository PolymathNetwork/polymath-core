pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title  Transfer Manager module for restricting volume dumping within a time period for an account
 */

contract VolumeDumpingRestrictionManager is ITransferManager {
    
    using SafeMath for uint256;

    bytes32 public constant VOLUME_RESTRICTION = "VOLUME_DUMPING_RESTRICTION";
    
    // permission definition
    bytes32 public constant ADMIN = "ADMIN";
    
    //per volume restriction rule
    struct VolumeRestriction {
        uint256 percentAllowed;
        uint256 startTime;
        uint256 endTime;
        uint256 rollingPeriod;
    }

    // Maps user address to a volumerestriction rule
    mapping(address => VolumeRestriction) internal volumeRestriction;

    // Maps user address to a periodId & amount transferred so far in that periodId
    mapping(address => mapping(uint256 => uint256)) internal volumeTally;

    // map user address to a list of periodIds
    mapping(address => uint256[]) internal volumePeriodIds;
    
    event ModifyVolumeDumping (
        address indexed from, 
        uint256 percentAllowed, 
        uint256 startTime,
        uint256 endTime,
        uint256 rollingPeriod
    );

    event AddNewVolumeDumping (
        address indexed from, 
        uint256 percentAllowed, 
        uint256 startTime,
        uint256 endTime,
        uint256 rollingPeriod
    );

    event RemoveVolumeDumping (
        address indexed from, 
        uint256 percentAllowed, 
        uint256 startTime,
        uint256 endTime,
        uint256 rollingPeriod

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
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bool _isTransfer) public returns(Result) {
        
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not owner");

        if (!paused && _from != address(0)) {                
            VolumeRestriction memory userDumpingRestriction = volumeRestriction[_from];

            if (now < userDumpingRestriction.startTime || now > userDumpingRestriction.endTime){
                return Result.VALID;
            }
            
            uint256 periodId = now.div(userDumpingRestriction.rollingPeriod);

            // // the remainig transferable amount
            uint256 allowedRemainingAmount = _currentAllowedAmount(_from, periodId);

            if (_amount <= allowedRemainingAmount){
                volumeTally[_from][periodId] = volumeTally[_from][periodId].add(_amount);
                return Result.VALID;
            }
            return Result.INVALID;
        } 
        return Result.NA;
    }

    /**
    * @notice lets the admin create a volume dumping restriction for a give address.
    * @param _userAddress Address of the user to apply the volume dumping restriction
    * @param _percentAllowed Percent of tokens balance allowed to transfer within a rolling period
    * @param _startTime When the dumping restriction, 0 means now in seconds
    * @param _endTime When the dumping restriction ends in seconds
    * @param _rollingPeriod Ttime period in seconds
    */
    function addDumpingRestriction(
        address _userAddress, 
        uint256 _percentAllowed, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriod ) public withPerm(ADMIN) {

        _checkVolumeDumpingParams(_userAddress, _percentAllowed, _startTime, _endTime, _rollingPeriod);
        
        // deny if restriction already exists
        require(volumeRestriction[_userAddress].percentAllowed == 0, "volume dumping restriction already exists");
        
        // if a startTime of 0 is passed in, then start now.
        if(_startTime == 0) {
            _startTime = now;
            require(_endTime > _startTime, "End time must be greater than start time");
        }
        
        // add the volume dumping restriction
        volumeRestriction[_userAddress] = VolumeRestriction(_percentAllowed, _startTime, _endTime, _rollingPeriod);

        emit AddNewVolumeDumping(
            _userAddress,
            _percentAllowed,
            _startTime,
            _endTime,
            _rollingPeriod
        );
    }

    /**
    * @notice lets the admin create multiple volume dumping restriction for a multiple addresses.
    * @param _userAddresses Address of the user to apply the volume dumping restriction
    * @param _percentsAllowed Percent of tokens balance allowed to transfer within a rolling period
    * @param _startTimes When the dumping restriction, 0 means now in seconds
    * @param _endTimes When the dumping restriction ends in seconds
    * @param _rollingPeriods Time period in seconds
    */
    function addDumpingRestrictionMulti(
        address[] _userAddresses,
        uint256[] _percentsAllowed, 
        uint256[] _startTimes, 
        uint256[] _endTimes, 
        uint256[] _rollingPeriods) public withPerm(ADMIN) {
        require( 
            _userAddresses.length == _percentsAllowed.length &&
            _userAddresses.length == _rollingPeriods.length &&
            _userAddresses.length == _startTimes.length &&
            _userAddresses.length == _endTimes.length,
            "Input array length mis-match"
        );

        for (uint i = 0; i < _userAddresses.length; i++) {
            addDumpingRestriction(_userAddresses[i], _percentsAllowed[i], _startTimes[i], _endTimes[i], _rollingPeriods[i]);
        }
    }

     /**
    * @notice lets the admin remove a volume dumping restriction.
    * @param _userAddress User address to remove the volume dumping restriction
    */
    function removeRestriction(address _userAddress) public withPerm(ADMIN) {
        VolumeRestriction memory toRemove = volumeRestriction[_userAddress];

        // check if entry is in the past
        // not allowed to delete past entries
        require(toRemove.endTime > now, "Cannot remove past restrictions");

        uint length = volumePeriodIds[_userAddress].length;
       
        // delete all the volume tally period ids for the user address
        for( uint i = 0; i < length; i++ ){
            uint periodId = volumePeriodIds[_userAddress][i];
            delete volumeTally[_userAddress][periodId];
        }

        // reset the period ids
        volumePeriodIds[_userAddress].length = 0;

        delete volumeRestriction[_userAddress];        
        
        emit RemoveVolumeDumping(
            _userAddress,
            toRemove.percentAllowed,
            toRemove.startTime,
            toRemove.endTime,
            toRemove.rollingPeriod
        );
    }
    
    /**
    * @notice lets the admin modify volume dumping restriction for an addresses.
    * @param _userAddress Address of the user to apply the volume dumping restriction
    * @param _percentAllowed Percent of tokens balance allowed to transfer within a rolling period
    * @param _startTime When the dumping restriction, 0 means now in seconds
    * @param _endTime When the dumping restriction ends in seconds
    * @param _rollingPeriod is the time period in seconds
    */
    function modifyVolumeDumpingRestriction( 
        address _userAddress, 
        uint256 _percentAllowed, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriod
        ) public withPerm(ADMIN) {

        _checkVolumeDumpingParams(_userAddress, _percentAllowed, _startTime, _endTime, _rollingPeriod);
 
        require(volumeRestriction[_userAddress].endTime > now, "Cannot modify past restrictions");

        if (_startTime == 0) {
            _startTime = now;
        }

        require(_endTime > _startTime, "End time must be greater than start time");

        volumeRestriction[_userAddress] = VolumeRestriction(_percentAllowed, _startTime, _endTime, _rollingPeriod);

        emit ModifyVolumeDumping(
            _userAddress,
            _percentAllowed,
            _startTime,
            _endTime,
            _rollingPeriod
        );
    }
    
    /**
    * @notice Get volume dumping restriction rules for a user address
    * @param _userAddress User Address to get the rule
    */
    function getVolumeDumpingRestrictions(address _userAddress) public view returns (
        uint256 _percentAllowed , uint256 _startTime, uint256 _endTime, uint256 _rollingPeriod
    ) {
        VolumeRestriction storage userRestriction = volumeRestriction[_userAddress];
        return (
            userRestriction.percentAllowed,
            userRestriction.startTime,
            userRestriction.endTime,
            userRestriction.rollingPeriod
        );
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }


    /**
     * @notice Return the permissions flag that are associated with Volume Restriction transfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = VOLUME_RESTRICTION;
        return allPermissions;
    }

     /**
    * @notice Takes a userAddress as input, and returns a uint that represents the number of tokens allowed to be withdrawn right now
    * @param _userAddress User Address to get the rule
    * @param periodId Time period identifier
    */
    function _currentAllowedAmount(address _userAddress, uint periodId) internal returns (uint) {
        VolumeRestriction storage userDumpingRestriction = volumeRestriction[_userAddress];
        
        uint alreadyWithdrawn = volumeTally[_userAddress][periodId];
        // if the already with drawn is 0
        // means its essentially a new period
        if(alreadyWithdrawn == 0){
            volumePeriodIds[_userAddress].push(periodId);
        }

        uint256 currentUserBalance = ISecurityToken(securityToken).balanceOf(_userAddress);
        // add already withdrawn amount for this period 
        // to be able to get the correct value

        uint256 percentAllowed = userDumpingRestriction.percentAllowed;

        // totalAmountAllowedForPeriod = currentbalance * 20/100
        uint256 totalAmountAllowedForPeriod = currentUserBalance.add(alreadyWithdrawn).mul(percentAllowed).div(100);

        // get already withdrawn amount in period
        // alreadyWithdrawn = volumeTally[_userAddress][periodId];
        // c
        uint256 allowedAmount = totalAmountAllowedForPeriod.sub(alreadyWithdrawn);
        return allowedAmount;
    }

    /**
     * @notice Parameter checking function for creating or editing a volume restriction.  This function will cause an exception if any of the parameters are bad.
     * @param _userAddress Address of the user to apply the volume dumping restriction
     * @param _percentAllowed Percent of tokens balance allowed to transfer within a rolling period
     * @param _startTime When the dumping restriction, 0 means now in seconds
     * @param _endTime When the dumping restriction ends in seconds
     * @param _rollingPeriod Ttime period in seconds
    */
    function _checkVolumeDumpingParams( 
        address _userAddress, 
        uint256 _percentAllowed, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriod
        ) internal view {
        require(address(0) != _userAddress, "Invalid user address");
        require(_percentAllowed > 0 && _percentAllowed <= 100, "Invalid percent input");
        require(_startTime == 0 || _startTime >= now, "Invalid start time.");
        require(_endTime > 0 && _endTime > _startTime, "Invalid endtime");
        require(_rollingPeriod > 0 && _rollingPeriod < _endTime, "Invalid rolling period");        
    }
}