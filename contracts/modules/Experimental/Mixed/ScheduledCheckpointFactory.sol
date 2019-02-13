pragma solidity ^0.5.0;

import "./ScheduledCheckpoint.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract ScheduledCheckpointFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
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
        name = "ScheduledCheckpoint";
        title = "Schedule Checkpoints";
        description = "Allows you to schedule checkpoints in the future";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata /* _data */
    )
        external
        returns(address)
    {
        address polyToken = _takeFee();
        address scheduledCheckpoint = address(new ScheduledCheckpoint(msg.sender, polyToken));
        emit GenerateModuleFromFactory(scheduledCheckpoint, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return scheduledCheckpoint;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](2);
        res[0] = 4;
        res[1] = 2;
        return res;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() external view returns(string memory) {
        return "Schedule a series of future checkpoints by specifying a start time and interval of each checkpoint";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Scheduled";
        availableTags[1] = "Checkpoint";
        return availableTags;
    }
}
