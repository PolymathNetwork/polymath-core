pragma solidity ^0.5.0;

import "../../../../proxy/OwnedUpgradeabilityProxy.sol";
import "./SharedWhitelistTransferManagerStorage.sol";
import "../../../../Pausable.sol";
import "../../../../storage/modules/ModuleStorage.sol";
import "../../../TransferManager/BaseWhitelistTransferManagerStorage.sol";

/**
 * @title Transfer Manager module that uses a shared whitelist for core transfer validation functionality
 */
contract SharedWhitelistTransferManagerProxy is BaseWhitelistTransferManagerStorage, SharedWhitelistTransferManagerStorage, ModuleStorage, Pausable, OwnedUpgradeabilityProxy {
    /**
    * @notice Constructor
    * @param _securityToken Address of the security token
    * @param _polyAddress Address of the polytoken
    * @param _implementation representing the address of the new implementation to be set
    */
    constructor(
        string memory _version,
        address _securityToken,
        address _polyAddress,
        address _implementation
    )
        public
        ModuleStorage(_securityToken, _polyAddress)
    {
        require(_implementation != address(0), "Implementation address should not be 0x");
        _upgradeTo(_version, _implementation);
        transferRequirements[uint8(TransferType.GENERAL)] = TransferRequirements(true, true, true, true);
        transferRequirements[uint8(TransferType.ISSUANCE)] = TransferRequirements(false, true, false, false);
        transferRequirements[uint8(TransferType.REDEMPTION)] = TransferRequirements(true, false, false, false);
    }

}
