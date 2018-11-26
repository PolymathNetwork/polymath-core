pragma solidity ^0.4.24;

import "../../Checkpoint/ICheckpoint.sol";
import "../../Module.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Checkpoint module for token weighted vote
 * @notice This voting system uses public votes
 */
contract WeightedVoteCheckpoint is ICheckpoint, Module {
    using SafeMath for uint256;

    struct Ballot {
        uint256 checkpointId;
        uint256 totalSupply;
        uint256 startTime;
        uint256 endTime;
        uint256 cumulativeYes;
        uint256 cumulativeNo;
        uint256 numVotes;
        mapping(address => Vote) voteByAddress;
        bool isActive;
    }

    Ballot[] public ballots;

    struct Vote {
        uint256 time;
        uint256 weight;
        bool vote;
    }

    event BallotCreated(uint256 _startTime, uint256 _endTime, uint256 _ballotId, uint256 _checkpointId);
    event VoteCasted(uint256 _ballotId, uint256 _time, address indexed _investor, uint256 _weight, bool _vote);
    event BallotActiveStatsChanged(uint256 _ballotId, bool _isActive);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor(address _securityToken, address _polyAddress) public Module(_securityToken, _polyAddress) {

    }

    /**
     * @notice Queries the result of a given ballot
     * @param _ballotId Id of the target ballot
     * @return uint256 cummulativeYes
     * @return uint256 cummulativeNo
     * @return uint256 totalAbstain
     * @return uint256 remainingTime
     */
    function getResults(uint256 _ballotId) public view returns (uint256 cummulativeYes, uint256 cummulativeNo, uint256 totalAbstain, uint256 remainingTime) {
        uint256 abstain = (ballots[_ballotId].totalSupply.sub(ballots[_ballotId].cumulativeYes)).sub(ballots[_ballotId].cumulativeNo);
        uint256 time = (ballots[_ballotId].endTime > now) ? ballots[_ballotId].endTime.sub(now) : 0;
        return (ballots[_ballotId].cumulativeYes, ballots[_ballotId].cumulativeNo, abstain, time);
    }

    /**
     * @notice Allows a token holder to cast their vote on a specific ballot
     * @param _vote The vote (true/false) in favor or against the proposal
     * @param _ballotId The index of the target ballot
     * @return bool success
     */
    function castVote(bool _vote, uint256 _ballotId) public returns (bool) {
        require(now > ballots[_ballotId].startTime && now < ballots[_ballotId].endTime, "Voting period is not active.");
        require(ballots[_ballotId].voteByAddress[msg.sender].time == 0, "Token holder has already voted.");
        require(ballots[_ballotId].isActive == true, "This ballot is deactiveated.");
        uint256 checkpointId = ballots[_ballotId].checkpointId;
        uint256 weight = ISecurityToken(securityToken).balanceOfAt(msg.sender,checkpointId);
        require(weight > 0, "Token Holder balance is zero.");
        ballots[_ballotId].voteByAddress[msg.sender].time = now;
        ballots[_ballotId].voteByAddress[msg.sender].weight = weight;
        ballots[_ballotId].voteByAddress[msg.sender].vote = _vote;
        ballots[_ballotId].numVotes = ballots[_ballotId].numVotes.add(1);
        if (_vote == true) {
            ballots[_ballotId].cumulativeYes = ballots[_ballotId].cumulativeYes.add(weight);
        } else {
            ballots[_ballotId].cumulativeNo = ballots[_ballotId].cumulativeNo.add(weight);
        }
        emit VoteCasted(_ballotId, now, msg.sender, weight, _vote);
        return true;
    }

    /**
     * @notice Allows the token issuer to create a ballot
     * @param _duration The duration of the voting period in seconds
     * @return bool success
     */
    function createBallot(uint256 _duration) public onlyOwner {
        require(_duration > 0, "Incorrect ballot duration.");
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        uint256 endTime = now.add(_duration);
        createCustomBallot(now, endTime, checkpointId);
    }

    /**
     * @notice Allows the token issuer to create a ballot with custom settings
     * @param _startTime Start time of the voting period in Unix Epoch time
     * @param _endTime End time of the voting period in Unix Epoch time
     * @param _checkpointId Index of the checkpoint to use for token balances
     * @return bool success
     */
    function createCustomBallot(uint256 _startTime, uint256 _endTime, uint256 _checkpointId) public onlyOwner {
        require(_endTime > _startTime, "Ballot end time must be later than start time.");
        uint256 ballotId = ballots.length;
        uint256 supplyAtCheckpoint = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        ballots.push(Ballot(_checkpointId,supplyAtCheckpoint,_startTime,_endTime,0,0,0, true));
        emit BallotCreated(_startTime, _endTime, ballotId, _checkpointId);
    }

    /**
     * @notice Allows the token issuer to set the active stats of a ballot
     * @param _ballotId The index of the target ballot
     * @param _isActive The bool value of the active stats of the ballot
     * @return bool success
     */
    function setActiveStatsBallot(uint256 _ballotId, bool _isActive) public onlyOwner {
        require(now < ballots[_ballotId].endTime, "This ballot has already ended.");
        require(ballots[_ballotId].isActive != _isActive, "Active state unchanged");
        ballots[_ballotId].isActive = _isActive;
        emit BallotActiveStatsChanged(_ballotId, _isActive);
    }


    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
