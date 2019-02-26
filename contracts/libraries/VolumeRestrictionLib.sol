pragma solidity ^0.5.0;

import "../interfaces/IDataStore.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol";

library VolumeRestrictionLib {

    using SafeMath for uint256;

    uint256 internal constant ONE = uint256(1);
    uint8 internal constant INDEX = uint8(2);
    bytes32 internal constant INVESTORFLAGS = "INVESTORFLAGS";
    bytes32 internal constant INVESTORSKEY = 0xdf3a8dd24acdd05addfc6aeffef7574d2de3f844535ec91e8e0f3e45dba96731; //keccak256(abi.encodePacked("INVESTORS"))
    bytes32 internal constant WHITELIST = "WHITELIST";

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

    function deleteHolderFromList(
        mapping(address => uint8) storage holderToRestrictionType,
        address _holder,
        address _dataStore,
        uint8 _typeOfPeriod
    ) 
        public
    {
        // Deleting the holder if holder's type of Period is `Both` type otherwise
        // it will assign the given type `_typeOfPeriod` to the _holder typeOfPeriod
        // `_typeOfPeriod` it always be contrary to the removing restriction
        // if removing restriction is individual then typeOfPeriod is TypeOfPeriod.OneDay
        // in uint8 its value is 1. if removing restriction is daily individual then typeOfPeriod
        // is TypeOfPeriod.MultipleDays in uint8 its value is 0.
        if (holderToRestrictionType[_holder] != uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both)) {
            IDataStore dataStore = IDataStore(_dataStore);
            uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _holder));
            flags = flags & ~(ONE << INDEX);
            dataStore.setUint256(_getKey(INVESTORFLAGS, _holder), flags);
        } else {
            holderToRestrictionType[_holder] = _typeOfPeriod;
        }
    }

    function addRestrictionData(
        mapping(address => uint8) storage holderToRestrictionType,
        address _holder,
        uint8 _callFrom,
        uint256 _endTime,
        address _dataStore
    ) 
        public 
    {
        IDataStore dataStore = IDataStore(_dataStore);

        uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _holder));
        if (!_isExistingInvestor(_holder, dataStore)) {
            dataStore.insertAddress(INVESTORSKEY, _holder);
            //KYC data can not be present if added is false and hence we can set packed KYC as uint256(1) to set added as true
            dataStore.setUint256(_getKey(WHITELIST, _holder), uint256(1));
        }
        if (!_isVolRestricted(flags)) {
            flags = flags | (ONE << INDEX);
            dataStore.setUint256(_getKey(INVESTORFLAGS, _holder), flags);
        }
        uint8 _type = _getTypeOfPeriod(holderToRestrictionType[_holder], _callFrom, _endTime);
        holderToRestrictionType[_holder] = _type;
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
        mapping(address => uint8) storage holderToRestrictionType,
        VolumeRestrictionTMStorage.IndividualRestrictions storage _individualRestrictions,
        address _dataStore
    )   
        public
        view 
        returns(
            address[] memory allAddresses,
            uint256[] memory allowedTokens,
            uint256[] memory startTime,
            uint256[] memory rollingPeriodInDays,
            uint256[] memory endTime,
            uint8[] memory typeOfRestriction
            )
    {
        address[] memory investors = IDataStore(_dataStore).getAddressArray(INVESTORSKEY);
        uint256 counter;
        uint256 i;
        for (i = 0; i < investors.length; i++) {
            if (_isVolRestricted(IDataStore(_dataStore).getUint256(_getKey(INVESTORFLAGS, investors[i])))) {
                counter = counter + (holderToRestrictionType[investors[i]] == uint8(2) ? 2 : 1);
            }
        }
        allAddresses = new address[](counter);
        allowedTokens = new uint256[](counter);
        startTime = new uint256[](counter);
        rollingPeriodInDays = new uint256[](counter);
        endTime = new uint256[](counter);
        typeOfRestriction = new uint8[](counter);
        counter = 0;
        for (i = 0; i < investors.length; i++) {
            if (_isVolRestricted(IDataStore(_dataStore).getUint256(_getKey(INVESTORFLAGS, investors[i])))) {
                allAddresses[counter] = investors[i];
                if (holderToRestrictionType[investors[i]] == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.MultipleDays)) {
                    _setValues(_individualRestrictions.individualRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                } 
                else if (holderToRestrictionType[investors[i]] == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.OneDay)) {
                    _setValues(_individualRestrictions.individualDailyRestriction[investors[i]], allowedTokens, startTime, rollingPeriodInDays, endTime, typeOfRestriction, counter);
                } 
                else if (holderToRestrictionType[investors[i]] == uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both)) {
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

    function _isVolRestricted(uint256 _flags) internal pure returns(bool) {
        uint256 volRestricted = (_flags >> INDEX) & ONE;
        return (volRestricted > 0 ? true : false);
    }

    function _getTypeOfPeriod(uint8 _currentTypeOfPeriod, uint8 _callFrom, uint256 _endTime) internal pure returns(uint8) {
        if (_currentTypeOfPeriod != _callFrom && _endTime != uint256(0))
            return uint8(VolumeRestrictionTMStorage.TypeOfPeriod.Both);
        else
            return _callFrom;
    }

    function _isExistingInvestor(address _investor, IDataStore dataStore) internal view returns(bool) {
        uint256 data = dataStore.getUint256(_getKey(WHITELIST, _investor));
        //extracts `added` from packed `_whitelistData`
        return uint8(data) == 0 ? false : true;
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

}
