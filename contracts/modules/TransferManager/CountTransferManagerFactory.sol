pragma solidity ^0.4.24;

import "./CountTransferManager.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying CountTransferManager module
 */
contract CountTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "CountTransferManager";
        title = "Count Transfer Manager";
        description = "Restrict the number of investors";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        updateFromRegistry(msg.sender);
        if (setupCost > 0) {
            require(polyToken.transferFrom(msg.sender, owner(), setupCost), "Failed transferFrom due to insufficent Allowance provided");
        }
        CountTransferManager countTransferManager = new CountTransferManager(msg.sender);
        require(Util.getSig(_data) == countTransferManager.getInitFunction(), "Provided data is not valid");
        /*solium-disable-next-line security/no-low-level-calls*/
        require(address(countTransferManager).call(_data), "Unsuccessful call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(countTransferManager), getName(), address(this), msg.sender, setupCost, now);
        return address(countTransferManager);

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
        return "Allows an issuer to restrict the total number of non-zero token holders";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Count";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
