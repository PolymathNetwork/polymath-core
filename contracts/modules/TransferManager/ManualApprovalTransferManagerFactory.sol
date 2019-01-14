pragma solidity ^0.5.0;

import "../ModuleFactory.sol";
import "../../proxy/ManualApprovalTransferManagerProxy.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract ManualApprovalTransferManagerFactory is ModuleFactory {
    address public logicContract;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     */
    constructor(uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _logicContract)
        public
        ModuleFactory(_setupCost, _usageCost, _subscriptionCost)
    {
        require(_logicContract != address(0), "Invalid address");
        version = "2.0.1";
        name = "ManualApprovalTransferManager";
        title = "Manual Approval Transfer Manager";
        description = "Manage transfers using single approvals / blocking";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata /* _data */
    ) external returns (address) {
        address polyToken = _takeFee();
        ManualApprovalTransferManagerProxy manualTransferManager = new ManualApprovalTransferManagerProxy(
            msg.sender,
            polyToken,
            logicContract
        );
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(manualTransferManager), getName(), address(this), msg.sender, setupCost, now);
        return address(manualTransferManager);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns (uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns (string memory) {
        /*solium-disable-next-line max-len*/
        return "Allows an issuer to set manual approvals or blocks for specific pairs of addresses and amounts. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns (bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "ManualApproval";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
