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
        uint64 startTime;
        uint64 endTime;
        uint64 totalNumVotes;
        uint56 totalProposals;
        uint8 isActive;
        mapping(uint256 => uint256) proposalToVote;
        mapping(address => uint256) voteByAddress;
    }

    Ballot[] ballots;

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
    function createBallot(uint256 _duration, uint256 _noOfProposals) external withPerm(ADMIN) {
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
                _checkpointId, supplyAtCheckpoint, uint64(_startTime), uint64(_endTime), uint64(0), uint56(_noOfProposals), uint8(1)
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
    function createCustomBallot(uint256 _startTime, uint256 _endTime, uint256 _checkpointId, uint256 _noOfProposals) external withPerm(ADMIN) {
        require(_checkpointId <= ISecurityToken(securityToken).currentCheckpointId(), "Invalid checkpoint Id");
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
        require(ballot.voteByAddress[msg.sender] == 0, "Token holder has already voted");
        require(ballot.isActive == uint8(1), "Ballot is not active");

        ballot.voteByAddress[msg.sender] = _proposalId;
        ballot.totalNumVotes = uint64(uint256(ballot.totalNumVotes).add(uint256(1)));
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
        require(uint64(now) < ballots[_ballotId].endTime, "Already ended");
        uint8 activeStatus = 0;
        if (_isActive)
            activeStatus = 1;
        require(ballots[_ballotId].isActive != activeStatus, "Active state unchanged");
        ballots[_ballotId].isActive = activeStatus;
        emit BallotStatusChanged(_ballotId, _isActive);
    }

    /**
     * @notice Queries the result of a given ballot
     * @param _ballotId Id of the target ballot
     * @return uint256 voteWeighting
     * @return uint256 tieWith
     * @return uint256 winningProposal
     * @return uint256 remainingTime
     * @return uint256 totalVotes
     
     */
    function getBallotResults(uint256 _ballotId) external view returns (
        uint256[] memory,
        uint256[] memory,
        uint256 winningProposal,
        uint256 remainingTime,
        uint256 totalVotes
    ) {
        if (_ballotId >= ballots.length)
            return (new uint256[](0), new uint256[](0), winningProposal, remainingTime, totalVotes);

        Ballot storage ballot = ballots[_ballotId];
        uint256 counter = 0;
        uint256 maxWeight = 0;
        uint256 i;
        for (i = 0; i < ballot.totalProposals; i++) {
            if (maxWeight < ballot.proposalToVote[i+1]) {
                maxWeight = ballot.proposalToVote[i+1];
                winningProposal = i + 1;
            }
        }
        for (i = 0; i < ballot.totalProposals; i++) {
            if (maxWeight == ballot.proposalToVote[i+1])
                counter ++;
        }
        uint256[] memory voteWeighting = new uint256[](ballot.totalProposals);
        uint256[] memory tieWith = new uint256[](counter);
        counter = 0;
        for (i = 0; i < ballot.totalProposals; i++) {
            voteWeighting[i] = ballot.proposalToVote[i+1];
            if (maxWeight == ballot.proposalToVote[i+1]) {
                tieWith[counter] = i+1;
                counter ++;
            }   
        }
        if (ballot.endTime >= uint64(now))
            remainingTime = uint256(ballot.endTime).sub(now);
        totalVotes = uint256(ballot.totalNumVotes);
        return (voteWeighting, tieWith, winningProposal, remainingTime, totalVotes);
    }

    /**
     * @notice Get the voted proposal
     * @param _ballotId Id of the ballot
     * @param _voter Address of the voter
     */
    function getSelectedProposal(uint256 _ballotId, address _voter) external view returns(uint256 proposalId) {
        if (_ballotId >= ballots.length)
            return 0;
        return ballots[_ballotId].voteByAddress[_voter];
    }

    /**
     * @notice Get the stats of the ballot
     * @param _ballotId The index of the target ballot
     */
    function getBallotStats(uint256 _ballotId) external view returns(uint256, uint256, uint64, uint64, uint64, uint64, bool) {
        Ballot memory ballot = ballots[_ballotId];
        return (
            ballot.checkpointId,
            ballot.totalSupply,
            ballot.startTime,
            ballot.endTime,
            ballot.totalNumVotes,
            ballot.totalProposals,
            (ballot.isActive == 1 ? true : false)
        );
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
