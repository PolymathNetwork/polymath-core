pragma solidity ^0.5.0;

import "../../proxy/GeneralTransferManagerProxy.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying GeneralTransferManager module
 */
contract GeneralTransferManagerFactory is ModuleFactory {
    address public logicContract;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public
        ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        require(_logicContract != address(0), "Invalid logic contract");
        version = "2.1.0";
        name = "GeneralTransferManager";
        title = "General Transfer Manager";
        description = "Manage transfers using a time based whitelist";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata /* _data */
    )
        external
        returns(address)
    {
        address polyToken = _takeFee();
        GeneralTransferManagerProxy generalTransferManager = new GeneralTransferManagerProxy(msg.sender, polyToken, logicContract);
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(generalTransferManager), getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return address(generalTransferManager);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](2);
        res[0] = 2;
        res[1] = 6;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        /*solium-disable-next-line max-len*/
        return "Allows an issuer to maintain a time based whitelist of authorised token holders.Addresses are added via modifyWhitelist and take a fromTime (the time from which they can send tokens) and a toTime (the time from which they can receive tokens). There are additional flags, allowAllWhitelistIssuances, allowAllWhitelistTransfers & allowAllTransfers which allow you to set corresponding contract level behaviour. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "General";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
