pragma solidity ^0.5.0;

import "./TrackedRedemption.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralTransferManager module
 */
contract TrackedRedemptionFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of module
     * @param _usageCost Usage cost of module
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _polymathRegistry
    )
        public
        ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        initialVersion = "3.0.0";
        name = "TrackedRedemption";
        title = "Tracked Redemption";
        description = "Track token redemptions";
        typesData.push(5);
        tagsData.push("Tracked");
        tagsData.push("Redemption");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address trackedRedemption = address(new TrackedRedemption(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(trackedRedemption, _data);
        return trackedRedemption;
    }

}
