pragma solidity ^0.5.0;

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManagerStorage {

    bytes32 public constant WHITELIST = "WHITELIST";
    bytes32 public constant INVESTORSKEY = 0xdf3a8dd24acdd05addfc6aeffef7574d2de3f844535ec91e8e0f3e45dba96731; //keccak256(abi.encodePacked("INVESTORS"))
    bytes32 public constant INVESTORFLAGS = "INVESTORFLAGS";
    uint256 internal constant ONE = uint256(1);

    //Address from which issuances come
    address public issuanceAddress;

    // //from and to timestamps that an investor can send / receive tokens respectively
    // // Now Stored in DataStore
    // struct TimeRestriction {
    //     uint64 fromTime;
    //     uint64 toTime;
    //     uint64 expiryTime;
    //     uint8 added;
    // }

    // Allows all TimeRestrictions to be offset
    struct Defaults {
        uint64 fromTime;
        uint64 toTime;
    }

    // Offset to be applied to all timings (except KYC expiry)
    Defaults public defaults;

    // Map of used nonces by customer
    mapping(address => mapping(uint256 => bool)) public nonceMap;

    //If true, there are no transfer restrictions, for any addresses
    bool public allowAllTransfers = false;
    //If true, time lock is ignored for transfers (address must still be on whitelist)
    bool public allowAllWhitelistTransfers = false;
    //If true, time lock is ignored for issuances (address must still be on whitelist)
    bool public allowAllWhitelistIssuances = true;
    //If true, time lock is ignored for burn transactions
    bool public allowAllBurnTransfers = false;

    struct TransferRequirements {
        bool fromValidKYC;
        bool toValidKYC;
        bool fromRestricted;
        bool toRestricted;
    }

    mapping(uint256 => TransferRequirements) public transferRequirements;
    // General = 0, Issuance = 1, Redemption = 2

    /**
    * @dev This function sets the default transfer requirements.
    * It is defined here becuase it is used in the proxy as well.
    */
    function _setDefaults() internal {
        transferRequirements[0] = TransferRequirements(true, true, true, true);
        transferRequirements[1] = TransferRequirements(false, true, false, true);
        transferRequirements[0] = TransferRequirements(true, false, false, false);
    }
}
