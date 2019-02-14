pragma solidity ^0.5.0;

import "../../proxy/EtherDividendCheckpointProxy.sol";
import "../../libraries/Util.sol";
import "../../interfaces/IBoot.sol";
import "../UpgradableModuleFactory.sol";

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
        UpgradableModuleFactory(_setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        version = "2.1.0";
        name = "EtherDividendCheckpoint";
        title = "Ether Dividend Checkpoint";
        description = "Create ETH dividends for token holders at a specific checkpoint";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address ethDividendCheckpoint = address(new EtherDividendCheckpointProxy(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(ethDividendCheckpoint, _data);
        return ethDividendCheckpoint;
    }

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 4;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ETH";
        availableTags[1] = "Checkpoint";
        availableTags[2] = "Dividend";
        return availableTags;
    }
}
