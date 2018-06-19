pragma solidity ^0.4.24;

import "./ManualApprovalTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract ManualApprovalTransferManagerFactory is IModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      IModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {

    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        address manualTransferManager = new ManualApprovalTransferManager(msg.sender, address(polyToken));
        emit LogGenerateModuleFromFactory(address(manualTransferManager), getName(), address(this), msg.sender, now);
        return address(manualTransferManager);
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 2;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "ManualApprovalTransferManager";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Manage transfers using single approvals / blocking";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "Manual Approval Transfer Manager";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to set manual approvals or blocks for specific pairs of addresses and amounts. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "ManualApproval";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
