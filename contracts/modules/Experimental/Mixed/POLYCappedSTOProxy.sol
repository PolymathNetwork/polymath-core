pragma solidity ^0.5.0;

import "../../../proxy/OwnedUpgradeabilityProxy.sol";
import "../../../Pausable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "../../../storage/modules/STO/STOStorage.sol";
import "../../../storage/modules/ModuleStorage.sol";
import "./POLYCappedSTOStorage.sol";

/**
 * @title POLYCappedSTO module Proxy
 */
contract POLYCappedSTOProxy is POLYCappedSTOStorage, STOStorage, ModuleStorage, Pausable, ReentrancyGuard, OwnedUpgradeabilityProxy {

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
        require(
            _implementation != address(0),
            "Implementation address should not be 0x"
        );
        _upgradeTo(_version, _implementation);
    }

}
