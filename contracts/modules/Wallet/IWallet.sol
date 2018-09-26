pragma solidity ^0.4.24;

import "../../Pausable.sol";
import "../Module.sol";

/**
 * @title Interface to be implemented by all Wallet Manager modules
 */
contract IWallet is Pausable, Module {

  function unpause() onlyOwner public {
      super._unpause();
  }

  function pause() onlyOwner public {
      super._pause();
  }

}
