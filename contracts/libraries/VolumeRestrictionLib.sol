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

    function getRestrictionData(
        VolumeRestrictionTMStorage.RestrictedData storage _holderData,
        VolumeRestrictionTMStorage.IndividualRestrictions storage _individualRestrictions
    ) public view returns(
        address[] memory allAddresses,
        uint256[] memory allowedTokens,
        uint256[] memory startTime,
        uint256[] memory rollingPeriodInDays,
        uint256[] memory endTime,
        uint8[] memory typeOfRestriction
    )
    {
        uint256 counter = 0;
        uint256 i = 0;
        for (i = 0; i < _holderData.restrictedAddresses.length; i++) {
            counter = counter + (_holderData.restrictedHolders[_holderData.restrictedAddresses[i]].typeOfPeriod == uint8(2) ? 2 : 1);
        }
        allAddresses = new address[](counter);
        allowedTokens = new uint256[](counter);
        startTime = new uint256[](counter);
        rollingPeriodInDays = new uint256[](counter);
        endTime = new uint256[](counter);
        typeOfRestriction = new uint8[](counter);
        counter = 0;
        for (i = 0; i < _holderData.restrictedAddresses.length; i++) {
            allAddresses[counter] =  _holderData.restrictedAddresses[i];
            if (_holderData.restrictedHolders[_holderData.restrictedAddresses[i]].typeOfPeriod == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.MultipleDays)) {
                _setValues(_individualRestrictions.individualRestriction[_holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            else if (_holderData.restrictedHolders[_holderData.restrictedAddresses[i]].typeOfPeriod == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.OneDay)) {
                _setValues(_individualRestrictions.individualDailyRestriction[_holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            else if (_holderData.restrictedHolders[_holderData.restrictedAddresses[i]].typeOfPeriod == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both)) {
                _setValues(_individualRestrictions.individualRestriction[_holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                counter++;
                allAddresses[counter] =  _holderData.restrictedAddresses[i];
                _setValues(_individualRestrictions.individualDailyRestriction[_holderData.restrictedAddresses[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
            }
            counter++;
        }
    }

    function _setValues(
        VolumeRestrictionTMStorage.VolumeRestriction memory restriction,
        uint256[] memory allowedTokens,
        uint256[] memory startTime,
        uint256[] memory rollingPeriodInDays,
        uint256[] memory endTime,
        uint8[] memory typeOfRestriction,
        uint256 index
    )
        internal
        pure
    {
        allowedTokens[index] = restriction.allowedTokens;
        startTime[index] = restriction.startTime;
        rollingPeriodInDays[index] = restriction.rollingPeriodInDays;
        endTime[index] = restriction.endTime;
        typeOfRestriction[index] = uint8(restriction.typeOfRestriction);
    }

}
