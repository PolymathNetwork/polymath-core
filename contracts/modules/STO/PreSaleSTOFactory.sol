pragma solidity ^0.4.24;

import "./PreSaleSTO.sol";
import "../../interfaces/IModuleFactory.sol";
import "../../interfaces/IModule.sol";

/**
 * @title Factory for deploying PreSaleSTO module
 */
contract PreSaleSTOFactory is IModuleFactory {

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
        if (setupCost > 0) {
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        }
        //Check valid bytes - can only call module init function
        PreSaleSTO preSaleSTO = new PreSaleSTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(getSig(_data) == preSaleSTO.getInitFunction(), "Provided data is not valid");
        require(address(preSaleSTO).call(_data), "Un-successfull call");
        emit LogGenerateModuleFromFactory(address(preSaleSTO), getName(), address(this), msg.sender, now);
        return address(preSaleSTO);
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 3;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "PreSaleSTO";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Allows Issuer to configure pre-sale token allocations";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "PreSale STO";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Configure and track pre-sale token allocations";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](1);
        availableTags[0] = "Presale";
        return availableTags;
    }

}
