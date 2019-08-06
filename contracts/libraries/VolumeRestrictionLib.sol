pragma solidity 0.5.8;

import "../interfaces/IDataStore.sol";
import "./BokkyPooBahsDateTimeLibrary.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol";

library VolumeRestrictionLib {

    using SafeMath for uint256;

    uint256 internal constant ONE = uint256(1);
    bytes32 internal constant INVESTORFLAGS = "INVESTORFLAGS";
    bytes32 internal constant INVESTORSKEY = 0xdf3a8dd24acdd05addfc6aeffef7574d2de3f844535ec91e8e0f3e45dba96731; //keccak256(abi.encodePacked("INVESTORS"))
    bytes32 internal constant WHITELIST = "WHITELIST";


    function deleteHolderFromList(
        mapping(address => VolumeRestrictionTMStorage.TypeOfPeriod) storage _holderToRestrictionType,
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
        if (_holderToRestrictionType[_holder] == VolumeRestrictionTMStorage.TypeOfPeriod.Both) {
            _holderToRestrictionType[_holder] = _typeOfPeriod;
        }
    }

    function addRestrictionData(
        mapping(address => VolumeRestrictionTMStorage.TypeOfPeriod) storage _holderToRestrictionType,
        address _holder,
        VolumeRestrictionTMStorage.TypeOfPeriod _callFrom,
        uint256 _endTime,
        IDataStore _dataStore
    )
        public
    {
        if (!_isExistingInvestor(_holder, _dataStore)) {
            _dataStore.insertAddress(INVESTORSKEY, _holder);
            //KYC data can not be present if added is false and hence we can set packed KYC as uint256(1) to set added as true
            _dataStore.setUint256(_getKey(WHITELIST, _holder), uint256(1));
        }
        VolumeRestrictionTMStorage.TypeOfPeriod _type = _getTypeOfPeriod(_holderToRestrictionType[_holder], _callFrom, _endTime);
        _holderToRestrictionType[_holder] = _type;
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
            (,, uint256 lastTxDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(_lastTradedTimestamp);
            (,, uint256 currentTxDay) = BokkyPooBahsDateTimeLibrary.timestampToDate(now);
            // This if statement is to check whether the last transaction timestamp (of `individualRestriction[_from]`
            // when `_isDefault` is true or defaultRestriction when `_isDefault` is false) is comes within the same day of the current
            // transaction timestamp or not.
            if (lastTxDay == currentTxDay) {
                // Not allow to transact more than the current transaction restriction allowed amount
                if ((_sumOfLastPeriod.add(_amount)).add(_amountTradedLastDay) > _allowedAmount)
                    return false;
            }
        }
        return true;
    }

    /**
     * @notice Provide the restriction details of all the restricted addresses
     * @return address List of the restricted addresses
     * @return uint256 List of the tokens allowed to the restricted addresses corresponds to restricted address
     * @return uint256 List of the start time of the restriction corresponds to restricted address
     * @return uint256 List of the rolling period in days for a restriction corresponds to restricted address.
     * @return uint256 List of the end time of the restriction corresponds to restricted address.
     * @return uint8 List of the type of restriction to validate the value of the `allowedTokens`
     * of the restriction corresponds to restricted address
     */
    function getRestrictionData(
        mapping(address => VolumeRestrictionTMStorage.TypeOfPeriod) storage _holderToRestrictionType,
        VolumeRestrictionTMStorage.IndividualRestrictions storage _individualRestrictions,
        VolumeRestrictionTMStorage.Exemptions storage _exemptions,
        IDataStore _dataStore
    )
        public
        view
        returns(
            address[] memory allAddresses,
            uint256[] memory allowedTokens,
            uint256[] memory startTime,
            uint256[] memory rollingPeriodInDays,
            uint256[] memory endTime,
            VolumeRestrictionTMStorage.RestrictionType[] memory typeOfRestriction
            )
    {
        address[] memory investors = _dataStore.getAddressArray(INVESTORSKEY);
        uint256 counter;
        uint256 i;
        for (i = 0; i < investors.length; i++) {
            if (!_isExempted(investors[i], _exemptions) && _isVolRestricted(investors[i], _individualRestrictions)) {
                counter = counter + (_holderToRestrictionType[investors[i]] == VolumeRestrictionTMStorage.TypeOfPeriod.Both ? 2 : 1);
            }
        }
        allAddresses = new address[](counter);
        allowedTokens = new uint256[](counter);
        startTime = new uint256[](counter);
        rollingPeriodInDays = new uint256[](counter);
        endTime = new uint256[](counter);
        typeOfRestriction = new VolumeRestrictionTMStorage.RestrictionType[](counter);
        counter = 0;
        for (i = 0; i < investors.length; i++) {
            if (!_isExempted(investors[i], _exemptions) && _isVolRestricted(investors[i], _individualRestrictions)) {
                allAddresses[counter] = investors[i];
                if (_holderToRestrictionType[investors[i]] == VolumeRestrictionTMStorage.TypeOfPeriod.MultipleDays) {
                    _setValues(_individualRestrictions.individualRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                }
                else if (_holderToRestrictionType[investors[i]] == VolumeRestrictionTMStorage.TypeOfPeriod.OneDay) {
                    _setValues(_individualRestrictions.individualDailyRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                }
                else if (_holderToRestrictionType[investors[i]] == VolumeRestrictionTMStorage.TypeOfPeriod.Both) {
                    _setValues(_individualRestrictions.individualRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                    counter++;
                    allAddresses[counter] = investors[i];
                    _setValues(_individualRestrictions.individualDailyRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                }
                counter++;
            }
        }
    }

    function _setValues(
        VolumeRestrictionTMStorage.VolumeRestriction memory _restriction,
        uint256[] memory _allowedTokens,
        uint256[] memory _startTime,
        uint256[] memory _rollingPeriodInDays,
        uint256[] memory _endTime,
        VolumeRestrictionTMStorage.RestrictionType[] memory _typeOfRestriction,
        uint256 _index
    )
        internal
        pure
    {
        _allowedTokens[_index] = _restriction.allowedTokens;
        _startTime[_index] = _restriction.startTime;
        _rollingPeriodInDays[_index] = _restriction.rollingPeriodInDays;
        _endTime[_index] = _restriction.endTime;
        _typeOfRestriction[_index] = _restriction.typeOfRestriction;
    }

    function _isExempted(
        address _investor,
        VolumeRestrictionTMStorage.Exemptions storage _exemptions
    ) 
    internal
    view
    returns(bool exempted) 
    {
        exempted = _exemptions.exemptIndex[_investor] != 0;
    }

    function _isVolRestricted(
        address _investor,
        VolumeRestrictionTMStorage.IndividualRestrictions storage _individualRestrictions
    ) 
    internal
    view
    returns(bool restricted) 
    {
        restricted = _individualRestrictions.individualRestriction[_investor].allowedTokens != uint256(0) ||
        _individualRestrictions.individualDailyRestriction[_investor].allowedTokens != uint256(0);
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

    function _isExistingInvestor(address _investor, IDataStore _dataStore) internal view returns(bool) {
        uint256 data = _dataStore.getUint256(_getKey(WHITELIST, _investor));
        //extracts `added` from packed `_whitelistData`
        return uint8(data) == 0 ? false : true;
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

}
