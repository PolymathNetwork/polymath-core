pragma solidity ^0.5.0;

import "../../Pausable.sol";
import "../Module.sol";
import "../../interfaces/ITransferManager.sol";

/**
 * @title Base abstract contract to be implemented by all Transfer Manager modules
 */
contract TransferManager is ITransferManager, Module, Pausable {
  
    function unpause() public {
        _onlySecurityTokenOwner();
        super._unpause();
    }

    function pause() public {
        _onlySecurityTokenOwner();
        super._pause();
    }
}
