pragma solidity ^0.5.0;

import "../UpgradableModuleFactory.sol";
import "../../libraries/Util.sol";
import "../../proxy/PercentageTransferManagerProxy.sol";
import "../../interfaces/IBoot.sol";

/**
 * @title Factory for deploying PercentageTransferManager module
 */
contract PercentageTransferManagerFactory is UpgradableModuleFactory {

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
        version = "1.0.0";
        name = "PercentageTransferManager";
        title = "Percentage Transfer Manager";
        description = "Restrict the number of investors";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address percentageTransferManager = address(new PercentageTransferManagerProxy(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(percentageTransferManager, _data);
        return percentageTransferManager;
    }

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Percentage";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
