pragma solidity ^0.4.21;

import "./SimpleDaicoFund.sol";
import "../../interfaces/IModuleFactory.sol";
import "../../interfaces/IModule.sol";


contract SimpleDaicoFundFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        //Check valid bytes - can only call module init function
        SimpleDaicoFund daicoFund = new SimpleDaicoFund(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(getSig(_data) == daicoFund.getInitFunction(), "Provided data is not valid");
        require(address(daicoFund).call(_data), "Un-successfull call");
        return address(daicoFund);
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 5; // Is this okay?
    }

    function getName() public view returns(bytes32) {
        return "SimpleDaicoFund";
    }

    function getDescription() public view returns(string) {
        return "";
    }

    function getTitle() public view returns(string) {
        return "Simple Daico Fund";
    }

    function getInstructions() public view returns(string) {
        return "";
    }

    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](1);
        availableTags[0] = "ETH";
        return availableTags;
    }

}
