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
        version = "1.0.0";
        name = "TrackedRedemption";
        title = "Tracked Redemption";
        description = "Track token redemptions";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(
        bytes calldata /* _data */
    )
        external
        returns(address)
    {
        address polyToken = _takeFee();
        address trackedRedemption = address(new TrackedRedemption(msg.sender, polyToken));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(trackedRedemption, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return trackedRedemption;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 5;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        return "Allows an investor to redeem security tokens which are tracked by this module";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Redemption";
        availableTags[1] = "Tracked";
        return availableTags;
    }

}
