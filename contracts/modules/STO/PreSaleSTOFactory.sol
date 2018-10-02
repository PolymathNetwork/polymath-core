pragma solidity ^0.4.24;

import "./PreSaleSTO.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying PreSaleSTO module
 */
contract PreSaleSTOFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "PreSaleSTO";
        title = "PreSale STO";
        description = "Allows Issuer to configure pre-sale token allocations";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if (setupCost > 0) {
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Sufficent Allowance is not provided");
        }
        //Check valid bytes - can only call module init function
        PreSaleSTO preSaleSTO = new PreSaleSTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == preSaleSTO.getInitFunction(), "Invalid data");
        require(address(preSaleSTO).call(_data), "Unsuccessfull call");
        emit GenerateModuleFromFactory(address(preSaleSTO), getName(), address(this), msg.sender, setupCost, now);
        return address(preSaleSTO);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 3;
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
    function getTitle() external view returns(string) {
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
        return "Configure and track pre-sale token allocations";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](1);
        availableTags[0] = "Presale";
        return availableTags;
    }

}
