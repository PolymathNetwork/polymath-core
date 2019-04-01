pragma solidity ^0.5.0;

import "./PLCRVotingCheckpoint.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying PLCRVotingCheckpoint module
 */
contract PLCRVotingCheckpointFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        uint256 _usageCost,
        address _polymathRegistry,
        bool _isCostInPoly
    ) 
        public
        ModuleFactory(_setupCost, _usageCost, _polymathRegistry, _isCostInPoly)
    {
        initialVersion = "3.0.0";
        name = "PLCRVotingCheckpoint";
        title = "PLCR Voting Checkpoint";
        description = "Commit & reveal technique used for voting";
        typesData.push(4);
        tagsData.push("Vote");
        tagsData.push("Checkpoint");
        tagsData.push("PLCR");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));

    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address plcrVotingCheckpoint = address(new PLCRVotingCheckpoint(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(plcrVotingCheckpoint, _data);
        return plcrVotingCheckpoint;
    }
}