pragma solidity 0.5.8;

import "./VolumeRestrictionTMProxy.sol";
import "../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying VolumeRestrictionTM module
 */
contract VolumeRestrictionTMFactory is UpgradableModuleFactory {

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
        name = "VolumeRestrictionTM";
        title = "Volume Restriction Transfer Manager";
        description = "Manage transfers based on the volume of tokens that needs to be transact";
        typesData.push(2);
        typesData.push(6);
        tagsData.push("Rolling Period");
        tagsData.push("Volume");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

     /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address volumeRestrictionTransferManager = address(new VolumeRestrictionTMProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(volumeRestrictionTransferManager, _data);
        return volumeRestrictionTransferManager;
    }

}
