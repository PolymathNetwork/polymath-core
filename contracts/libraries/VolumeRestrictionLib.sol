pragma solidity ^0.4.24;

import "./BokkyPooBahsDateTimeLibrary.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../interfaces/ISecurityToken.sol";
import "../storage/VolumeRestrictionTMStorage.sol";

library VolumeRestrictionLib {

    using SafeMath for uint256;

    function deleteHolderFromList(
        VolumeRestrictionTMStorage.RestrictedData storage data,
        address _holder,
        VolumeRestrictionTMStorage.TypeOfPeriod _typeOfPeriod
    )
        public
    {
        // Deleting the holder if holder's type of Period is `Both` type otherwise
        // it will assign the given type `_typeOfPeriod` to the _holder typeOfPeriod
        // `_typeOfPeriod` it always be contrary to the removing restriction
        // if removing restriction is individual then typeOfPeriod is TypeOfPeriod.OneDay
        // in uint8 its value is 1. if removing restriction is daily individual then typeOfPeriod
        // is TypeOfPeriod.MultipleDays in uint8 its value is 0.
        if (data.restrictedHolders[_holder].typeOfPeriod != VolumeRestrictionTMStorage.TypeOfPeriod.Both) {
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

    function addRestrictionData(
        VolumeRestrictionTMStorage.RestrictedData storage data,
        address _holder,
        VolumeRestrictionTMStorage.TypeOfPeriod _callFrom,
        uint256 _endTime
    )
        public
    {
        uint128 index = data.restrictedHolders[_holder].index;
        if (data.restrictedHolders[_holder].seen == 0) {
            data.restrictedAddresses.push(_holder);
            index = uint128(data.restrictedAddresses.length);
        }
        VolumeRestrictionTMStorage.TypeOfPeriod _type = _getTypeOfPeriod(data.restrictedHolders[_holder].typeOfPeriod, _callFrom, _endTime);
        data.restrictedHolders[_holder] = VolumeRestrictionTMStorage.RestrictedHolder(uint8(1), _type, index);
    }

    function _getTypeOfPeriod(
        VolumeRestrictionTMStorage.TypeOfPeriod _currentTypeOfPeriod,
        VolumeRestrictionTMStorage.TypeOfPeriod _callFrom,
        uint256 _endTime
    )
        internal
        pure
        returns(VolumeRestrictionTMStorage.TypeOfPeriod)
    {
        if (_currentTypeOfPeriod != _callFrom && _endTime != uint256(0))
            return VolumeRestrictionTMStorage.TypeOfPeriod.Both;
        else
            return _callFrom;
    }

    function isValidAmountAfterRestrictionChanges(
        uint256 _amountTradedLastDay,
        uint256 _amount,
        uint256 _sumOfLastPeriod,
        uint256 _allowedAmount,
        uint256 _lastTradedTimestamp
    )
        public
        view
        returns(bool)
    {   
        // if restriction is to check whether the current transaction is performed within the 24 hours
        // span after the last transaction performed by the user 
        if (BokkyPooBahsDateTimeLibrary.diffSeconds(_lastTradedTimestamp, now) < 86400) {
            (uint256 lastTxYear, uint256 lastTxMonth, uint256 lastTxDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(_lastTradedTimestamp);
            (uint256 currentTxYear, uint256 currentTxMonth, uint256 currentTxDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(now);
            // This if statement is to check whether the last transaction timestamp (of `individualRestriction[_from]`
            // when `_isDefault` is true or defaultRestriction when `_isDefault` is false) is comes within the same day of the current
            // transaction timestamp or not.
            if (lastTxYear == currentTxYear && lastTxMonth == currentTxMonth && lastTxDay == currentTxDay) {
                // Not allow to transact more than the current transaction restriction allowed amount
                if ((_sumOfLastPeriod.add(_amount)).add(_amountTradedLastDay) > _allowedAmount)
                    return false;
            }
        }
        return true;
    }

}
