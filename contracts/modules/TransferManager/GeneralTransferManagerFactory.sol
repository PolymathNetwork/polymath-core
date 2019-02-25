pragma solidity ^0.5.0;

import "../../proxy/GeneralTransferManagerProxy.sol";
import "../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying GeneralTransferManager module
 */
contract GeneralTransferManagerFactory is UpgradableModuleFactory {

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
        name = "GeneralTransferManager";
        title = "General Transfer Manager";
        description = "Manage transfers using a time based whitelist";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
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
        address generalTransferManager = address(new GeneralTransferManagerProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(generalTransferManager, _data);
        return generalTransferManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](2);
        res[0] = 2;
        res[1] = 6;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "General";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
