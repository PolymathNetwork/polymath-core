pragma solidity ^0.4.24;

import "./LockupVolumeRestrictionTM.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying ManualApprovalTransferManager module
 */
contract LockupVolumeRestrictionTMFactory is ModuleFactory {

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
        name = "LockupVolumeRestrictionTM";
        title = "Lockup Volume Restriction Transfer Manager";
        description = "Manage transfers using lock ups over time";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        LockupVolumeRestrictionTM lockupVolumeRestrictionTransferManager = new LockupVolumeRestrictionTM(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(address(lockupVolumeRestrictionTransferManager), getName(), address(this), msg.sender, now);
        return address(lockupVolumeRestrictionTransferManager);
    }

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }
   
    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        return "Allows an issuer to set lockup periods for user addresses, with funds distributed over time. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Volume";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
