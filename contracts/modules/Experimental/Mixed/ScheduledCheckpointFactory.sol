pragma solidity ^0.4.24;

import "./ScheduledCheckpoint.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract ScheduledCheckpointFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _polymathRegistry) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost, _polymathRegistry)
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
    function deploy(bytes /* _data */) external returns(address) {
        _takeSetupCost();
        address scheduledCheckpoint = new ScheduledCheckpoint(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(scheduledCheckpoint, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return scheduledCheckpoint;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](2);
        res[0] = 4;
        res[1] = 2;
        return res;
    }
    
    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() external view returns(string) {
        return "Schedule a series of future checkpoints by specifying a start time and interval of each checkpoint";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Scheduled";
        availableTags[1] = "Checkpoint";
        return availableTags;
    }
}
