pragma solidity 0.5.8;

import "../../../../proxy/OwnedUpgradeabilityProxy.sol";
import "./ERC20DividendCheckpointStorage.sol";
import "../../../../storage/modules/Checkpoint/Dividend/DividendCheckpointStorage.sol";
import "../../../../Pausable.sol";
import "../../../../storage/modules/ModuleStorage.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract ERC20DividendCheckpointProxy is ERC20DividendCheckpointStorage, DividendCheckpointStorage, ModuleStorage, Pausable, OwnedUpgradeabilityProxy {
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
    }

}
