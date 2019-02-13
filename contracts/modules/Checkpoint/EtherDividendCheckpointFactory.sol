pragma solidity ^0.5.0;

import "../../proxy/EtherDividendCheckpointProxy.sol";
import "../../libraries/Util.sol";
import "../../interfaces/IBoot.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract EtherDividendCheckpointFactory is ModuleFactory {
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
        name = "EtherDividendCheckpoint";
        title = "Ether Dividend Checkpoint";
        description = "Create ETH dividends for token holders at a specific checkpoint";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyToken = _takeFee();
        address ethDividendCheckpoint = address(new EtherDividendCheckpointProxy(msg.sender, address(polyToken), logicContract));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IBoot(ethDividendCheckpoint).getInitFunction(), "Invalid data");
        /*solium-disable-next-line security/no-low-level-calls*/
        bool success;
        (success, ) = ethDividendCheckpoint.call(_data);
        require(success, "Unsuccessful call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(ethDividendCheckpoint, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return ethDividendCheckpoint;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 4;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        return "Create a dividend which will be paid out to token holders proportionally according to their balances at the point the dividend is created";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ETH";
        availableTags[1] = "Checkpoint";
        availableTags[2] = "Dividend";
        return availableTags;
    }
}
