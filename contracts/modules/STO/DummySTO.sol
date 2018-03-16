pragma solidity ^0.4.18;

import '../../interfaces/ISTO.sol';
import '../../interfaces/IST20.sol';
import '../../delegates/DelegablePorting.sol';

contract DummySTO is ISTO {

  address public securityToken;
  address public owner;
  uint256 public investorCount;

  uint256 public startTime;
  uint256 public endTime;
  uint256 public cap;
  string public someString;

  event LogGenerateTokens(address _investor, uint256 _amount);

  mapping (address => uint256) public investors;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  modifier onlyOwnerOrFactory {
    require((msg.sender == owner) || (msg.sender == factory));
    _;
  }

  function DummySTO(address _owner, address _securityToken) public {
    //For the duration of the constructor, caller is the owner
    owner = _owner;
    securityToken = _securityToken;
    factory = msg.sender;
  }

  function configure(uint256 _startTime, uint256 _endTime, uint256 _cap) public onlyOwnerOrFactory {
    startTime = _startTime;
    endTime = _endTime;
    cap = _cap;
    /* someString = _someString; */
  }

  function getInitFunction() public returns (bytes4) {
    return bytes4(keccak256("configure(uint256,uint256,uint256)"));
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

  function getRaiseEther() view public returns (uint256) {
    return 0;
  }

  function getRaisePOLY() view public returns (uint256) {
    return 0;
  }

  function getNumberInvestors() view public returns (uint256) {
    return investorCount;
  }


}
