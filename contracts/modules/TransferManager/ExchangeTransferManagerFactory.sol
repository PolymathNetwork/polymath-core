pragma solidity ^0.4.18;

import './ExchangeTransferManager.sol';
import '../../interfaces/IModuleFactory.sol';

contract ExchangeTransferManagerFactory is IModuleFactory {

  function deploy(bytes _data) external returns(address) {
    //polyToken.transferFrom(msg.sender, owner, getCost());
    ExchangeTransferManager exchangeTransferManager = new ExchangeTransferManager(msg.sender);
    require(getSig(_data) == exchangeTransferManager.getInitFunction());
    require(address(exchangeTransferManager).call(_data));
    return address(exchangeTransferManager);

  }

  function getCost() view external returns(uint256) {
    return 0;
  }

  function getType() view external returns(uint8) {
      return 2;
  }

  function getName() view external returns(bytes32) {
    return "ExchangeTransferManager";
  }

  function getDescription() view external returns(string) {
    return "Manage transfers within an exchange";
  }

  function getTitle() view external returns(string) {
    return "Exchange Transfer Manager";
  }

  function getInstructions() public view returns(string) {
    return "Allows an exchange to whitelist users for depositing / withdrawing from an exchange address. Init function takes exchange address as a parameter and users are added via modifyWhitelist.";
  }

}
