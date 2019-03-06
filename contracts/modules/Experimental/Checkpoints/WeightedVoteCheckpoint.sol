pragma solidity ^0.5.0;

import "../../Module.sol";
import "../../Checkpoint/ICheckpoint.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Checkpoint module for token weighted vote
 * @notice This voting system uses public votes
 * @notice In this module every token holder has voting right (Should be greater than zero)
 * Tally will be calculated as per the weight (balance of the token holder)
 */
contract WeightedVoteCheckpoint is ICheckpoint, Module {
    using SafeMath for uint256;

    struct Ballot {
        uint256 checkpointId;
        uint256 totalSupply;
        uint256 startTime;
        uint256 endTime;
        uint256 totalNumVotes;
        uint256 totalProposals;
        bool isActive;
        mapping(uint256 => uint256) proposalToVote;
        mapping(address => Vote) voteByAddress;
    }

    Ballot[] ballots;

    struct Vote {
        uint256 voteTime;
        uint256 weight;             
        uint256 vote;
    }

    event BallotCreated(uint256 _startTime, uint256 _endTime, uint256 _ballotId, uint256 _checkpointId, uint256 _noOfProposals);
    event VoteCasted(uint256 indexed _ballotId, uint256 indexed _proposalId, address indexed _investor, uint256 _weight);
    event BallotStatusChanged(uint256 _ballotId, bool _isActive);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyToken Address of the polytoken
     */
    constructor(address _securityToken, address _polyToken)
    public
    Module(_securityToken, _polyToken)
    {

    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Allows the token issuer to create a ballot
     * @param _duration The duration of the voting period in seconds
     * @param _noOfProposals Number of proposals
     */
    function createBallot(uint256 _duration, uint256 _noOfProposals) external {
        _onlySecurityTokenOwner();
        require(_duration > 0, "Incorrect ballot duration.");
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        uint256 endTime = now.add(_duration);
        _createCustomBallot(now, endTime, checkpointId, _noOfProposals);
    }

    function _createCustomBallot(uint256 _startTime, uint256 _endTime, uint256 _checkpointId, uint256 _noOfProposals) internal {
        require(_noOfProposals > 1, "Incorrect proposals no");
        require(_endTime > _startTime, "Times are not valid");
        uint256 ballotId = ballots.length;
        uint256 supplyAtCheckpoint = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        ballots.push(
            Ballot(
                _checkpointId, supplyAtCheckpoint, _startTime, _endTime, 0, _noOfProposals, true
            )
        );
        emit BallotCreated(_startTime, _endTime, ballotId, _checkpointId, _noOfProposals);
    }

    /**
     * @notice Allows the token issuer to create a ballot with custom settings
     * @param _startTime Start time of the voting period in Unix Epoch time
     * @param _endTime End time of the voting period in Unix Epoch time
     * @param _checkpointId Index of the checkpoint to use for token balances
     * @param _noOfProposals Number of proposals
     */
    function createCustomBallot(uint256 _startTime, uint256 _endTime, uint256 _checkpointId, uint256 _noOfProposals) external {
        _onlySecurityTokenOwner();
        _createCustomBallot(_startTime, _endTime, _checkpointId, _noOfProposals);
    }

    /**
     * @notice Allows a token holder to cast their vote on a specific ballot
     * @param _ballotId The index of the target ballot
     * @param _proposalId Id of the proposal which investor want to vote for proposal
     */
    function castVote(uint256 _ballotId, uint256 _proposalId) external {
        require(_ballotId < ballots.length, "Incorrect ballot Id");
        Ballot storage ballot = ballots[_ballotId];

        uint256 weight = ISecurityToken(securityToken).balanceOfAt(msg.sender, ballot.checkpointId);
        require(weight > 0, "weight should be > 0");
        require(ballot.totalProposals >= _proposalId && _proposalId > 0, "Incorrect proposals Id");
        require(now >= ballot.startTime && now <= ballot.endTime, "Voting period is not active");
        require(ballot.voteByAddress[msg.sender].voteTime == 0, "Token holder has already voted");
        require(ballot.isActive == true, "Ballot is not active");

        
        ballot.voteByAddress[msg.sender].voteTime = now;
        ballot.voteByAddress[msg.sender].weight = weight;
        ballot.voteByAddress[msg.sender].vote = _proposalId;
        ballot.totalNumVotes = ballot.totalNumVotes.add(1);
        ballot.proposalToVote[_proposalId] = ballot.proposalToVote[_proposalId].add(weight);
        emit VoteCasted(_ballotId, _proposalId, msg.sender, weight);
    }

    /**
     * @notice Allows the token issuer to set the active stats of a ballot
     * @param _ballotId The index of the target ballot
     * @param _isActive The bool value of the active stats of the ballot
     * @return bool success
     */
    function changeBallotStatus(uint256 _ballotId, bool _isActive) external {
        _onlySecurityTokenOwner();
        require(now < ballots[_ballotId].endTime, "Already ended");
        require(ballots[_ballotId].isActive != _isActive, "Active state unchanged");
        ballots[_ballotId].isActive = _isActive;
        emit BallotStatusChanged(_ballotId, _isActive);
    }

    /**
     * @notice Queries the result of a given ballot
     * @param _ballotId Id of the target ballot
     * @return uint256 abstain
     * @return uint256 remainingTime
     * @return uint256 totalVotes
     */
    function getResults(uint256 _ballotId) external view returns (
        uint256[] memory,
        uint256 remainingTime,
        uint256 totalVotes
    ) {
        if (_ballotId < ballots.length) {
            Ballot storage ballot = ballots[_ballotId];
            uint256[] memory abstain = new uint256[](ballot.totalProposals);
            for (uint256 i = 0; i < ballot.totalProposals; i++) {
                abstain[i] = ballot.proposalToVote[i+1];
            }
            if (ballot.endTime >= now)
                remainingTime = ballot.endTime.sub(now);
            totalVotes = ballot.totalNumVotes;
            return (abstain, remainingTime, totalVotes);
        }
        return (new uint256[](0), remainingTime, totalVotes);
    }

    /**
     * @notice Get the stats of the ballot
     * @param _ballotId The index of the target ballot
     */
    function getBallotStats(uint256 _ballotId) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, bool) {
        Ballot memory ballot = ballots[_ballotId];
        return (
            ballot.checkpointId,
            ballot.totalSupply,
            ballot.startTime,
            ballot.endTime,
            ballot.totalNumVotes,
            ballot.totalProposals,
            ballot.isActive
        );
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
