pragma solidity ^0.4.18;

import '../../interfaces/ISTO.sol';
import '../../interfaces/IST20.sol';
import '../../delegates/DelegablePorting.sol';

contract DummySTO is ISTO {

  address public securityToken;
  address public owner;
  uint256 public investorCount;

  event LogGenerateTokens(address _investor, uint256 _amount);

  mapping (address => uint256) public investors;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  function DummySTO(address _owner, address _securityToken) public {
    owner = _owner;
    securityToken = _securityToken;
  }

  function generateTokens(address _investor, uint256 _amount) public onlyOwner {
    require(_amount > 0);
    IST20(securityToken).mint(_investor, _amount);
    if (investors[_investor] == 0) {
      investorCount = investorCount + 1;
    }
    //TODO: Add SafeMath maybe
    investors[_investor] = investors[_investor] + _amount;
    LogGenerateTokens(_investor, _amount);
  }

  function getRaiseEther() public returns (uint256) {
    return 0;
  }

  function getRaisePOLY() public returns (uint256) {
    return 0;
  }

  function getNumberInvestors() public returns (uint256) {
    return investorCount;
  }


}
