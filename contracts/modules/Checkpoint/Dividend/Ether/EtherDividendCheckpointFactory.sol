pragma solidity 0.5.8;

import "./EtherDividendCheckpointProxy.sol";
import "../../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract EtherDividendCheckpointFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
      * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "EtherDividendCheckpoint";
        title = "Ether Dividend Checkpoint";
        description = "Create ETH dividends for token holders at a specific checkpoint";
        typesData.push(4);
        tagsData.push("Ether");
        tagsData.push("Dividend");
        tagsData.push("Checkpoint");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address ethDividendCheckpoint = address(new EtherDividendCheckpointProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(ethDividendCheckpoint, _data);
        return ethDividendCheckpoint;
    }

}
