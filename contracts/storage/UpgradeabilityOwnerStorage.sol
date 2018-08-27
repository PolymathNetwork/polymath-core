pragma solidity ^0.4.24;


/**
 * @title UpgradeabilityOwnerStorage
 * @dev This contract keeps track of the upgradeability owner
 */
contract UpgradeabilityOwnerStorage {
  // Owner of the contract
  address private _upgradeabilityOwner;

  /**
   * @dev Tells the address of the owner
   * @return the address of the owner
   */
  function upgradeabilityOwner() public view returns (address) {
    return _upgradeabilityOwner;
  }

  /**
   * @dev Sets the address of the owner
   */
  function setUpgradeabilityOwner(address _newUpgradeabilityOwner) internal {
    require(_newUpgradeabilityOwner != address(0), "Address should not be 0x");
    _upgradeabilityOwner = _newUpgradeabilityOwner;
  }
}