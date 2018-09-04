pragma solidity ^0.4.18;

import './UpgradeabilityProxy.sol';
import '../storage/UpgradeabilityOwnerStorage.sol';

/**
 * @title OwnedUpgradeabilityProxy
 * @dev This contract combines an upgradeability proxy with basic authorization control functionalities
 */
contract OwnedUpgradeabilityProxy is UpgradeabilityOwnerStorage, UpgradeabilityProxy {
  /**
  * @dev Event to show ownership has been transferred
  * @param _previousOwner representing the address of the previous owner
  * @param _newOwner representing the address of the new owner
  */
  event ProxyOwnershipTransferred(address _previousOwner, address _newOwner);

  /**
  * @dev the constructor sets the original owner of the contract to the sender account.
  */
  constructor() public {
    setUpgradeabilityOwner(msg.sender);
  }

  /**
  * @dev Throws if called by any account other than the owner.
  */
  modifier onlyProxyOwner() {
    require(msg.sender == proxyOwner(), "Only proxy owner can call this function");
    _;
  }

  /**
   * @dev Tells the address of the proxy owner
   * @return the address of the proxy owner
   */
  function proxyOwner() public view returns (address) {
    return upgradeabilityOwner();
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferProxyOwnership(address _newOwner) public onlyProxyOwner {
    require(_newOwner != address(0), "Address should not be 0x");
    emit ProxyOwnershipTransferred(proxyOwner(), _newOwner);
    setUpgradeabilityOwner(_newOwner);
  }

  /**
   * @dev Allows the upgradeability owner to upgrade the current version of the proxy.
   * @param _newVersion representing the version name of the new implementation to be set.
   * @param _newImplementation representing the address of the new implementation to be set.
   */
  function upgradeTo(string _newVersion, address _newImplementation) public onlyProxyOwner {
    _upgradeTo(_newVersion, _newImplementation);
  }

  /**
   * @dev Allows the upgradeability owner to upgrade the current version of the proxy and call the new implementation
   * to initialize whatever is needed through a low level call.
   * @param _newVersion representing the version name of the new implementation to be set.
   * @param _newImplementation representing the address of the new implementation to be set.
   * @param _data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   */
  function upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data) payable public onlyProxyOwner {
    upgradeTo(_newVersion, _newImplementation);
    require(address(this).call.value(msg.value)(_data), "Fail in executing the function of implementation contract");
  }
}