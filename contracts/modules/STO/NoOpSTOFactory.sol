pragma solidity ^0.4.18;

import './NoOpSTO.sol';
import '../../interfaces/IModuleFactory.sol';

contract NoOpSTOFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
    return address(new NoOpSTO(_owner, msg.sender));
  }

  function getCost() external returns(uint256) {
    return 0;
  }

  function getType() external returns(uint8) {
      return 2;
  }

  function getName() external returns(bytes32) {
    return "NoOpSTO";
  }


}
