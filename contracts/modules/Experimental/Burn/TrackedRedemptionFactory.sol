pragma solidity 0.5.8;

import "./TrackedRedemption.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralTransferManager module
 */
contract TrackedRedemptionFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of module
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor(
        uint256 _setupCost,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public ModuleFactory(_setupCost, _polymathRegistry, _isCostInPoly)
    {
        initialVersion = "3.0.0";
        name = "TrackedRedemption";
        title = "Tracked Redemption";
        description = "Track token redemptions";
        typesData.push(5);
        tagsData.push("Tracked");
        tagsData.push("Redemption");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
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
        address trackedRedemption = address(new TrackedRedemption(msg.sender, polymathRegistry.getAddress("PolyToken")));
        _initializeModule(trackedRedemption, _data);
        return trackedRedemption;
    }

}
