pragma solidity ^0.5.0;

import "../../Module.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PLCRVotingCheckpoint is Module {

    using SafeMath for uint256;

    enum Stage { PREP, COMMIT, REVEAL, RESOLVED }

    struct Ballot {
        uint256 quorum;       // Should be a multiple of 10 ** 16
        uint256 totalSupply;
        uint256 checkpointId;
        uint64 commitDuration;
        uint64 revealDuration;
        uint64 startTime;
        uint24 totalProposals;
        uint32 totalVotes;
        uint8 isActive;
        mapping(uint256 => uint256) weightedVote;
        mapping(address => Vote) proposalToVote;
    }

    struct Vote {
        uint256 voteOption;
        bytes32 secretVote;
        bool isRevealed;
    }

    Ballot[] ballots;

    event VoteCommited(address indexed _voter, uint256 _weight, uint256 _ballotId, bytes32 _secretVote);
    event BallotCreated(
        uint256 indexed _ballotId,
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _startTime,
        uint256 _proposedQuorum,
        uint256 _totalSupply,
        uint256 _checkpointId
    );
    event VoteRevealed(address _voter, uint256 _weight, uint256 indexed _ballotId, uint256 _choiceOfProposal, uint256 _salt, bytes32 _secretVote);
    event BallotStatusChanged(uint256 _ballotId, bool _newStatus);

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
     * @param _proposedQuorum Minimum number of weight vote requires to win a election.
     */
    function createBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _proposedQuorum) external withPerm(ADMIN) {
        uint256 startTime = now;
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _proposedQuorum, checkpointId, startTime);
    }

    /**
     * @notice Use to create the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _noOfProposals Total number of proposal used in the ballot. In general it is 2 (For & Against)
     * @param _proposedQuorum Minimum number of weight vote requires to win a election.
     * @param _checkpointId Valid checkpoint Id
     * @param _startTime startTime of the ballot
     */
    function createCustomBallot(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _proposedQuorum,
        uint256 _checkpointId,
        uint256 _startTime
    )
        external
        withPerm(ADMIN)
    {
        require(_checkpointId <= ISecurityToken(securityToken).currentCheckpointId(), "Invalid checkpoint Id");
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _proposedQuorum, _checkpointId, _startTime);
    }

    function _createBallotWithCheckpoint(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _totalProposals,
        uint256 _proposedQuorum,
        uint256 _checkpointId,
        uint256 _startTime
    )
        internal
    {
        // Sanity checks
        _validValueCheck(_commitDuration);
        _validValueCheck(_revealDuration);
        _validValueCheck(_proposedQuorum);
        require(_startTime >= now, "Invalid start time");
        require(_totalProposals > 1, "totalProposals should be > 1");
        uint256 supplyAtCheckpoint = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        uint256 _ballotId = ballots.length;
        ballots.push(Ballot(
            _proposedQuorum,
            supplyAtCheckpoint,
            _checkpointId,
            uint64(_commitDuration),
            uint64(_revealDuration),
            uint64(_startTime),
            uint24(_totalProposals),
            uint32(0),
            uint8(1)
        ));
        emit BallotCreated(_ballotId, _commitDuration, _revealDuration, _totalProposals, _startTime, _proposedQuorum, supplyAtCheckpoint, _checkpointId);
    }

    /**
     * @notice Used to commit the vote
     * @param _ballotId Given ballot Id
     * @param _secretVote It is secret hash value (hashed offchain)
     */
    function commitVote(uint256 _ballotId, bytes32 _secretVote) external {
        _validBallotId(_ballotId);
        require(getBallotStage(_ballotId) == Stage.COMMIT, "Not in commit stage");
        Ballot storage ballot = ballots[_ballotId];
        require(ballot.proposalToVote[msg.sender].secretVote == bytes32(0), "Already voted");
        require(_secretVote != bytes32(0), "Invalid vote");
        require(ballot.isActive == uint8(1), "Inactive ballot");
        uint256 weight = ISecurityToken(securityToken).balanceOfAt(msg.sender, ballot.checkpointId);
        ballot.proposalToVote[msg.sender] = Vote(0, _secretVote, false);
        emit VoteCommited(msg.sender, weight, _ballotId, _secretVote);
    }

    /**
     * @notice Used to reveal the vote
     * @param _ballotId Given ballot Id
     * @param _choiceOfProposal Proposal chossed by the voter.
     * @param _salt used salt for hashing (unique for each user)
     */
    function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external {
        _validBallotId(_ballotId);
        require(getBallotStage(_ballotId) == Stage.REVEAL, "Not in reveal stage");
        Ballot storage ballot = ballots[_ballotId];
        require(ballot.isActive == uint8(1), "Inactive ballot");
        require(_choiceOfProposal < ballot.totalProposals, "Invalid proposal choice");
        require(!ballot.proposalToVote[msg.sender].isRevealed, "Already revealed");

        // validate the secret vote
        require(
            bytes32(keccak256(abi.encodePacked(_choiceOfProposal, _salt))) == ballot.proposalToVote[msg.sender].secretVote,
            "Invalid vote"
        );
        uint256 weight = ISecurityToken(securityToken).balanceOfAt(msg.sender, ballot.checkpointId);
        ballot.weightedVote[_choiceOfProposal] = ballot.weightedVote[_choiceOfProposal].add(weight);
        ballot.totalVotes = ballot.totalVotes + 1;
        ballot.proposalToVote[msg.sender].voteOption = _choiceOfProposal;
        ballot.proposalToVote[msg.sender].isRevealed = true;
        emit VoteRevealed(msg.sender, weight, _ballotId, _choiceOfProposal, _salt, ballot.proposalToVote[msg.sender].secretVote);
    }

    /**
     * @notice Allows the token issuer to set the active stats of a ballot
     * @param _ballotId The index of the target ballot
     * @param _isActive The bool value of the active stats of the ballot
     */
    function changeBallotStatus(uint256 _ballotId, bool _isActive) external withPerm(ADMIN) {
        _validBallotId(_ballotId);
        require(
            now < uint256(ballots[_ballotId].startTime)
            .add(uint256(ballots[_ballotId].commitDuration)
            .add(uint256(ballots[_ballotId].revealDuration))),
            "Already ended"
        );
        uint8 activeStatus = 0;
        if (_isActive)
            activeStatus = 1;
        require(ballots[_ballotId].isActive != activeStatus, "Active state unchanged");
        ballots[_ballotId].isActive = activeStatus;
        emit BallotStatusChanged(_ballotId, _isActive);
    }

    /**
     * @notice Used to get the current stage of the ballot
     * @param _ballotId Given ballot Id
     */
    function getBallotStage(uint256 _ballotId) public view returns (Stage) {
        Ballot memory ballot = ballots[_ballotId];
        uint256 commitTimeEnd = uint256(ballot.startTime).add(uint256(ballot.commitDuration));
        uint256 revealTimeEnd = commitTimeEnd.add(uint256(ballot.revealDuration));

        if (now < ballot.startTime)
            return Stage.PREP;
        else if (now <= commitTimeEnd && now >= ballot.startTime)
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
     * @return uint256 totalVotes
     */
    function getBallotResult(uint256 _ballotId) external view returns(uint256[] memory, uint256[] memory, uint256, uint256) {
        if (_ballotId >= ballots.length)
            return (new uint256[](0), new uint256[](0), 0, 0);
        
        Ballot storage ballot = ballots[_ballotId];
        uint256 i = 0;
        uint256 counter = 0;
        uint256 maxWeight = 0;
        uint256 winningProposal;
        for (i = 0; i < ballot.totalProposals; i++) {
            if (maxWeight < ballot.weightedVote[i]) {
                maxWeight = ballot.weightedVote[i];
                winningProposal = i;
            }
        }
        for (i = 0; i < ballot.totalProposals; i++) {
            if (maxWeight == ballot.weightedVote[i])
                counter ++;
        }
        uint256[] memory voteWeighting = new uint256[](ballot.totalProposals);
        uint256[] memory tieWith = new uint256[](counter);
        counter = 0;
        for (i = 0; i < ballot.totalProposals; i++) {
            voteWeighting[i] = ballot.weightedVote[i];
            if (maxWeight == ballot.weightedVote[i]) {
                tieWith[counter] = i;
                counter ++;
            }   
        }
        uint256 quorumWeight = (ballot.totalSupply.mul(ballot.quorum)).div(10 ** 18);
        if (maxWeight < quorumWeight)
            winningProposal = 0;
        return (voteWeighting, tieWith, winningProposal, ballot.totalVotes);  
    }

    /**
     * @notice Get the voted proposal
     * @param _ballotId Id of the ballot
     * @param _voter Address of the voter
     */
    function getSelectedProposal(uint256 _ballotId, address _voter) external view returns(uint256 proposalId) {
        if (_ballotId >= ballots.length)
            return 0;
        return ballots[_ballotId].proposalToVote[_voter].voteOption;
    }

    /**
     * @notice Get the stats of the ballot
     * @param _ballotId The index of the target ballot
     */
    function getBallotStats(uint256 _ballotId) external view returns(uint256, uint256, uint256, uint64, uint64, uint64, uint32, uint32, bool) {
        Ballot memory ballot = ballots[_ballotId];
        return (
            ballot.quorum,
            ballot.totalSupply,
            ballot.checkpointId,
            ballot.commitDuration,
            ballot.revealDuration,
            ballot.startTime,
            ballot.totalProposals,
            ballot.totalVotes,
            (ballot.isActive == 1 ? true : false)
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

    function _validValueCheck(uint256 _value) internal pure {
        require(_value > 0, "Invalid value");
    }

    function _validBallotId(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }
}