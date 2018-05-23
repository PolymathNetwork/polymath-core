pragma solidity ^0.4.23;

contract ISimpleDaicoFund {
  function callOnTransfer(address _sender, address _receiver, uint256 _amount) public returns (bool);
}
