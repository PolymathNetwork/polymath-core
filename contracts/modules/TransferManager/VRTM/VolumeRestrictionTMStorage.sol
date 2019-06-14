pragma solidity 0.5.8;

/**
 * @title Storage layout for VolumeRestrictionTM
 */
contract VolumeRestrictionTMStorage {

    enum RestrictionType { Fixed, Percentage }

    enum TypeOfPeriod { MultipleDays, OneDay, Both }

    // Store the type of restriction corresponds to token holder address
    mapping(address => TypeOfPeriod) holderToRestrictionType;

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

    struct IndividualRestrictions {
        // Restriction stored corresponds to a particular token holder
        mapping(address => VolumeRestriction) individualRestriction;
        // Daily restriction stored corresponds to a particular token holder
        mapping(address => VolumeRestriction) individualDailyRestriction;
    }

    // Individual and daily restrictions for investors
    IndividualRestrictions individualRestrictions;

    struct GlobalRestrictions {
      // Global restriction that applies to all token holders
      VolumeRestriction defaultRestriction;
      // Daily global restriction that applies to all token holders (Total ST traded daily is restricted)
      VolumeRestriction defaultDailyRestriction;
    }

    // Individual and daily restrictions for investors
    GlobalRestrictions globalRestrictions;

    struct BucketDetails {
        uint256 lastTradedDayTime;
        uint256 sumOfLastPeriod;   // It is the sum of transacted amount within the last rollingPeriodDays
        uint256 daysCovered;    // No of days covered till (from the startTime of VolumeRestriction)
        uint256 dailyLastTradedDayTime;
        uint256 lastTradedTimestamp; // It is the timestamp at which last transaction get executed
    }

    struct BucketData {
        // Storing _from => day's timestamp => total amount transact in a day --individual
        mapping(address => mapping(uint256 => uint256)) bucket;
        // Storing _from => day's timestamp => total amount transact in a day --individual
        mapping(address => mapping(uint256 => uint256)) defaultBucket;
        // Storing the information that used to validate the transaction
        mapping(address => BucketDetails) userToBucket;
        // Storing the information related to default restriction
        mapping(address => BucketDetails) defaultUserToBucket;
    }

    BucketData bucketData;

    // Hold exempt index
    struct Exemptions {
        mapping(address => uint256) exemptIndex;
        address[] exemptAddresses;
    }

    Exemptions exemptions;

}
