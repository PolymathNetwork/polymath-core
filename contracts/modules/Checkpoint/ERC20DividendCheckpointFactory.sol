pragma solidity ^0.4.24;

import "./ERC20DividendCheckpoint.sol";
import "../ModuleFactory.sol";

/**
 * @title Factory for deploying ERC20DividendCheckpoint module
 */
contract ERC20DividendCheckpointFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "ERC20DividendCheckpoint";
        title = "ERC20 Dividend Checkpoint";
        description = "Create ERC20 dividends for token holders at a specific checkpoint";
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
        address erc20DividendCheckpoint = new ERC20DividendCheckpoint(msg.sender, address(polyToken));
        emit GenerateModuleFromFactory(erc20DividendCheckpoint, getName(), address(this), msg.sender, setupCost, now);
        return erc20DividendCheckpoint;
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
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return name;
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() external view returns(string) {
        return description;
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() external  view returns(string) {
        return title;
    }

    /**
     * @notice Get the version of the Module
     */
    function getVersion() external view returns(string) {
        return version;
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() external view returns(string) {
        return "Create a ERC20 dividend which will be paid out to token holders proportional to their balances at the point the dividend is created";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "ERC20";
        availableTags[1] = "Dividend";
        availableTags[2] = "Checkpoint";
        return availableTags;
    }
}
