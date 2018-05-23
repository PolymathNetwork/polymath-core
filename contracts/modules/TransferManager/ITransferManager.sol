pragma solidity ^0.4.23;

import "../../interfaces/IModule.sol";


contract ITransferManager is IModule {

    //If verifyTransfer returns:
    //  INVALID, then the transfer should not be allowed regardless of other TM results
    //  NA, then the result from this TM is ignored
    //  VALID, then the transfer is valid for this TM
    enum Result {INVALID, NA, VALID}

    function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result);

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

}
