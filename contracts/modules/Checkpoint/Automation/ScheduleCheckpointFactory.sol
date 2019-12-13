pragma solidity 0.5.8;

import "./ScheduleCheckpointProxy.sol";
import "../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying ScheduleCheckpoint module
 */
contract ScheduleCheckpointFactory is UpgradableModuleFactory {
    
    
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the key action
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.1.0", _setupCost, _usageCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "ScheduleCheckpoint";
        title = "Schedule Checkpoints";
        description = "Allows you to schedule checkpoints in the future";
        typesData.push(4);
        typesData.push(2);
        tagsData.push("Scheduled");
        tagsData.push("Checkpoint");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
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
        address scheduledCheckpoint = address(new ScheduleCheckpointProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(scheduledCheckpoint, _data);
        return scheduledCheckpoint;
    }

}
