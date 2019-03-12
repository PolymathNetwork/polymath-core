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

    function unpause() public {
        _onlySecurityTokenOwner();
        super._unpause();
    }

    function pause() public {
        _onlySecurityTokenOwner();
        super._pause();
    }

    // Provide default versions of ERC1410 functions that can be overriden

    /**
     * @notice return the amount of tokens for a given user as per the partition
     */
    function getTokensByPartition(bytes32 /*_partition*/, address /*_tokenHolder*/) external view returns(uint256){
        return 0;
    }

    /**
     * @notice return the amount of tokens for a given user as per the partition
     */
    function getPartitions(address /*_tokenHolder*/) external view returns(bytes32[] memory) {
        return new bytes32[](0);
    }

}
