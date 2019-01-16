pragma solidity ^0.5.0;

import "../../../Pausable.sol";
import "../../Module.sol";

/**
 * @title Interface to be implemented by all Wallet modules
 * @dev abstract contract
 */
contract IWallet is Module, Pausable {

    function unpause() public onlyOwner {
        super._unpause();
    }

    function pause() public onlyOwner {
        super._pause();
    }
}
