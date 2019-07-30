pragma solidity 0.5.8;

/**
 * @title Utility contract to allow pausing and unpausing of certain functions
 */
contract Pausable {
    event Pause(address account);
    event Unpause(address account);

    bool public paused = false;

    /**
    * @notice Modifier to make a function callable only when the contract is not paused.
    */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is paused.
    */
    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    /**
    * @notice Called by the owner to pause, triggers stopped state
    */
    function _pause() internal whenNotPaused {
        paused = true;
        /*solium-disable-next-line security/no-block-members*/
        emit Pause(msg.sender);
    }

    /**
    * @notice Called by the owner to unpause, returns to normal state
    */
    function _unpause() internal whenPaused {
        paused = false;
        /*solium-disable-next-line security/no-block-members*/
        emit Unpause(msg.sender);
    }

}
