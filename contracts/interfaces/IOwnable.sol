pragma solidity ^0.4.24;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
interface IOwnable {
  /**
   * @dev Returns owner
   */
  function owner() external view returns (address);

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   */
  function renounceOwnership() external;

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) external;

}
