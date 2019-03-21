pragma solidity ^0.5.0;

/**
 * @title Interface to be implemented by upgradable token factories
 */
interface IUpgradableTokenFactory {

  /**
   * @notice Used to upgrade a token
   */
  function upgradeToken() external;

}
