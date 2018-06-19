pragma solidity ^0.4.24;

import "./PercentageTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";

/**
 * @title Factory for deploying PercentageTransferManager module
 */
contract PercentageTransferManagerFactory is IModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      IModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {

    }

    /**
     * @notice used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        PercentageTransferManager percentageTransferManager = new PercentageTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == percentageTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(percentageTransferManager).call(_data), "Un-successfull call");
        emit LogGenerateModuleFromFactory(address(percentageTransferManager), getName(), address(this), msg.sender, now);
        return address(percentageTransferManager);

    }

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function getType() public view returns(uint8) {
        return 2;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "PercentageTransferManager";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Restrict the number of investors";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "Percentage Transfer Manager";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to restrict the total number of non-zero token holders";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Percentage";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
