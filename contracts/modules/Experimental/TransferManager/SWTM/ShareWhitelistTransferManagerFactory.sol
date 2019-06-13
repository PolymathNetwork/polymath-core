pragma solidity ^0.5.0;

import "./SharedWhitelistTransferManagerProxy.sol";
import "../../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying SharedWhitelistTransferManager module
 */
contract SharedWhitelistTransferManagerFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "SharedWhitelistTransferManager";
        title = "Share Whitelist Transfer Manager";
        description = "Manage transfers using a shared time based whitelist";
        typesData.push(2);
        tagsData.push("Shared Whitelist");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address sharedWhitelistTransferManager = address(new SharedWhitelistTransferManagerProxy(logicContracts[latestUpgrade].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(sharedWhitelistTransferManager, _data);
        return sharedWhitelistTransferManager;
    }

}
