pragma solidity ^0.4.24;

import "./EtherDividendCheckpoint.sol";
import "../../interfaces/IModuleFactory.sol";

/**
 * @title Factory for deploying EtherDividendCheckpoint module
 */
contract EtherDividendCheckpointFactory is IModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    IModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {

    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new EtherDividendCheckpoint(msg.sender, address(polyToken)));
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 4;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "EtherDividendCheckpoint";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Create ETH dividends for token holders at a specific checkpoint";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public  view returns(string) {
        return "Ether Dividend Checkpoint";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Create a dividend which will be paid out to token holders proportional to their balances at the point the dividend is created";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ETH";
        availableTags[1] = "Checkpoint";
        availableTags[2] = "Dividend";
        return availableTags;
    }
}
