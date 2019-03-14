pragma solidity ^0.5.0;

import "./EtherDividendCheckpointProxy.sol";
import "../../../libraries/Util.sol";
import "../../../interfaces/IBoot.sol";
import "../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract EtherDividendCheckpointFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "EtherDividendCheckpoint";
        title = "Ether Dividend Checkpoint";
        description = "Create ETH dividends for token holders at a specific checkpoint";
        typesData.push(4);
        tagsData.push("Ether");
        tagsData.push("Dividend");
        tagsData.push("Checkpoint");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address ethDividendCheckpoint = address(new EtherDividendCheckpointProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(ethDividendCheckpoint, _data);
        return ethDividendCheckpoint;
    }

}
