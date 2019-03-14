pragma solidity ^0.5.0;

import "../../UpgradableModuleFactory.sol";
import "./ManualApprovalTransferManagerProxy.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract ManualApprovalTransferManagerFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "ManualApprovalTransferManager";
        title = "Manual Approval Transfer Manager";
        description = "Manage transfers using single approvals";
        typesData.push(2);
        tagsData.push("Manual Approval");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
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
        address manualTransferManager = address(new ManualApprovalTransferManagerProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(manualTransferManager, _data);
        return manualTransferManager;
    }

}
