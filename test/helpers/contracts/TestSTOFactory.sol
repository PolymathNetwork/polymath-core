pragma solidity ^0.4.23;

import "../../../contracts/modules/STO/DummySTO.sol";
import "../../../contracts/interfaces/IModuleFactory.sol";
import "../../../contracts/interfaces/IModule.sol";


contract TestSTOFactory is IModuleFactory {

   constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        //Check valid bytes - can only call module init function
        DummySTO dummySTO = new DummySTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(getSig(_data) == dummySTO.getInitFunction(), "Provided data is not valid");
        require(address(dummySTO).call(_data), "Un-successfull call");
        return address(dummySTO);
    }

    function getCost() public view returns(uint256) {
        return uint256(1000 * 10 ** 18);
    }

    function getType() public view returns(uint8) {
        return 3;
    }

    function getName() public view returns(bytes32) {
        return "TestSTO";
    }

    function getDescription() public view returns(string) {
        return "Test STO";
    }

    function getTitle() public view returns(string) {
        return "Test STO";
    }

    function getInstructions() public view returns(string) {
        return "Test STO - you can mint tokens at will";
    }

}
