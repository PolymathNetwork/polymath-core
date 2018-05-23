pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/IST20.sol";

contract Vote {

  using SafeMath for uint256;

  constructor(
    uint256 _endTime,
    address _daicoContract,
    address _tokenContract
  ) public {
    endTime = _endTime;
    daicoContract = _daicoContract;
    tokenContract = IST20(_tokenContract);
  }

  IST20 public tokenContract;
  address public daicoContract;

  uint256 public endTime;
  uint256 public cumulativeYes;
  uint256 public cumulativeNo;

  mapping(address => voteInstance) public voteByAddress;

  struct voteInstance {
    uint256 time;
    uint256 weight;
    bool vote;
  }

  function calcAbstain() public view returns (uint256) {
    return (tokenContract.totalSupply().add(cumulativeNo)).sub(cumulativeYes);
  }

  function tallyResult() public view returns (bool) {
    if (cumulativeYes > cumulativeNo.add(calcAbstain())) {
      return true;
    } else {
      return false;
    }
  }

  function finalResult() public view returns (bool) {
    require(now > endTime);
    return tallyResult();
  }

  function submitVote(bool _vote) public returns (bool) {
    require(tokenContract.balanceOf(msg.sender) > 0);
    require(endTime > now);
    uint256 voteWeight = tokenContract.balanceOf(msg.sender);
    require(voteByAddress[msg.sender].time == 0);
    voteByAddress[msg.sender].time = now;
    voteByAddress[msg.sender].weight = voteWeight;
    voteByAddress[msg.sender].vote = _vote;
    if (_vote == true) {
      cumulativeYes = cumulativeYes.add(voteWeight);
    }
    if (_vote == false) {
      cumulativeNo = cumulativeNo.add(voteWeight);
    }
    return true;
  }

  function callOnTransfer(address _sender, address _receiver, uint256 _amount) public returns (bool) {
    require(msg.sender == address(daicoContract));
    uint256 senderVote = voteByAddress[_sender].weight;
    uint256 receiverVote = voteByAddress[_receiver].weight;
    if (senderVote > 0) {
      voteByAddress[_sender].weight = senderVote.sub(_amount);
      _weightDecrease(_sender,_amount);
      if (receiverVote > 0) {
        voteByAddress[_receiver].weight = receiverVote.add(_amount);
        _weightIncrease(_receiver,_amount);
      }
    }
    return true;
  }

  function _weightDecrease(address _tokenholder, uint256 _amount) private {
    bool vote = voteByAddress[_tokenholder].vote;
    if (vote == true) {
      cumulativeYes = cumulativeYes.sub(_amount);
    }
    if (vote == false) {
      cumulativeNo = cumulativeNo.sub(_amount);
    }
  }

  function _weightIncrease(address _tokenholder, uint256 _amount) private {
    bool vote = voteByAddress[_tokenholder].vote;
    if (vote == true) {
      cumulativeYes = cumulativeYes.add(_amount);
    }
    if (vote == false) {
      cumulativeNo = cumulativeNo.add(_amount);
    }
  }
}
