pragma solidity ^0.5.0;

import "../../Module.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PLCRVotingCheckpoint is Module {

    using SafeMath for uint256;

    enum Stage { PREP, COMMIT, REVEAL, RESOLVED }

    struct Ballot {
        uint64 commitDuration;
        uint64 revealDuration;
        uint64 startTime;
        uint64 noOfProposals;
        uint256 quorum;
        uint256 totalSupply;
        uint256 checkpointId;
        mapping(uint256 => uint256) weightedVote;
        mapping(address => Vote) proposalToVote;
    }

    struct Vote {
        uint256 timestamp;
        uint256 voteOption;
        uint256 weight;
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


    constructor(address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {

    } 

    function createBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _proposedQuorum) external {
        _onlySecurityTokenOwner();
        uint256 startTime = now;
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _proposedQuorum, checkpointId, startTime);
    }

    function createBallotWithCheckpoint(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _proposedQuorum,
        uint256 _checkpointId,
        uint256 _startTime
    )
        external
    {
        _onlySecurityTokenOwner();
        _createBallotWithCheckpoint(_commitDuration, _revealDuration, _noOfProposals, _proposedQuorum, _checkpointId, _startTime);
    }

    function _createBallotWithCheckpoint(
        uint256 _commitDuration,
        uint256 _revealDuration,
        uint256 _noOfProposals,
        uint256 _proposedQuorum,
        uint256 _checkpointId,
        uint256 _startTime
    )
        internal
    {
        // Sanity checks
        _validValueCheck(_commitDuration);
        _validValueCheck(_revealDuration);
        require(_startTime >= now, "Invalid start time");
        require(_noOfProposals > 1, "noOfProposals should be > 1");
        uint256 supplyAtCheckpoint = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        uint256 _ballotId = ballots.length;
        ballots.push(Ballot(
            uint64(_commitDuration),
            uint64(_revealDuration),
            uint64(_startTime),
            uint64(_noOfProposals),
            _proposedQuorum,
            supplyAtCheckpoint,
            _checkpointId
        ));
        emit BallotCreated(_ballotId, _commitDuration, _revealDuration, _noOfProposals, _startTime, _proposedQuorum, supplyAtCheckpoint, _checkpointId);
    }

    function commitVote(uint256 _ballotId, bytes32 _secretVote) external {
        _validBallotId(_ballotId);
        require(getBallotStage(_ballotId) == Stage.COMMIT, "Not in commit stage");
        Ballot storage ballot = ballots[_ballotId];
        require(ballot.proposalToVote[msg.sender].timestamp == uint256(0), "Already voted");
        require(_secretVote != bytes32(0), "Invalid vote");
        uint256 weight = ISecurityToken(securityToken).balanceOfAt(msg.sender, ballot.checkpointId);
        ballot.proposalToVote[msg.sender] = Vote(now, weight, 0, _secretVote, false);
        emit VoteCommited(msg.sender, weight, _ballotId, _secretVote);
    }

    function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external {
        _validBallotId(_ballotId);
        require(getBallotStage(_ballotId) == Stage.REVEAL, "Not in reveal stage");
        Ballot storage ballot = ballots[_ballotId];
        require(_choiceOfProposal <= ballot.noOfProposals, "Invalid proposal choice");
        require(!ballot.proposalToVote[msg.sender].isRevealed, "Already revealed");

        // validate the secret vote
        require(
            bytes32(keccak256(abi.encodePacked(_choiceOfProposal, _salt))) == ballot.proposalToVote[msg.sender].secretVote,
            "Invalid vote"
        );
        uint256 weight = ballot.proposalToVote[msg.sender].weight;
        ballot.weightedVote[_choiceOfProposal] = weight;
        ballot.proposalToVote[msg.sender].voteOption = _choiceOfProposal;
        ballot.proposalToVote[msg.sender].isRevealed = true;
        emit VoteRevealed(msg.sender, weight, _ballotId, _choiceOfProposal, _salt, ballot.proposalToVote[msg.sender].secretVote);
    }

    function getBallotStage(uint256 _ballotId) public view returns (Stage) {
        Ballot memory ballot = ballots[_ballotId];
        uint256 commitTimeEnd = uint256(ballot.startTime).add(uint256(ballot.commitDuration));
        uint256 revealTimeEnd = uint256(ballot.startTime).add(uint256(ballot.commitDuration)).add(uint256(ballot.revealDuration));

        if (now < ballot.startTime)
            return Stage.PREP;
        else if (now <= commitTimeEnd && now >= ballot.startTime)
            return Stage.COMMIT;
        else if ( now > commitTimeEnd && now <= revealTimeEnd)
            return Stage.REVEAL;
        else if (now > revealTimeEnd)
            return Stage.RESOLVED;
    }

    function getTally(uint256 _ballotId) external view returns(uint256, uint256, uint256[] memory) {
        if (_ballotId < ballots.length) {
            Ballot storage ballot = ballots[_ballotId];
            uint256 maxWeight;
            uint256 winningProposal;
            uint256[] memory voteTally = new uint256[](ballot.noOfProposals);
            for (uint256 i = 0; i < ballot.noOfProposals; i++) {
                if (maxWeight < ballot.weightedVote[i + 1]) {
                    maxWeight = ballot.weightedVote[i + 1];
                    winningProposal = i;
                }
                voteTally[i] = ballot.weightedVote[i + 1];
            }
            uint256 quorumWeight = (ballot.totalSupply.mul(ballot.quorum)).div(10 ** 18);
            if (maxWeight < quorumWeight)
                winningProposal = 0;
            return (uint256(ballot.noOfProposals), winningProposal, voteTally);
        } else
            return (0, 0, new uint256[](0));
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
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

    function _validValueCheck(uint256 _value) internal pure {
        require(_value > 0, "Invalid value");
    }

    function _validBallotId(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }
}