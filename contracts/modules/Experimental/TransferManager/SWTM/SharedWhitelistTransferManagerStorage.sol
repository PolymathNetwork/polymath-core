pragma solidity ^0.5.0;

import "../../../../interfaces/IDataStore.sol";

/**
 * @title Transfer Manager module that uses a shared whitelist for core transfer validation functionality
 */
contract SharedWhitelistTransferManagerStorage {

    bytes32 public constant WHITELIST = "WHITELIST";
    bytes32 public constant INVESTORSKEY = 0xdf3a8dd24acdd05addfc6aeffef7574d2de3f844535ec91e8e0f3e45dba96731; //keccak256(abi.encodePacked("INVESTORS"))
    bytes32 public constant INVESTORFLAGS = "INVESTORFLAGS";
    uint256 internal constant ONE = uint256(1);

    enum TransferType { GENERAL, ISSUANCE, REDEMPTION }

    //Address where the whitelist data is stored
    IDataStore public whitelistDataStore;

    //Address from which issuances come
    address public issuanceAddress;

    // Allows all TimeRestrictions to be offset
    struct Defaults {
        uint64 canSendAfter;
        uint64 canReceiveAfter;
    }

    // Offset to be applied to all timings (except KYC expiry)
    Defaults public defaults;

    struct TransferRequirements {
        bool fromValidKYC;
        bool toValidKYC;
        bool fromRestricted;
        bool toRestricted;
    }

    mapping(uint8 => TransferRequirements) public transferRequirements;
    // General = 0, Issuance = 1, Redemption = 2
}
