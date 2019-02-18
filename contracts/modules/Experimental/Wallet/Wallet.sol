pragma solidity ^0.5.0;

import "../../../Pausable.sol";
import "../../Module.sol";

/**
 * @title Interface to be implemented by all Wallet modules
 * @dev abstract contract
 */
contract Wallet is Module, Pausable {

    function unpause() public {
        _onlySecurityTokenOwner();
        super._unpause();
    }

    function pause() public {
        _onlySecurityTokenOwner();
        super._pause();
    }
}
