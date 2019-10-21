pragma solidity 0.5.8;

import "../../UpgradableModuleFactory.sol";
import "./ManualApprovalTransferManagerProxy.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract ManualApprovalTransferManagerFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
      * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.0.1", _setupCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "ManualApprovalTransferManager";
        title = "Manual Approval Transfer Manager";
        description = "Manage transfers using single approvals";
        typesData.push(2);
        tagsData.push("Manual Approval");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(1));
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
        address manualTransferManager = address(new ManualApprovalTransferManagerProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(manualTransferManager, _data);
        return manualTransferManager;
    }

}
