pragma solidity ^0.5.0;

import "../ModuleFactory.sol";
import "../../libraries/Util.sol";
import "../../proxy/CappedSTOProxy.sol";
import "../../interfaces/IBoot.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract CappedSTOFactory is ModuleFactory {

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
        require(_logicContract != address(0), "Invalid address");
        version = "2.1.0";
        name = "CappedSTO";
        title = "Capped STO";
        description = "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (ETH or POLY), and any security tokens left upon termination of the offering will not be minted.";
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
        address cappedSTO = address(new CappedSTOProxy(msg.sender, polyToken, logicContract));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IBoot(cappedSTO).getInitFunction(), "Invalid data");
        bool success;
        /*solium-disable-next-line security/no-low-level-calls*/
        (success, ) = cappedSTO.call(_data);
        require(success, "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(cappedSTO), getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return address(cappedSTO);
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
        return "Initialises a capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY/ETH to token rate), _fundRaiseType (whether you are raising in POLY or ETH), _polyToken (address of POLY token), _fundsReceiver (address which will receive funds)";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "Capped";
        availableTags[1] = "Non-refundable";
        availableTags[2] = "POLY";
        availableTags[3] = "ETH";
        return availableTags;
    }

}
