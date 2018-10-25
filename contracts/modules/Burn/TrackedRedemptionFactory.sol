pragma solidity ^0.4.24;

import "./TrackedRedemption.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralTransferManager module
 */
contract TrackedRedemptionFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of module
     * @param _usageCost Usage cost of module
     * @param _subscriptionCost Monthly cost of module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "TrackedRedemption";
        title = "Tracked Redemption";
        description = "Track token redemptions";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        address trackedRedemption = new TrackedRedemption(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(address(trackedRedemption), getName(), address(this), msg.sender, setupCost, now);
        return address(trackedRedemption);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 5;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        return "Allows an investor to redeem security tokens which are tracked by this module";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Redemption";
        availableTags[1] = "Tracked";
        return availableTags;
    }

}
