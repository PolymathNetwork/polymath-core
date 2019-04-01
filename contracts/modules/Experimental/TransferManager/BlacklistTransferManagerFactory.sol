pragma solidity ^0.5.0;

import "./BlacklistTransferManager.sol";
import "../../ModuleFactory.sol";
import "../../../libraries/Util.sol";

/**
 * @title Factory for deploying BlacklistManager module
 */
contract BlacklistTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public ModuleFactory(_setupCost, _usageCost, _polymathRegistry, _isCostInPoly)
    {
        initialVersion = "3.0.0";
        name = "BlacklistTransferManager";
        title = "Blacklist Transfer Manager";
        description = "Automate blacklist to restrict selling";
        typesData.push(2);
        tagsData.push("Blacklist");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address blacklistTransferManager = address(new BlacklistTransferManager(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(blacklistTransferManager, _data);
        return blacklistTransferManager;
    }

}
