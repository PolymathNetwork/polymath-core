pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../storage/VolumeRestrictionTMStorage.sol";

library VolumeRestrictionLib {

    using SafeMath for uint256;

    function _checkLengthOfArray(
        address[] memory _holders,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTimes,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTimes,
        uint256[] memory _restrictionTypes
    )
        internal
        pure
    {
        require(
            _holders.length == _allowedTokens.length &&
            _allowedTokens.length == _startTimes.length &&
            _startTimes.length == _rollingPeriodInDays.length &&
            _rollingPeriodInDays.length == _endTimes.length &&
            _endTimes.length == _restrictionTypes.length,
            "Length mismatch"
        );
    }

    function deleteHolderFromList(VolumeRestrictionTMStorage.RestrictedData storage data, address _holder, uint8 _typeOfPeriod) public {
        // Deleting the holder if holder's type of Period is `Both` type otherwise
        // it will assign the given type `_typeOfPeriod` to the _holder typeOfPeriod
        // `_typeOfPeriod` it always be contrary to the removing restriction
        // if removing restriction is individual then typeOfPeriod is TypeOfPeriod.OneDay
        // in uint8 its value is 1. if removing restriction is daily individual then typeOfPeriod
        // is TypeOfPeriod.MultipleDays in uint8 its value is 0.
        if (data.restrictedHolders[_holder].typeOfPeriod != uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both)) {
            uint128 index = data.restrictedHolders[_holder].index;
            uint256 _len = data.restrictedAddresses.length;
            if (index != _len) {
                data.restrictedHolders[data.restrictedAddresses[_len - 1]].index = index;
                data.restrictedAddresses[index - 1] = data.restrictedAddresses[_len - 1];
            }
            delete data.restrictedHolders[_holder];
            data.restrictedAddresses.length--;
        } else {
            data.restrictedHolders[_holder].typeOfPeriod = _typeOfPeriod;
        }
    }

    function addRestrictionData(VolumeRestrictionTMStorage.RestrictedData storage data, address _holder, uint8 _callFrom, uint256 _endTime) public {
        uint128 index = data.restrictedHolders[_holder].index;
        if (data.restrictedHolders[_holder].seen == 0) {
            data.restrictedAddresses.push(_holder);
            index = uint128(data.restrictedAddresses.length);
        }
        uint8 _type = _getTypeOfPeriod(data.restrictedHolders[_holder].typeOfPeriod, _callFrom, _endTime);
        data.restrictedHolders[_holder] = VolumeRestrictionTMStorage.RestrictedHolder(uint8(1), _type, index);
    }

    function _getTypeOfPeriod(uint8 _currentTypeOfPeriod, uint8 _callFrom, uint256 _endTime) internal pure returns(uint8) {
        if (_currentTypeOfPeriod != _callFrom && _endTime != uint256(0))
            return uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both);
        else
            return _callFrom;
    }

}
