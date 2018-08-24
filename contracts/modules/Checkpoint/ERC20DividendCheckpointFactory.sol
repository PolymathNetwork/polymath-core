pragma solidity ^0.4.24;

import "./ERC20DividendCheckpoint.sol";
import "../../interfaces/IModuleFactory.sol";

/**
 * @title Factory for deploying ERC20DividendCheckpoint module
 */
contract ERC20DividendCheckpointFactory is IModuleFactory {

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
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new ERC20DividendCheckpoint(msg.sender, address(polyToken)));
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
        return "ERC20DividendCheckpoint";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Create ERC20 dividends for token holders at a specific checkpoint";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public  view returns(string) {
        return "ERC20 Dividend Checkpoint";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Create a ERC20 dividend which will be paid out to token holders proportional to their balances at the point the dividend is created";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ERC20";
        availableTags[1] = "Dividend";
        availableTags[2] = "Checkpoint";
        return availableTags;
    }
}
