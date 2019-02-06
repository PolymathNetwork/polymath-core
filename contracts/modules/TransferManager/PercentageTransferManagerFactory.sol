pragma solidity ^0.5.0;

import "../ModuleFactory.sol";
import "../../libraries/Util.sol";
import "../../proxy/PercentageTransferManagerProxy.sol";
import "../../interfaces/IBoot.sol";

/**
 * @title Factory for deploying PercentageTransferManager module
 */
contract PercentageTransferManagerFactory is ModuleFactory {

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
        require(_logicContract != address(0), "Invalid address");
        version = "1.0.0";
        name = "PercentageTransferManager";
        title = "Percentage Transfer Manager";
        description = "Restrict the number of investors";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyToken = _takeFee();
        address percentageTransferManager = address(new PercentageTransferManagerProxy(msg.sender, polyToken, logicContract));
        require(Util.getSig(_data) == IBoot(percentageTransferManager).getInitFunction(), "Provided data is not valid");
        bool success;
        /*solium-disable-next-line security/no-low-level-calls*/
        (success, ) = percentageTransferManager.call(_data);
        require(success, "Unsuccessful call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(percentageTransferManager, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return percentageTransferManager;
    }

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        return "Allows an issuer to restrict the total number of non-zero token holders";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Percentage";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
