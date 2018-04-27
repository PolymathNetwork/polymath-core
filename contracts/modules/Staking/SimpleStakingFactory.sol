pragma solidity ^0.4.23;

import "../../interfaces/IModuleFactory.sol";
import "./SimpleStaking.sol";

contract SimpleStakingFactory is IModuleFactory {

    constructor (address _polyAddress) public
    IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if (getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new SimpleStaking(msg.sender, address(polyToken)));
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 5;
    }

    function getName() public view returns(bytes32) {
        return "SimpleStaking";
    }

    function getDescription() public view returns(string) {
        return "Use to provide the Staking mechanism";
    }

    function getTitle() public view returns(string) {
        return "Simple Staking";
    }

    function getInstructions() public view returns(string) {
        return "This module is use to provide staking mechanism that intiated by the whitelisted modules. Modules get whitelisted by the issuer.";
    }
    
}