pragma solidity ^0.5.0;

import "./DummySTO.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying DummySTO module
 */
contract DummySTOFactory is ModuleFactory {
    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        uint256 _subscriptionCost
    ) public ModuleFactory(_setupCost, _usageCost, _subscriptionCost) {
        version = "1.0.0";
        name = "DummySTO";
        title = "Dummy STO";
        description = "Dummy STO";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyToken = _takeFee();
        //Check valid bytes - can only call module init function
        DummySTO dummySTO = new DummySTO(msg.sender, polyToken);
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == dummySTO.getInitFunction(), "Invalid data");
        /*solium-disable-next-line security/no-low-level-calls*/
        (bool success,) = address(dummySTO).call(_data);
        require(success, "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(dummySTO), getName(), address(this), msg.sender, setupCost, now);
        return address(dummySTO);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 3;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        return "Dummy STO - you can mint tokens at will";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "Dummy";
        availableTags[1] = "Non-refundable";
        availableTags[2] = "ETH";
        return availableTags;
    }
}
