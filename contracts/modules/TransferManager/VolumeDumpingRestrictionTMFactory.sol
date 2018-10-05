pragma solidity ^0.4.24;

import "./VolumeDumpingRestrictionTM.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying VolumeRestrictionManager module
 */
contract VolumeDumpingRestrictionTMFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "VolumeDumpingTransferManager";
        title = "Volume Dumping Transfer Manager";
        description = "Manage the volume of tokens dumpable by an owner";
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
        address volumeDumpingRestrictionTransferManager = new VolumeDumpingRestrictionTM(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(address(volumeDumpingRestrictionTransferManager), getName(), address(this), msg.sender, now);
        return address(volumeDumpingRestrictionTransferManager);
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
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to restrict the total number of tokens dumpable withing a rolling period";
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the version of the Module
     */
    function getVersion() external view returns(string) {
        return version;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "VolumeDumping";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

    
}
