pragma solidity ^0.4.23;

contract IPausable {

    event Pause(uint256 _timestammp);
    event Unpause(uint256 _timestamp);

    bool public paused = false;
   
   /**
    * @dev called by the owner to pause, triggers stopped state
    */
    function _pause() internal {
      require(!paused);
      paused = true;
      emit Pause(now);
    }

    /**
    * @dev called by the owner to unpause, returns to normal state
    */
    function _unpause() internal {
      require(paused);
      paused = false;
      emit Unpause(now);
    }

}