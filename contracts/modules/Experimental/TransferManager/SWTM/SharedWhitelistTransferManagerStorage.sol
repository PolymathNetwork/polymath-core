pragma solidity ^0.5.0;

import "../../../../interfaces/IDataStore.sol";

/**
 * @title Transfer Manager module that uses a shared whitelist for core transfer validation functionality
 */
contract SharedWhitelistTransferManagerStorage {

    //Address where the whitelist data is stored
    IDataStore public whitelistDataStore;
}
