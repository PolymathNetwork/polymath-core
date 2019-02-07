pragma solidity ^0.5.0;

import "../ModuleFactory.sol";
import "../../proxy/POLYCappedSTOProxy.sol";
import "../../libraries/Util.sol";
import "../../interfaces/IBoot.sol";

/**
 * @title Factory for deploying POLYCappedSTO module
 */
contract POLYCappedSTOFactory is ModuleFactory {

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
        require(_logicContract != address(0), "address 0x not allowed");
        logicContract = _logicContract;
        version = "1.0.0";
        name = "POLYCappedSTO";
        title = "POLY - Capped STO";
        description = "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (POLY). This STO supports options for a minimum investment limit for all investors, maximum investment limit for non-accredited investors and an option to mint unsold tokens to a reserve wallet upon termination of the offering.";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyToken = _takeFee();
        //Check valid bytes - can only call module init function
        address polyCappedSTO = address(new POLYCappedSTOProxy(msg.sender, polyToken, logicContract));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IBoot(polyCappedSTO).getInitFunction(), "Invalid data");
        bool success;
        /*solium-disable-next-line security/no-low-level-calls*/
        (success, ) = polyCappedSTO.call(_data);
        require(success, "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(polyCappedSTO), getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return address(polyCappedSTO);
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
        /*solium-disable-next-line max-len*/
        // NEED TO UPDATE INSTRUCTIONS
        return "Initialises a POLY capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY to token rate), _minimumInvestment (required minimum investment), _nonAccreditedLimit (maximum investment for non-accredited investors), _maxNonAccreditedInvestors (maximum number of non accredited investors), _wallet (address which will receive funds), _reserveWallet (address which will receive unsold tokens)";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "Capped";
        availableTags[1] = "Non-refundable";
        availableTags[2] = "POLY";
        return availableTags;
    }

}
