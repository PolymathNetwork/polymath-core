pragma solidity ^0.4.18;

import './DummySTO.sol';
import '../../interfaces/IModuleFactory.sol';
import '../../interfaces/IModule.sol';

contract DummySTOFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
      //Check valid bytes - can only call module init function
      DummySTO dummySTO = new DummySTO(_owner, msg.sender);
      //Checks that _data is valid (not calling anything it shouldn't)
      require(getSig(_data) == dummySTO.getInitFunction());
      require(address(dummySTO).call(_data));
      return address(dummySTO);
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
