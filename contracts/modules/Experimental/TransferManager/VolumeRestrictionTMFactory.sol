pragma solidity ^0.4.24;

import "./VolumeRestrictionTM.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying VolumeRestrictionTM module
 */
contract VolumeRestrictionTMFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "VolumeRestrictionTM";
        title = "Volume Restriction Transfer Manager";
        description = "Manage transfers based on the volume of tokens that needs to be transact";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }


     /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Sufficent Allowance is not provided");
        address VolumeRestrictionTransferManager = new VolumeRestrictionTM(msg.sender, address(polyToken));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(VolumeRestrictionTransferManager), getName(), address(this), msg.sender, setupCost, now);
        return address(VolumeRestrictionTransferManager);
    }


    /**
     * @notice Type of the Module factory
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
        /*solium-disable-next-line max-len*/
        return "";   /// TODO - need to add the Instruction for module
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Maximum Volume";
        availableTags[1] = "Transfer Restriction";
        availableTags[2] = "Daily Restriction";
        return availableTags;
    }

}