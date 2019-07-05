pragma solidity 0.5.8;

import "../storage/EternalStorage.sol";
import "./OwnedUpgradeabilityProxy.sol";

/**
 * @title SecurityTokenRegistryProxy
 * @dev This proxy holds the storage of the SecurityTokenRegistry contract and delegates every call to the current implementation set.
 * Besides, it allows to upgrade the SecurityTokenRegistry's behaviour towards further implementations, and provides basic
 * authorization control functionalities
 */
/*solium-disable-next-line no-empty-blocks*/
contract SecurityTokenRegistryProxy is EternalStorage, OwnedUpgradeabilityProxy {

}
