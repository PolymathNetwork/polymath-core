pragma solidity 0.5.8;

import "../VotingCheckpoint.sol";
import "./WeightedVoteCheckpointStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Checkpoint module for token weighted vote
 * @notice This voting system uses public votes
 * @notice In this module every token holder has voting right (Should be greater than zero)
 * Tally will be calculated as per the weight (balance of the token holder)
 */
contract WeightedVoteCheckpoint is WeightedVoteCheckpointStorage, VotingCheckpoint {
    using SafeMath for uint256;

    event BallotCreated(
        uint256 indexed _ballotId,
        uint256 indexed _checkpointId,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _noOfProposals,
        uint256 _quorumPercentage
    );
    event VoteCast(address indexed _voter,  uint256 _weight, uint256 indexed _ballotId, uint256 indexed _proposalId);
    event BallotStatusChanged(uint256 indexed _ballotId, bool _isActive);
    event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address indexed _voter, bool _exempt);

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
     * @param _quorumPercentage Minimum Quorum  percentage required to make a proposal won
     */
    function createBallot(uint256 _duration, uint256 _noOfProposals, uint256 _quorumPercentage) external withPerm(ADMIN) {
        require(_duration > 0, "Incorrect ballot duration");
        uint256 checkpointId = securityToken.createCheckpoint();
        uint256 endTime = now.add(_duration);
        _createCustomBallot(checkpointId, _quorumPercentage, now, endTime, _noOfProposals);
    }

    function _createCustomBallot(
        uint256 _checkpointId,
        uint256 _quorumPercentage,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _noOfProposals
    )
        internal
    {
        require(_noOfProposals > 1, "Incorrect proposals no");
        require(_endTime > _startTime, "Times are not valid");
        require(_quorumPercentage <= 100 * 10 ** 16 && _quorumPercentage > 0, "Invalid quorum percentage"); // not more than 100 %
        require(
            uint64(_startTime) == _startTime &&
            uint64(_endTime) == _endTime &&
            uint64(_noOfProposals) == _noOfProposals,
            "values get overflowed"
        );
        uint256 ballotId = ballots.length;
        ballots.push(
            Ballot(
                _checkpointId, _quorumPercentage, uint64(_startTime), uint64(_endTime), uint64(_noOfProposals), uint56(0), true
            )
        );
        emit BallotCreated(ballotId, _checkpointId, _startTime, _endTime, _noOfProposals, _quorumPercentage);
    }

    /**
     * @notice Allows the token issuer to create a ballot with custom settings
     * @param _checkpointId Index of the checkpoint to use for token balances
     * @param _quorumPercentage Minimum Quorum  percentage required to make a proposal won
     * @param _startTime Start time of the voting period in Unix Epoch time
     * @param _endTime End time of the voting period in Unix Epoch time
     * @param _noOfProposals Number of proposals
     */
    function createCustomBallot(uint256 _checkpointId, uint256 _quorumPercentage, uint256 _startTime, uint256 _endTime, uint256 _noOfProposals) external withPerm(ADMIN) {
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint Id");
        require(_startTime >= now, "Invalid startTime");
        _createCustomBallot(_checkpointId, _quorumPercentage, _startTime, _endTime, _noOfProposals);
    }

    /**
     * @notice Allows a token holder to cast their vote on a specific ballot
     * @param _ballotId The index of the target ballot
     * @param _proposalId Id of the proposal which investor want to vote for proposal
     */
    function castVote(uint256 _ballotId, uint256 _proposalId) external {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        // Check whether the msg.sender is allowed to vote for a given ballotId or not.
        require(isVoterAllowed(_ballotId, msg.sender), "Invalid voter");
        Ballot storage ballot = ballots[_ballotId];
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = securityToken.balanceOfAt(msg.sender, ballot.checkpointId);
        require(weight > 0, "weight should be > 0");
        // Validate the storage values
        require(ballot.totalProposals >= _proposalId && _proposalId > 0, "Incorrect proposals Id");
        require(now >= ballot.startTime && now <= ballot.endTime, "Voting period is not active");
        require(ballot.investorToProposal[msg.sender] == 0, "Token holder has already voted");
        require(ballot.isActive, "Ballot is not active");
        // Update the storage
        ballot.investorToProposal[msg.sender] = _proposalId;
        ballot.totalVoters = ballot.totalVoters + 1;
        ballot.proposalToVotes[_proposalId] = ballot.proposalToVotes[_proposalId].add(weight);
        emit VoteCast(msg.sender, weight, _ballotId, _proposalId);
    }

    /**
     * Change the given ballot exempted list
     * @param _ballotId Given ballot Id
     * @param _voter Address of the voter
     * @param _exempt Whether it is exempted or not
     */
    function changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) external withPerm(ADMIN) {
        _changeBallotExemptedVotersList(_ballotId, _voter, _exempt);
    }

    /**
     * Change the given ballot exempted list (Multi)
     * @param _ballotId Given ballot Id
     * @param _voters Address of the voter
     * @param _exempts Whether it is exempted or not
     */
    function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _voters, bool[] calldata _exempts) external withPerm(ADMIN) {
        require(_voters.length == _exempts.length, "Array length mismatch");
        for (uint256 i = 0; i < _voters.length; i++) {
            _changeBallotExemptedVotersList(_ballotId, _voters[i], _exempts[i]);
        }
    }

    function _changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) internal {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        require(_voter != address(0), "Invalid address");
        require(ballots[_ballotId].exemptedVoters[_voter] != _exempt, "No change");
        ballots[_ballotId].exemptedVoters[_voter] = _exempt;
        emit ChangedBallotExemptedVotersList(_ballotId, _voter, _exempt);
    }

    /**
     * Use to check whether the voter is allowed to vote or not
     * @param _ballotId The index of the target ballot
     * @param _voter Address of the voter
     * @return bool
     */
    function isVoterAllowed(uint256 _ballotId, address _voter) public view returns(bool) {
        bool allowed = (ballots[_ballotId].exemptedVoters[_voter] || (defaultExemptIndex[_voter] != 0));
        return !allowed;
    }

    /**
     * @notice Allows the token issuer to set the active stats of a ballot
     * @param _ballotId The index of the target ballot
     * @param _isActive The bool value of the active stats of the ballot
     * @return bool success
     */
    function changeBallotStatus(uint256 _ballotId, bool _isActive) external withPerm(ADMIN) {
        require(uint64(now) <= ballots[_ballotId].endTime, "Already ended");
        require(ballots[_ballotId].isActive != _isActive, "Active state unchanged");
        ballots[_ballotId].isActive = _isActive;
        emit BallotStatusChanged(_ballotId, _isActive);
    }

    /**
     * @notice Queries the result of a given ballot
     * @param _ballotId Id of the target ballot
     * @return uint256 voteWeighting
     * @return uint256 tieWith
     * @return uint256 winningProposal
     * @return bool isVotingSucceed
     * @return uint256 totalVotes
     */
    function getBallotResults(uint256 _ballotId) external view returns (
        uint256[] memory voteWeighting,
        uint256[] memory tieWith,
        uint256 winningProposal,
        bool isVotingSucceed,
        uint256 totalVotes
    ) {
        if (_ballotId >= ballots.length)
            return (new uint256[](0), new uint256[](0), winningProposal, isVotingSucceed, totalVotes);

        Ballot storage ballot = ballots[_ballotId];
        uint256 i;
        uint256 counter = 0;
        uint256 maxWeight = 0;
        uint256 supplyAtCheckpoint = securityToken.totalSupplyAt(ballot.checkpointId);
        uint256 quorumWeight = (supplyAtCheckpoint.mul(ballot.quorum)).div(10 ** 18);
        voteWeighting = new uint256[](ballot.totalProposals);
        for (i = 0; i < ballot.totalProposals; i++) {
            voteWeighting[i] = ballot.proposalToVotes[i + 1];
            if (maxWeight < ballot.proposalToVotes[i + 1]) {
                maxWeight = ballot.proposalToVotes[i + 1];
                if (maxWeight >= quorumWeight)
                    winningProposal = i + 1;
            }
        }
        if (maxWeight >= quorumWeight) {
            isVotingSucceed = true;
            for (i = 0; i < ballot.totalProposals; i++) {
                if (maxWeight == ballot.proposalToVotes[i + 1] && (i + 1) != winningProposal)
                    counter ++;
            }
        }

        tieWith = new uint256[](counter);
        if (counter > 0) {
            counter = 0;
            for (i = 0; i < ballot.totalProposals; i++) {
                if (maxWeight == ballot.proposalToVotes[i + 1] && (i + 1) != winningProposal) {
                    tieWith[counter] = i + 1;
                    counter ++;
                }
            }
        }
        totalVotes = uint256(ballot.totalVoters);
    }

    /**
     * @notice Get the voted proposal
     * @param _ballotId Id of the ballot
     * @param _voter Address of the voter
     */
    function getSelectedProposal(uint256 _ballotId, address _voter) external view returns(uint256 proposalId) {
        if (_ballotId >= ballots.length)
            return 0;
        return ballots[_ballotId].investorToProposal[_voter];
    }

    /**
     * @notice Get the details of the ballot
     * @param _ballotId The index of the target ballot
     * @return uint256 quorum
     * @return uint256 totalSupplyAtCheckpoint
     * @return uint256 checkpointId
     * @return uint256 startTime
     * @return uint256 endTime
     * @return uint256 totalProposals
     * @return uint256 totalVoters
     * @return bool isActive
     */
    function getBallotDetails(uint256 _ballotId) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool) {
        Ballot memory ballot = ballots[_ballotId];
        return (
            ballot.quorum,
            securityToken.totalSupplyAt(ballot.checkpointId),
            ballot.checkpointId,
            ballot.startTime,
            ballot.endTime,
            ballot.totalProposals,
            ballot.totalVoters,
            ballot.isActive
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

    function _checkIndexOutOfBound(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }

}
