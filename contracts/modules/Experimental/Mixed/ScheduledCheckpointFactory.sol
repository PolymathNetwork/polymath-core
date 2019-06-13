pragma solidity 0.5.8;

import "./ScheduledCheckpoint.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract ScheduledCheckpointFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
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
        name = "ScheduledCheckpoint";
        title = "Schedule Checkpoints";
        description = "Allows you to schedule checkpoints in the future";
        typesData.push(4);
        typesData.push(2);
        tagsData.push("Scheduled");
        tagsData.push("Checkpoint");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address scheduledCheckpoint = address(new ScheduledCheckpoint(msg.sender, polymathRegistry.getAddress("PolyToken")));
        _initializeModule(scheduledCheckpoint, _data);
        return scheduledCheckpoint;
    }

}
