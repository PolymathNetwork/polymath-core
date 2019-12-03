pragma solidity ^0.5.8;

import "./AdvancedPLCRVotingCheckpointProxy.sol";
import "../../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying AdvancedPLCRVotingCheckpoint module
 */
contract AdvancedPLCRVotingCheckpointFactory is UpgradableModuleFactory {
    
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
        initialVersion = "3.1.0";
        name = "AdvancedPLCRVotingCheckpoint";
        title = "CorporateVoting";
        description = "Commit & reveal technique used for voting";
        typesData.push(4);
        tagsData.push("Vote");
        tagsData.push("Checkpoint");
        tagsData.push("PLCR");
        tagsData.push("Advanced");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));

    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address plcrVotingCheckpoint = address(new AdvancedPLCRVotingCheckpointProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(plcrVotingCheckpoint, _data);
        return plcrVotingCheckpoint;
    }
}