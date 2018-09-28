pragma solidity ^0.4.24;

import "./VolumeRestrictionTransferManager.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract VolumeRestrictionTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "VolumeRestrictionTransferManager";
        title = "Volume Restriction Transfer Manager";
        description = "Manage transfers using lock ups over time";

    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        address volumeRestrictionTransferManager = new VolumeRestrictionTransferManager(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(address(volumeRestrictionTransferManager), getName(), address(this), msg.sender, now);
        return address(volumeRestrictionTransferManager);
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
        return name;
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return description;
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return title;
    }

    /**
     * @notice Get the version of the Module
     */
    function getVersion() external view returns(string) {
        return version;
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to set lockup periods for user addresses, with funds distributed over time. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Volume";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
