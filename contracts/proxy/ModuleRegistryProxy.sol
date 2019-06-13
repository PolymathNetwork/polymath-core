pragma solidity 0.5.8;

import "../storage/EternalStorage.sol";
import "./OwnedUpgradeabilityProxy.sol";

/**
 * @title ModuleRegistryProxy
 * @dev This proxy holds the storage of the ModuleRegistry contract and delegates every call to the current implementation set.
 * Besides, it allows upgrading the contract's behaviour towards further implementations, and provides basic
 * authorization control functionalities
 */
/*solium-disable-next-line no-empty-blocks*/
contract ModuleRegistryProxy is EternalStorage, OwnedUpgradeabilityProxy {

}
