pragma solidity ^0.4.23;

import "./ExchangeTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract ExchangeTransferManagerFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        ExchangeTransferManager exchangeTransferManager = new ExchangeTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == exchangeTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(exchangeTransferManager).call(_data), "Un-successfull call");
        return address(exchangeTransferManager);

    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 2;
    }

    function getName() public view returns(bytes32) {
        return "ExchangeTransferManager";
    }

    function getDescription() public view returns(string) {
        return "Manage transfers within an exchange";
    }

    function getTitle() public view returns(string) {
        return "Exchange Transfer Manager";
    }

    function getInstructions() public view returns(string) {
        return "Allows an exchange to whitelist users for depositing / withdrawing from an exchange address. Init function takes exchange address as a parameter and users are added via modifyWhitelist.";
    }

    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Exchange"; 
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
