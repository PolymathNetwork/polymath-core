pragma solidity ^0.4.21;

import "./ExchangeTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract ExchangeTransferManagerFactory is IModuleFactory {

    function ExchangeTransferManagerFactory(address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        require(polyToken.transferFrom(msg.sender, owner, getCost()));
        ExchangeTransferManager exchangeTransferManager = new ExchangeTransferManager(msg.sender);
        require(getSig(_data) == exchangeTransferManager.getInitFunction());
        require(address(exchangeTransferManager).call(_data));
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

}
