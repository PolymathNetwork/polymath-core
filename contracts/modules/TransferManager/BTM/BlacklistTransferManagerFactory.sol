pragma solidity ^0.5.0;

import "../../UpgradableModuleFactory.sol";
import "./BlacklistTransferManagerProxy.sol";

/**
 * @title Factory for deploying BlacklistTransferManager module
 */
contract BlacklistTransferManagerFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
      * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor(
        uint256 _setupCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public UpgradableModuleFactory("3.0.0", _setupCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "BlacklistTransferManager";
        title = "Blacklist Transfer Manager";
        description = "Automate blacklist to restrict selling";
        typesData.push(2);
        tagsData.push("Blacklist");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address blacklistTransferManager = address(new BlacklistTransferManagerProxy(logicContracts[latestUpgrade].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(blacklistTransferManager, _data);
        return blacklistTransferManager;
    }

}
