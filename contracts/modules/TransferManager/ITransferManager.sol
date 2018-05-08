pragma solidity ^0.4.23;

import "../../interfaces/IModule.sol";


contract ITransferManager is IModule {

    event Pause(uint256 _timestammp);
    event Unpause(uint256 _timestamp);

    bool public paused = false;

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner public {
    require(!paused);
    paused = true;
    emit Pause(now);
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner public {
    require(paused);
    paused = false;
    emit Unpause(now);
  }

  function verifyTransfer(address _from, address _to, uint256 _amount) public view returns(bool);

}
