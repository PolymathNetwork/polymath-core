pragma solidity ^0.4.24;

import "../storage/EternalStorage.sol";
import "./OwnedUpgradeabilityProxy.sol";


/**
 * @title SecurityTokenRegistryProxy
 * @dev This proxy holds the storage of the token contract and delegates every call to the current implementation set.
 * Besides, it allows to upgrade the token's behaviour towards further implementations, and provides basic
 * authorization control functionalities
 */
contract SecurityTokenRegistryProxy is EternalStorage, OwnedUpgradeabilityProxy {

}