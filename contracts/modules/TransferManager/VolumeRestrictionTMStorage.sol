pragma solidity ^0.5.0;

/**
 * @title Storage layout for VolumeRestrictionTM
 */
contract VolumeRestrictionTMStorage {

    enum RestrictionType { Fixed, Percentage }

    struct VolumeRestriction {
        // If typeOfRestriction is `Percentage` then allowedTokens will be in
        // the % (w.r.t to totalSupply) with a multiplier of 10**16 . else it 
        // will be fixed amount of tokens
        uint256 allowedTokens;
        uint256 startTime;
        uint256 rollingPeriodInDays;
        uint256 endTime;
        RestrictionType typeOfRestriction;
    }

    struct BucketDetails {
        uint256 lastTradedDayTime;
        uint256 sumOfLastPeriod;   // It is the sum of transacted amount within the last rollingPeriodDays 
        uint256 daysCovered;    // No of days covered till (from the startTime of VolumeRestriction)
        uint256 dailyLastTradedDayTime;
    }

    // Global restriction that applies to all token holders
    VolumeRestriction public defaultRestriction;
    // Daily global restriction that applies to all token holders (Total ST traded daily is restricted)
    VolumeRestriction public defaultDailyRestriction;
    // Restriction stored corresponds to a particular token holder
    mapping(address => VolumeRestriction) public individualRestriction;
    // Daily restriction stored corresponds to a particular token holder
    mapping(address => VolumeRestriction) public individualDailyRestriction;
    // Storing _from => day's timestamp => total amount transact in a day --individual
    mapping(address => mapping(uint256 => uint256)) internal bucket;
    // Storing the information that used to validate the transaction
    mapping(address => BucketDetails) internal userToBucket;
    // Storing the information related to default restriction
    mapping(address => BucketDetails) internal defaultUserToBucket;
    // List of wallets that are exempted from all the restrictions applied by the this contract
    mapping(address => bool) public exemptList;

}