pragma solidity ^0.4.24;

import "./Proxy.sol";
import "../storage/UpgradeabilityStorage.sol";
import 'openzeppelin-solidity/contracts/AddressUtils.sol';

/**
 * @title UpgradeabilityProxy
 * @dev This contract represents a proxy where the implementation address to which it will delegate can be upgraded
 */
contract UpgradeabilityProxy is Proxy, UpgradeabilityStorage {
  /**
  * @dev This event will be emitted every time the implementation gets upgraded
  * @param _newVersion representing the version name of the upgraded implementation
  * @param _newImplementation representing the address of the upgraded implementation
  */
  event Upgraded(string _newVersion, address indexed _newImplementation);

  /**
  * @dev Upgrades the implementation address
  * @param _newVersion representing the version name of the new implementation to be set
  * @param _newImplementation representing the address of the new implementation to be set
  */
  function _upgradeTo(string _newVersion, address _newImplementation) internal {
    require(_implementation != _newImplementation && _newImplementation != address(0), "Old address is not allowed and implementation address should not be 0x");
    require(AddressUtils.isContract(_newImplementation), "Cannot set a proxy implementation to a non-contract address");
    require(bytes(_newVersion).length > 0, "Version should not be empty string");
    require(keccak256(abi.encodePacked(_version)) != keccak256(abi.encodePacked(_newVersion)));
    _version = _newVersion;
    _implementation = _newImplementation;
    emit Upgraded(_newVersion, _newImplementation);
  }
}