pragma solidity ^0.4.24;

import "./CappedSTO.sol";
import "../../interfaces/IModuleFactory.sol";
import "../../interfaces/IModule.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract CappedSTOFactory is IModuleFactory {

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
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        //Check valid bytes - can only call module init function
        CappedSTO cappedSTO = new CappedSTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(getSig(_data) == cappedSTO.getInitFunction(), "Provided data is not valid");
        require(address(cappedSTO).call(_data), "Un-successfull call");
        emit LogGenerateModuleFromFactory(address(cappedSTO), getName(), address(this), msg.sender, now);
        return address(cappedSTO);
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
        return "CappedSTO";
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return "Capped STO";
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "Capped STO";
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Initialises a capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY/ETH to token rate), _fundRaiseType (whether you are raising in POLY or ETH), _polyToken (address of POLY token), _fundsReceiver (address which will receive funds)";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "Capped";
        availableTags[1] = "Non-refundable";
        availableTags[2] = "POLY";
        availableTags[3] = "ETH";
        return availableTags;
    }

}
