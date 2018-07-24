pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract IERC20 is ERC20 {

    function decreaseApproval(
    address _spender,
    uint _subtractedValue
  )
    public
    returns (bool);

    function increaseApproval(
    address _spender,
    uint _addedValue
  )
    public
    returns (bool);
}