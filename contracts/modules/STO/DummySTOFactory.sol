pragma solidity ^0.4.18;

import './DummySTO.sol';
import '../../interfaces/IModuleFactory.sol';

contract DummySTOFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
      return address(new DummySTO(_owner, msg.sender));
  }

  function getCost() view external returns(uint256) {
      return 0;
  }

  function getType() view external returns(uint8) {
      return 2;
  }

  function getName() view external returns(bytes32) {
      return "DummySTO";
  }


}
