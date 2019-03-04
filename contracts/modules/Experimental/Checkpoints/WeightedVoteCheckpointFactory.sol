pragma solidity ^0.5.0;

import "./WeightedVoteCheckpoint.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying WeightedVoteCheckpoint module
 */
contract WeightedVoteCheckpointFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        initialVersion = "3.0.0";
        name = "WeightedVoteCheckpoint";
        title = "Weighted Vote Checkpoint";
        description = "Weighted votes based on token amount";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));

    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address weightedVoteCheckpoint = address(new WeightedVoteCheckpoint(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(weightedVoteCheckpoint, _data);
        return weightedVoteCheckpoint;
    }

     /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 4;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "Vote";
        availableTags[1] = "Checkpoint";
        availableTags[2] = "Transparent";
        return availableTags;
    }
}
