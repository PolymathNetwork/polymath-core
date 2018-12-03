pragma solidity ^0.4.24;

import "../../proxy/EtherDividendCheckpointProxy.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract EtherDividendCheckpointFactory is ModuleFactory {

    address public logicContract;

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _logicContract) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        require(_logicContract != address(0), "Invalid logic contract");
        version = "1.0.0";
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
    function deploy(bytes /* _data */) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Insufficent allowance or balance");
        address ethDividendCheckpoint = new EtherDividendCheckpointProxy(msg.sender, address(polyToken), logicContract);
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(ethDividendCheckpoint, getName(), address(this), msg.sender, setupCost, now);
        return ethDividendCheckpoint;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 4;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        return "Create a dividend which will be paid out to token holders proportionally according to their balances at the point the dividend is created";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ETH";
        availableTags[1] = "Checkpoint";
        availableTags[2] = "Dividend";
        return availableTags;
    }
}
