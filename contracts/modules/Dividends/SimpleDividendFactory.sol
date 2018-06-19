pragma solidity ^0.4.23;

import "./SimpleDividend.sol";
import "../../interfaces/IModuleFactory.sol";


contract SimpleDividendFactory is IModuleFactory {

    constructor (address _polyAddress) public
    IModuleFactory(_polyAddress)
    {
    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        SimpleDividend simpleDividend = new SimpleDividend(msg.sender, address(polyToken));
        require(getSig(_data) == simpleDividend.getInitFunction(), "Provided data is not valid");
        require(address(simpleDividend).call(_data), "Un-successfull call");
        return address(simpleDividend);

    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 4;
    }

    function getName() public view returns(bytes32) {
        return "SimpleDividend";
    }

    function getDescription() public view returns(string) {
        return "Provide dividend in terms of Invested Money";
    }

    function getTitle() public view returns(string) {
        return "Simple Dividend";
    }

    function getInstructions() public view returns(string) {
        return "Allow the issuer to provide dividends using the staking mechanism.";
    }

}
