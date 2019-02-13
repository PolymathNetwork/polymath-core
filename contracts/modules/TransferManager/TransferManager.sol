pragma solidity ^0.5.0;

import "../../Pausable.sol";
import "../Module.sol";
import "../../interfaces/ITransferManager.sol";

/**
 * @title Base abstract contract to be implemented by all Transfer Manager modules
 */
contract TransferManager is ITransferManager, Module, Pausable {
    
    bytes32 public constant LOCKED = "LOCKED";
    bytes32 public constant UNLOCKED = "UNLOCKED";

    modifier onlySecurityToken() {
        require(msg.sender == securityToken, "Sender is not owner");
        _;
    }
    
    function unpause() public onlyOwner {
        super._unpause();
    }

    function pause() public onlyOwner {
        super._pause();
    }
}
