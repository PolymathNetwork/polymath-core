pragma solidity ^0.5.0;

import "../../proxy/VolumeRestrictionTMProxy.sol";
import "../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying VolumeRestrictionTM module
 */
contract VolumeRestrictionTMFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry) public
    UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "VolumeRestrictionTM";
        title = "Volume Restriction Transfer Manager";
        description = "Manage transfers based on the volume of tokens that needs to be transact";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

     /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address volumeRestrictionTransferManager = address(new VolumeRestrictionTMProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(volumeRestrictionTransferManager, _data);
        return volumeRestrictionTransferManager;
    }


    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](5);
        availableTags[0] = "Maximum Volume";
        availableTags[1] = "Transfer Restriction";
        availableTags[2] = "Daily Restriction";
        availableTags[3] = "Individual Restriction";
        availableTags[4] = "Default Restriction";
        return availableTags;
    }

}
