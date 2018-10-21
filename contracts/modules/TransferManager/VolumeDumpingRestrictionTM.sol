pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title  Transfer Manager module for restricting volume dumping within a time period for an account
 */

contract VolumeDumpingRestrictionTM is ITransferManager {
    
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
        address indexed restrictedAddress, 
        uint256 percentAllowed, 
        uint256 startTime,
        uint256 endTime,
        uint256 rollingPeriod
    );

    event AddNewVolumeDumping (
        address indexed restrictedAddress, 
        uint256 percentAllowed, 
        uint256 startTime,
        uint256 endTime,
        uint256 rollingPeriod
    );

    event RemoveVolumeDumping (
        address indexed restrictedAddress, 
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
    function verifyTransfer(address _from, address /*_to */, uint256 _amount, bytes /* _data */, bool _isTransfer) public returns(Result) {
        
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not owner");

        if (!paused && _from != address(0) && _amount != 0 ) {                
            VolumeRestriction memory userDumpingRestriction = volumeRestriction[_from];

            if (now < userDumpingRestriction.startTime || now > userDumpingRestriction.endTime){
                return Result.NA;
            }
            
            uint256 periodId =  now.sub(userDumpingRestriction.startTime).div(userDumpingRestriction.rollingPeriod);

            // // the remainig transferable amount
            uint256 allowedRemainingAmount = _currentAllowedAmount(_from, periodId);

            if (_amount <= allowedRemainingAmount){

                // readonly transaction shouldn't modify state
                if(!_isTransfer) {
                    return Result.VALID;
                }

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

        // if a startTime of 0 is passed in, then start now.
        if(_startTime == 0) {
            _startTime = now;
        }

        _checkVolumeDumpingParams(_userAddress, _percentAllowed, _startTime, _endTime, _rollingPeriod);
        
        // deny if restriction already exists
        require(volumeRestriction[_userAddress].percentAllowed == 0, "volume dumping restriction already exists");
        
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

        for (uint256 i = 0; i < _userAddresses.length; i++) {
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

        uint256 length = volumePeriodIds[_userAddress].length;
       
        // delete all the volume tally period ids for the user address
        for( uint256 i = 0; i < length; i++ ){
            uint256 periodId = volumePeriodIds[_userAddress][i];
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
    * @notice lets the admin remove multiple volume dumping restriction.
    * @param _userAddresses List of User addresses to remove the volume dumping restriction
    */
    function removeRestrictionMulti(address[] _userAddresses) public withPerm(ADMIN) {
        // ensure the the array length is > 0
        require(_userAddresses.length > 0, "Invalid array length");

        for (uint256 i = 0; i < _userAddresses.length; i++) {
            removeRestriction(_userAddresses[i]);
        }
    }


    /**
    * @notice moves spent amount in active periodId to new periodId & deletees
    * all previous ids to prevent collision
    * @param _oldUserDumpingRestriction old dumping restriction details
    * @param _newUserDumpingRestriction new dumping restriction details
    * @param _userAddress user address
    */
    function movePeriodAmounts( 
        VolumeRestriction _oldUserDumpingRestriction, 
        VolumeRestriction _newUserDumpingRestriction, 
        address _userAddress ) internal {

        uint256 currentTime = now;

        uint256 currentPeriodId = currentTime.sub(_oldUserDumpingRestriction.startTime).div(_oldUserDumpingRestriction.rollingPeriod);
        uint256 newPeriodId = currentTime.sub(_newUserDumpingRestriction.startTime).div(_newUserDumpingRestriction.rollingPeriod);

        // this means there is a change in param 
        // required to calculate period id
        if(currentPeriodId != newPeriodId){

            // Already spent amount for the current active
            // period id
            uint256 currentPeriodAmount = volumeTally[_userAddress][currentPeriodId];

            uint256 length = volumePeriodIds[_userAddress].length;       
           // delete all existing period ids 
            // to prevent id collision
            for( uint256 i = 0; i < length; i++ ){
                uint256 periodId = volumePeriodIds[_userAddress][i];
                delete volumeTally[_userAddress][periodId];
            }

            // reset the period ids
            volumePeriodIds[_userAddress].length = 0;

            // set the volume tally of the 
            // new period id to the already spent
            // amount of the old period id
            volumeTally[_userAddress][newPeriodId] = currentPeriodAmount;
            // push the new period id
            volumePeriodIds[_userAddress].push(newPeriodId);
        }
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

        if (_startTime == 0) {
            _startTime = now;
        }

        _checkVolumeDumpingParams(_userAddress, _percentAllowed, _startTime, _endTime, _rollingPeriod);

        // don't allow modifying entries that have ended
        require(volumeRestriction[_userAddress].endTime > now, "Cannot modify past restrictions");

        // allow modifying the start time 
        // only if the restriction period has not started
        if(volumeRestriction[_userAddress].startTime < now){
            require(volumeRestriction[_userAddress].startTime == _startTime, "Cannot modify start time of already started restriction");
        }

        // perform if the restriction period has started
        if(volumeRestriction[_userAddress].startTime > now){
            movePeriodAmounts(
                volumeRestriction[_userAddress], 
                VolumeRestriction(_percentAllowed, _startTime, _endTime, _rollingPeriod),
                _userAddress
            );
        }

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
    * @notice lets the admin modify multiple volume dumping restriction for an addresses.
    * @param _userAddresses Address of the user to apply the volume dumping restriction
    * @param _percentsAllowed Percent of tokens balance allowed to transfer within a rolling period
    * @param _startTimes When the dumping restriction, 0 means now in seconds
    * @param _endTimes When the dumping restriction ends in seconds
    * @param _rollingPeriods is the time period in seconds
    */
    function modifyVolumeDumpingRestrictionMulti( 
        address[] _userAddresses, 
        uint256[] _percentsAllowed, 
        uint256[] _startTimes, 
        uint256[] _endTimes, 
        uint256[] _rollingPeriods
        ) public withPerm(ADMIN) {
        
        require( 
            _userAddresses.length == _percentsAllowed.length &&
            _userAddresses.length == _rollingPeriods.length &&
            _userAddresses.length == _startTimes.length &&
            _userAddresses.length == _endTimes.length,
            "Input array length mis-match"
        );

        for (uint256 i = 0; i < _userAddresses.length; i++) {
            modifyVolumeDumpingRestriction(_userAddresses[i], _percentsAllowed[i], _startTimes[i], _endTimes[i], _rollingPeriods[i]);
        }
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
    * @param _periodId Time period identifier
    */
    function _currentAllowedAmount(address _userAddress, uint256 _periodId) internal returns (uint256) {
        VolumeRestriction storage userDumpingRestriction = volumeRestriction[_userAddress];
        
        // get already withdrawn amount in period
        uint256 alreadyWithdrawn = volumeTally[_userAddress][_periodId];
        
        // if the already with drawn is 0
        // means its essentially a new period
        if(alreadyWithdrawn == 0){
            volumePeriodIds[_userAddress].push(_periodId);
        }

        uint256 currentUserBalance = ISecurityToken(securityToken).balanceOf(_userAddress);
        // add already withdrawn amount for this period 
        // to be able to get the correct value

        uint256 percentAllowed = userDumpingRestriction.percentAllowed;

        // totalAmountAllowedForPeriod = currentbalance * 20/100
        uint256 totalAmountAllowedForPeriod = currentUserBalance.add(alreadyWithdrawn).mul(percentAllowed).div(100 * uint256(10)**16);

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
        require(_percentAllowed > 0 && _percentAllowed <= 100 * uint256(10)**16, "Invalid percent input");
        require(_startTime == 0 || _startTime >= now, "Invalid start time");
        require(_endTime > _startTime, "Invalid endtime");
        require(_rollingPeriod > 0 && _rollingPeriod < _endTime, "Invalid rolling period");        
    }
}
