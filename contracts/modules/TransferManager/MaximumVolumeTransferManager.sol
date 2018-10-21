pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for capping the amount of token transfers within a period
 */
contract MaximumVolumeTransferManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";

    enum RollingIntervals { Daily, Weekly, Quarterly, Biannually, Annually }

    struct MaximumVolumeRestriction{
        uint256 maximumVolumeAllowed;
        uint256 startTime;
        uint256 endTime;
        RollingIntervals rollingPeriodInterval;
    }

    MaximumVolumeRestriction[] public maximumVolumeRestrictions;

    // mapping from address to RollingIntervals to periodIds to tokens transfered 
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) volumeTally;

    // Emit whenever a new maximum volume restriction gets added
    event AddNewMaximumVolumeRestriction(
        uint256 _index,
        uint256 timestamp,
        uint256 _maximumVolume, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval
    );

    // Emit whenever a new maximum volume restriction gets modified
    event ModifyMaximumVolumeRestriction(
        uint256 _index,
        uint256 timestamp, 
        uint256 _maximumVolume, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval
    );

    // Emit whenever a new maximum volume restriction gets removed
    event RemoveMaximumVolumeRestricion(
        address indexed _from,
        uint256 timestamp
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
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice used to verify a transfer transaction and restrict the amount of tokens that can be transfered within a rolling time interval
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferable
    */
    function verifyTransfer(address _from, address /*_to*/, uint256 _amount, bytes /* _data */, bool _isTransfer) public returns(Result) {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not owner");

        // loop over every existing max transfer restriction to check if current transaction falls under their activity interval
        if (!paused) {
            for(uint256 i = 0; i < maximumVolumeRestrictions.length; i++){
                MaximumVolumeRestriction memory restriction = maximumVolumeRestrictions[i];
                if(now >= restriction.startTime && now <= restriction.endTime){
                    uint256 period = _getPeriod(restriction.rollingPeriodInterval);
                    uint256 periodId = (now.sub(restriction.startTime)).div(period);

                    // if the transfer amount causes the total period volume to exceed the maximum value, transfer is invalid
                    if(_amount.add(volumeTally[_from][uint256(restriction.rollingPeriodInterval)][periodId]) > restriction.maximumVolumeAllowed){
                        return Result.INVALID;
                    }else{
                        volumeTally[_from][uint256(restriction.rollingPeriodInterval)][periodId] = _amount.add(volumeTally[_from][uint256(restriction.rollingPeriodInterval)][periodId]);
                    }
                }
            }
            return Result.VALID;
        }
        return Result.NA;
    }

    /**
    * @notice allows admin to add new maximum volume transfer restrictions
    * @param _maximumVolume maximum token volume that can be transfered
    * @param _startTime timestamp representing when this maximum volume restriction starts
    * @param _endTime timestamp representing when this maximum volume restriction ends
    * @param _rollingPeriodInterval interval period representing one of five RollingIntervals
    */
    function addMaxVolumeRestricion(
        uint256 _maximumVolume, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval) 
    public withPerm(ADMIN) {
        if(_startTime == 0) {
            _startTime = now;
        }
        _checkRestrictionParams(_startTime, _endTime, _rollingPeriodInterval);

        _addMaxVolumeRestricion(_maximumVolume, _startTime, _endTime, _rollingPeriodInterval);
    }

    /**
    * @notice allows admin to add multiple new maximum volume transfer restrictions
    * @param _maximumVolumes maximum token volumes that can be transfered
    * @param _startTimes timestamps representing when these maximum volume restrictions start
    * @param _endTimes timestamps representing when these maximum volume restrictions end
    * @param _rollingPeriodIntervals interval periods representing one of five RollingIntervals
    */
    function addMaxVolumeRestricionsMulti(
        uint256[] _maximumVolumes, 
        uint256[] _startTimes, 
        uint256[] _endTimes, 
        uint256[] _rollingPeriodIntervals) 
    public withPerm(ADMIN) {
        require(_maximumVolumes.length >= 1, "No restrictions provided");
        require(
            _maximumVolumes.length == _startTimes.length &&
            _maximumVolumes.length == _endTimes.length &&
            _maximumVolumes.length == _rollingPeriodIntervals.length,
            "Input array length mismatch"
        );

        for(uint256 i = 0; i < _maximumVolumes.length; i++){
            _addMaxVolumeRestricion(
                _maximumVolumes[i],
                _startTimes[i],
                _endTimes[i],
                _rollingPeriodIntervals[i]
            );
        }
    }

    /**
    * @notice allows admin to modify a maximum volume transfer restriction
    * @param _index representing the array index of the maximum volume transfer restriction
    * @param _maximumVolume maximum token volume that can be transfered
    * @param _startTime timestamp representing when this maximum volume restriction starts
    * @param _endTime timestamp representing when this maximum volume restriction ends
    * @param _rollingPeriodInterval interval period representing one of five RollingIntervals
    */
    function modifyMaximumTransferRestriction(
        uint256 _index, 
        uint256 _maximumVolume, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval) 
    public withPerm(ADMIN) {
        require(_index < maximumVolumeRestrictions.length, "invalid index");
        require(now < maximumVolumeRestrictions[_index].endTime, "restriction is no longer active");

        if(_startTime == 0) {
            _startTime = now;
        }

        _checkRestrictionParams(_startTime, _endTime, _rollingPeriodInterval);

        MaximumVolumeRestriction memory restriction = MaximumVolumeRestriction(
            _maximumVolume, 
            _startTime, 
            _endTime, 
            RollingIntervals(_rollingPeriodInterval)
        );
        maximumVolumeRestrictions[_index] = restriction;

        emit ModifyMaximumVolumeRestriction(
            _index,
            now, 
            _maximumVolume,
            _startTime,
            _endTime,
            _rollingPeriodInterval
        );
    }

    /**
    * @notice allows admin to delete a maximum volume transfer restriction
    * @param _index representing the array index of the maximum volume transfer restriction
    */
    function removeMaximumTransferRestriction(uint256 _index) public withPerm(ADMIN){
        require (maximumVolumeRestrictions.length > _index, "invalid index");

        if(_index < (maximumVolumeRestrictions.length - 1)){
            maximumVolumeRestrictions[_index] = maximumVolumeRestrictions[maximumVolumeRestrictions.length - 1];
        }

        maximumVolumeRestrictions.length = maximumVolumeRestrictions.length - 1;

        emit RemoveMaximumVolumeRestricion(
            msg.sender,
            now
        );
    }

    /**
     * @notice Return the permissions flag that are associated with MaximumVolumeTransferManager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    /**
    * @notice returns a count of all the added maximum volume restrictions
    */
    function getMaximumVolumeRestrictionsCount() public view returns(uint)  {
        return maximumVolumeRestrictions.length;
    }

    /**
    * @notice internal function to create new maximum volume transfer restrictions
    * @param _maximumVolume maximum token volume that can be transfered
    * @param _startTime timestamp representing when this maximum volume restriction starts
    * @param _endTime timestamp representing when this maximum volume restriction ends
    * @param _rollingPeriodInterval interval period representing one of five RollingIntervals
    */
    function _addMaxVolumeRestricion(
        uint256 _maximumVolume, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval) 
    internal {
        emit AddNewMaximumVolumeRestriction(
            maximumVolumeRestrictions.length,
            now, 
            _maximumVolume,
            _startTime,
            _endTime,
            _rollingPeriodInterval
        );

        maximumVolumeRestrictions.push(
            MaximumVolumeRestriction(
                _maximumVolume, 
                _startTime, 
                _endTime, 
                RollingIntervals(_rollingPeriodInterval)
            )
        );
    }
    

    /**
    * @notice gets rolling interval period value in seconds
    * @param _rollingPeriodInterval one of five RollingIntervals enum value
    */
    function _getPeriod(RollingIntervals _rollingPeriodInterval) internal pure returns(uint256){
        uint256 period;
        if(_rollingPeriodInterval == RollingIntervals.Daily){
            period = 24 hours;
        }else if(_rollingPeriodInterval == RollingIntervals.Weekly){
            period = 7 * 24 hours;
        }else if(_rollingPeriodInterval == RollingIntervals.Quarterly){
            period = 3 * 30 * 24 hours;
        }else if(_rollingPeriodInterval == RollingIntervals.Biannually){
            period = 6 * 30 * 24 hours;
        }else{
            period = 365 * 24 hours;
        }
        return period;
    }

    /**
    * @notice internal function for checking restriction parameters
    * @param _startTime timestamp representing when this maximum volume restriction starts
    * @param _endTime timestamp representing when this maximum volume restriction ends
    * @param _rollingPeriodInterval interval period representing one of five RollingIntervals
    */
    function _checkRestrictionParams(
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rollingPeriodInterval
    ) internal view {
        require(
            uint256(RollingIntervals.Annually) >= _rollingPeriodInterval,
            "invalid rolling period interval - should be < 5"
        );
        require(_endTime > _startTime && _endTime > now, 'invalid endTime');
        require(
            _getPeriod(RollingIntervals(_rollingPeriodInterval)) <= _endTime.sub(_startTime), 
            "rolling interval must be less than or equal to the difference between endTime and startTime"
        );
    }

}
