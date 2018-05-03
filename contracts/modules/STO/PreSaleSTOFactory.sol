pragma solidity ^0.4.23;

import "./PreSaleSTO.sol";
import "../../interfaces/IModuleFactory.sol";
import "../../interfaces/IModule.sol";


contract PreSaleSTOFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if (getCost() > 0) {
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        }
        //Check valid bytes - can only call module init function
        PreSaleSTO preSaleSTO = new PreSaleSTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(getSig(_data) == preSaleSTO.getInitFunction(), "Provided data is not valid");
        require(address(preSaleSTO).call(_data), "Un-successfull call");
        return address(preSaleSTO);
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 3;
    }

    function getName() public view returns(bytes32) {
        return "PreSaleSTO";
    }

    function getDescription() public view returns(string) {
        return "Allows Issuer to configure pre-sale token allocations";
    }

    function getTitle() public view returns(string) {
        return "PreSale STO";
    }

    function getInstructions() public view returns(string) {
        return "Configure and track pre-sale token allocations";
    }

}
