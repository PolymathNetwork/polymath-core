pragma solidity 0.5.8;

import "../VotingCheckpoint.sol";
import "./PLCRVotingCheckpointStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PLCRVotingCheckpoint is PLCRVotingCheckpointStorage, VotingCheckpoint {

    using SafeMath for uint256;

    event VoteCommit(address indexed _voter, uint256 _weight, uint256 indexed _ballotId, bytes32 _secretVote);
    event VoteRevealed(
        address indexed _voter,
        uint256 _weight,
        uint256 indexed _ballotId,
        uint256 _choiceOfProposal,
        uint256 _salt,
        bytes32 _secretVote
    );
    event BallotCreated(
        uint256 indexed _ballotId,
        uint256 indexed _checkpointId,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _quorumPercentage
    );
    event BallotStatusChanged(uint256 indexed _ballotId, bool _newStatus);
    event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address indexed _voter, bool _exempt);

    constructor(address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {

    }

    /**
     * @notice Use to create the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _noOfProposals Total number of proposal used in the ballot. In general it is 2 (For & Against)
     * @param _quorumPercentage Minimum number of weight vote percentage requires to win a election.
     */
    function createBallot(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _quorumPercentage
    )   
        external
        withPerm(ADMIN)
    {
        uint256 startTime = now;
        uint256 checkpointId = securityToken.createCheckpoint();
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _quorumPercentage, checkpointId, startTime);
    }

    /**
     * @notice Use to create the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _noOfProposals Total number of proposal used in the ballot. In general it is 2 (For & Against)
     * @param _quorumPercentage Minimum number of weight vote percentage requires to win a election.
     * @param _checkpointId Valid checkpoint Id
     * @param _startTime startTime of the ballot
     */
    function createCustomBallot(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _quorumPercentage,
        uint256 _checkpointId,
        uint256 _startTime
    )
        external
        withPerm(ADMIN)
    {
        // validate the checkpointId, It should be less than or equal to the current checkpointId of the securityToken
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint Id");
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _quorumPercentage, _checkpointId, _startTime);
    }

    function _createBallotWithCheckpoint(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _quorumPercentage,
        uint256 _checkpointId,
        uint256 _startTime
    )
        internal
    {
        // Sanity checks
        _isGreaterThanZero(_commitDuration);
        _isGreaterThanZero(_revealDuration);
        _isGreaterThanZero(_quorumPercentage);
        require(_quorumPercentage <= 100 * 10 ** 16, "Invalid quorum percentage"); // not more than 100 %
        // Overflow check
        require(
            uint64(_commitDuration) == _commitDuration &&
            uint64(_revealDuration) == _revealDuration &&
            uint64(_startTime) == _startTime &&
            uint24(_noOfProposals) == _noOfProposals,
            "Parameter values get overflowed"
        );
        require(_startTime >= now, "Invalid start time");
        // Valid proposal Id range should be 1 to `_noOfProposals`.
        require(_noOfProposals > 1, "Invalid number of proposals");
        uint256 _ballotId = ballots.length;
        ballots.push(Ballot(
            _checkpointId,
            _quorumPercentage,
            uint64(_commitDuration),
            uint64(_revealDuration),
            uint64(_startTime),
            uint24(_noOfProposals),
            uint32(0),
            true
        ));
        emit BallotCreated(_ballotId, _checkpointId, _startTime, _commitDuration, _revealDuration, _noOfProposals, _quorumPercentage);
    }

    /**
     * @notice Used to commit the vote
     * @param _ballotId Given ballot Id
     * @param _secretVote It is secret hash value (hashed offchain)
     */
    function commitVote(uint256 _ballotId, bytes32 _secretVote) external {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        require(_secretVote != bytes32(0), "Invalid vote");
        // Check for the valid stage. Whether that ballot is in the COMMIT state or not.
        _checkValidStage(_ballotId, Stage.COMMIT);
        // Check whether the msg.sender is allowed to vote for a given ballotId or not. 
        require(isVoterAllowed(_ballotId, msg.sender), "Invalid voter");
        // validate the storage values
        Ballot storage ballot = ballots[_ballotId];
        require(ballot.investorToProposal[msg.sender].secretVote == bytes32(0), "Already voted");
        require(ballot.isActive, "Inactive ballot");
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = securityToken.balanceOfAt(msg.sender, ballot.checkpointId);
        require(weight > 0, "Zero weight is not allowed");
        // Update the storage value. Assigned `0` as vote option it will be updated when voter reveals its vote.
        ballot.investorToProposal[msg.sender] = Vote(0, _secretVote);
        emit VoteCommit(msg.sender, weight, _ballotId, _secretVote);
    }

    /**
     * @notice Used to reveal the vote
     * @param _ballotId Given ballot Id
     * @param _choiceOfProposal Proposal chossed by the voter. It varies from (1 to totalProposals)
     * @param _salt used salt for hashing (unique for each user)
     */
    function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        // Check for the valid stage. Whether that ballot is in the REVEAL state or not.
        _checkValidStage(_ballotId, Stage.REVEAL);
        Ballot storage ballot = ballots[_ballotId];
        // validate the storage values 
        require(ballot.isActive, "Inactive ballot");
        require(ballot.investorToProposal[msg.sender].secretVote != bytes32(0), "Secret vote not available");
        require(ballot.totalProposals >= _choiceOfProposal && _choiceOfProposal > 0, "Invalid proposal choice");

        // validate the secret vote
        require(
            bytes32(keccak256(abi.encodePacked(_choiceOfProposal, _salt))) == ballot.investorToProposal[msg.sender].secretVote,
            "Invalid vote"
        );
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = securityToken.balanceOfAt(msg.sender, ballot.checkpointId);
        bytes32 secretVote = ballot.investorToProposal[msg.sender].secretVote;
        // update the storage values
        ballot.proposalToVotes[_choiceOfProposal] = ballot.proposalToVotes[_choiceOfProposal].add(weight);
        ballot.totalVoters = ballot.totalVoters + 1;
        ballot.investorToProposal[msg.sender] = Vote(_choiceOfProposal, bytes32(0));
        emit VoteRevealed(msg.sender, weight, _ballotId, _choiceOfProposal, _salt, secretVote);
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
     */
    function changeBallotStatus(uint256 _ballotId, bool _isActive) external withPerm(ADMIN) {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        require(
            now <= uint256(ballots[_ballotId].startTime)
            .add(uint256(ballots[_ballotId].commitDuration)
            .add(uint256(ballots[_ballotId].revealDuration))),
            "Already ended"
        );
        require(ballots[_ballotId].isActive != _isActive, "Active state unchanged");
        ballots[_ballotId].isActive = _isActive;
        emit BallotStatusChanged(_ballotId, _isActive);
    }

    /**
     * @notice Used to get the current stage of the ballot
     * @param _ballotId Given ballot Id
     */
    function getCurrentBallotStage(uint256 _ballotId) public view returns (Stage) {
        Ballot memory ballot = ballots[_ballotId];
        uint256 commitTimeEnd = uint256(ballot.startTime).add(uint256(ballot.commitDuration));
        uint256 revealTimeEnd = commitTimeEnd.add(uint256(ballot.revealDuration));

        if (now < ballot.startTime)
            return Stage.PREP;
        else if (now >= ballot.startTime && now <= commitTimeEnd) 
            return Stage.COMMIT;
        else if ( now > commitTimeEnd && now <= revealTimeEnd)
            return Stage.REVEAL;
        else if (now > revealTimeEnd)
            return Stage.RESOLVED;
    }

    /**
     * @notice Queries the result of a given ballot
     * @param _ballotId Id of the target ballot
     * @return uint256 voteWeighting
     * @return uint256 tieWith
     * @return uint256 winningProposal
     * @return bool isVotingSucceed
     * @return uint256 totalVoters
     */
    function getBallotResults(uint256 _ballotId) external view returns(
        uint256[] memory voteWeighting,
        uint256[] memory tieWith,
        uint256 winningProposal,
        bool isVotingSucceed,
        uint256 totalVotes
    ) {
        if (_ballotId >= ballots.length)
            return (new uint256[](0), new uint256[](0), 0, false, 0);

        Ballot storage ballot = ballots[_ballotId];
        uint256 i = 0;
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
        return (ballots[_ballotId].investorToProposal[_voter].voteOption);
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
            (uint256(ballot.startTime).add(uint256(ballot.commitDuration))).add(uint256(ballot.revealDuration)),
            ballot.totalProposals,
            ballot.totalVoters,
            ballot.isActive
        );
    }

    /**
     * Return the commit relveal time duration of ballot
     * @param _ballotId Id of a ballot
     */
    function getBallotCommitRevealDuration(uint256 _ballotId) external view returns(uint256, uint256) {
        Ballot memory ballot = ballots[_ballotId];
        return (
            ballot.commitDuration,
            ballot.revealDuration
        );
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns(bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() external view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    function _isGreaterThanZero(uint256 _value) internal pure {
        require(_value > 0, "Invalid value");
    }

    function _checkIndexOutOfBound(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }

    function _checkValidStage(uint256 _ballotId, Stage _stage) internal view {
        require(getCurrentBallotStage(_ballotId) == _stage, "Not in a valid stage");
    }

}
