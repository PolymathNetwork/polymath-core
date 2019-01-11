pragma solidity ^0.5.0;

import "../../proxy/VolumeRestrictionTMProxy.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying VolumeRestrictionTM module
 */
contract VolumeRestrictionTMFactory is ModuleFactory {
    
    address public logicContract;

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _logicContract) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {   
        require(_logicContract != address(0), "Invalid address");
        version = "1.0.0";
        name = "VolumeRestrictionTM";
        title = "Volume Restriction Transfer Manager";
        description = "Manage transfers based on the volume of tokens that needs to be transact";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }


     /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Insufficent Allowance");
        address volumeRestrictionTransferManager = new VolumeRestrictionTMProxy(msg.sender, address(polyToken), logicContract);
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(volumeRestrictionTransferManager, getName(), address(this), msg.sender, setupCost, now);
        return volumeRestrictionTransferManager;
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
        return "Module used to restrict the volume of tokens traded by the token holders";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](5);
        availableTags[0] = "Maximum Volume";
        availableTags[1] = "Transfer Restriction";
        availableTags[2] = "Daily Restriction";
        availableTags[3] = "Individual Restriction";
        availableTags[4] = "Default Restriction";
        return availableTags;
    }

}