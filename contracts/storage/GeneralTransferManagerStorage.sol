pragma solidity ^0.5.0;

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManagerStorage {

    bytes32 public constant WHITELIST = "WHITELIST";
    bytes32 public constant FLAGS = "FLAGS";

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address which can sign whitelist changes
    address public signingAddress = address(0);

/*
    //from and to timestamps that an investor can send / receive tokens respectively
    struct TimeRestriction {
        uint64 fromTime;
        uint64 toTime;
        uint64 expiryTime;
        uint8 canBuyFromSTO;
        uint8 added;
    }

    // An address can only send / receive tokens once their corresponding uint256 > block.number
    // (unless allowAllTransfers == true or allowAllWhitelistTransfers == true)
    mapping (address => TimeRestriction) public whitelist;
*/
    // Allows all TimeRestrictions to be offset
    struct Defaults {
        uint64 fromTime;
        uint64 toTime;
    }

    // Offset to be applied to all timings (except KYC expiry)
    Defaults public defaults;

    // List of all addresses that have been added to the GTM at some point
    address[] public investors;

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
    
}
