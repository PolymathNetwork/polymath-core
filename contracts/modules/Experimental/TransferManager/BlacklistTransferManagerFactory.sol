pragma solidity ^0.5.0;

import "./BlacklistTransferManager.sol";
import "../../ModuleFactory.sol";
import "../../../libraries/Util.sol";

/**
 * @title Factory for deploying BlacklistManager module
 */
contract BlacklistTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        version = "2.1.0";
        name = "BlacklistTransferManager";
        title = "Blacklist Transfer Manager";
        description = "Automate blacklist to restrict selling";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata /* _data */) external returns(address) {
        address polyToken = _takeFee();
        address blacklistTransferManager = address(new BlacklistTransferManager(msg.sender, address(polyToken)));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(blacklistTransferManager, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return blacklistTransferManager;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string memory) {
        return "Allows an issuer to blacklist the addresses.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Blacklist";
        availableTags[1] = "Restricted transfer";
        return availableTags;
    }


}
