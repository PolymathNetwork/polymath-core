pragma solidity ^0.5.8;

import "../modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpointStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library AdvancedPLCRVotingLib {

    using SafeMath for uint256;

    uint256 internal constant DEFAULTCHOICE = uint256(3);

    /**
     * @notice Queries the result of a given ballot
     * @dev should be called off-chain
     * @param allowedVoters list of voters those are allowed to vote
     * @param ballot Details of the given ballot id
     * @return uint256 choicesWeighting
     * @return uint256 noOfChoicesInProposal
     * @return address voters
     */
    function getBallotResults(address[] memory allowedVoters, AdvancedPLCRVotingCheckpointStorage.Ballot storage ballot) public view returns(
        uint256[] memory choicesWeighting,
        uint256[] memory noOfChoicesInProposal,
        address[] memory voters
    )
    {
        voters = new address[](ballot.totalVoters);
        (uint256 i, uint256 j, uint256 k, uint256 count) = (0, 0, 0, 0);
        // Filtering the actual voters address from the allowed voters address list
        for (i = 0; i < allowedVoters.length; i++) {
            if (ballot.voteDetails[allowedVoters[i]].voteOptions[0].length > 0) {
                voters[count] = allowedVoters[i];
                count++;
            } 
        }
        count = 0;
        // calculating the length of the choicesWeighting array it should be equal
        // to the aggregation of ∑(proposalᵢ * noOfChoicesᵢ) where i = 0 ...totalProposal-1 
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoice = _getNoOfChoice(ballot.proposals[i].noOfChoices);
            count = count.add(_noOfChoice);
        }
        choicesWeighting = new uint256[](count);
        noOfChoicesInProposal = new uint256[](ballot.totalProposals);
        count = 0;
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoices = _getNoOfChoice(ballot.proposals[i].noOfChoices);
            noOfChoicesInProposal[i] = _noOfChoices;
            uint256 nextProposalChoiceLen = count + _noOfChoices;
            for (j = 0; j < ballot.totalVoters; j++) {
                uint256[] storage choiceWeight = ballot.voteDetails[voters[j]].voteOptions[i];
                uint256 m = 0;
                for (k = count; k < nextProposalChoiceLen; k++) {
                    choicesWeighting[k] = choicesWeighting[k].add(choiceWeight[m]);
                    m++;
                }
            }
            count = nextProposalChoiceLen;
        }
    }

    /**
     * @notice Return the list of the exempted voters list for a given ballotId
     * @param investorAtCheckpoint Non zero investor at a given checkpoint.
     * @param defaultExemptedVoters List of addresses which are globally exempted.
     * @param ballot Details of the ballot
     * @return exemptedVoters List of the exempted voters.
     */
    function getExemptedVotersByBallot(
        address[] memory investorAtCheckpoint,
        address[] memory defaultExemptedVoters,
        AdvancedPLCRVotingCheckpointStorage.Ballot storage ballot
    ) 
        public
        view
        returns(address[] memory exemptedVoters)
    {
        uint256 count = 0;
        uint256 i;
        uint256 length = investorAtCheckpoint.length;
        for (i = 0; i < length; i++) {
            if (ballot.exemptedVoters[investorAtCheckpoint[i]])
                count++;
        }
        exemptedVoters = new address[](count.add(defaultExemptedVoters.length));
        count = 0;
        for (i = 0; i < length; i++) {
            if (ballot.exemptedVoters[investorAtCheckpoint[i]]) {
                exemptedVoters[count] = investorAtCheckpoint[i];
                count++;
            }
        }
        for (i = 0; i < defaultExemptedVoters.length; i++) {
            exemptedVoters[count] = defaultExemptedVoters[i];
            count++;
        }
    }


    /**
     * @notice Retrives the list of investors who are remain to vote
     * @param allowedVoters list of voters those are allowed to vote
     * @param ballot Details of the given ballot id
     * @return address[] list of invesotrs who are remain to vote
     */
    function getPendingInvestorToVote(
        address[] memory allowedVoters,
        AdvancedPLCRVotingCheckpointStorage.Ballot storage ballot
    ) 
        public
        view
        returns(address[] memory pendingInvestors)
    {
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < allowedVoters.length ; i++) {
            if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.COMMIT) {
                if (ballot.voteDetails[allowedVoters[i]].secretVote == bytes3(0)) {
                    count++;
                }
            }
            else if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.REVEAL) {
                if (ballot.voteDetails[allowedVoters[i]].voteOptions[0].length == 0) {
                    count++;
                }
            }
        }
        pendingInvestors = new address[](count);
        count = 0;
        for (i = 0; i < allowedVoters.length ; i++) {
            if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.COMMIT) {
                if (ballot.voteDetails[allowedVoters[i]].secretVote == bytes3(0)) {
                    pendingInvestors[count] = allowedVoters[i];
                    count++;
                }
            }
            else if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.REVEAL) {
                if (ballot.voteDetails[allowedVoters[i]].voteOptions[0].length == 0) {
                    pendingInvestors[count] = allowedVoters[i];
                    count++;
                }
            }
        }
    }

    /**
     * @notice It will return the no. of the voters who take part in the commit phase of the voting
     * @param allowedVoters list of voters those are allowed to vote
     * @param ballot Details of the given ballot id
     * @return commitedVoteCount no. of the voters who take part in the commit phase of the voting    
     */
    function getCommitedVoteCount(
        address[] memory allowedVoters,
        AdvancedPLCRVotingCheckpointStorage.Ballot storage ballot
    ) 
        public
        view
        returns (uint256 commitedVoteCount)
    {
        uint256 i;
        if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.COMMIT) {
            for (i = 0; i < allowedVoters.length; i++) {
                if (ballot.voteDetails[allowedVoters[i]].secretVote != bytes32(0))
                    commitedVoteCount++;
            }
        } else if (getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.REVEAL
                || getCurrentBallotStage(ballot) == AdvancedPLCRVotingCheckpointStorage.Stage.RESOLVED) {
            for (i = 0; i < allowedVoters.length; i++) {
                if (ballot.voteDetails[allowedVoters[i]].secretVote != bytes32(0)
                    || ballot.voteDetails[allowedVoters[i]].voteOptions[0].length != uint256(0))
                    commitedVoteCount++;
            }
        }
    }

    /**
     * @notice Used to get the current stage of the ballot
     * @param ballot Details of the given ballot id
     */
    function getCurrentBallotStage(AdvancedPLCRVotingCheckpointStorage.Ballot storage ballot) public view returns (AdvancedPLCRVotingCheckpointStorage.Stage) {
        uint256 commitTimeEnd = uint256(ballot.startTime).add(uint256(ballot.commitDuration));
        uint256 revealTimeEnd = commitTimeEnd.add(uint256(ballot.revealDuration));

        if (now < ballot.startTime)
            return AdvancedPLCRVotingCheckpointStorage.Stage.PREP;
        else if (now >= ballot.startTime && now <= commitTimeEnd) 
            return AdvancedPLCRVotingCheckpointStorage.Stage.COMMIT;
        else if ( now > commitTimeEnd && now <= revealTimeEnd)
            return AdvancedPLCRVotingCheckpointStorage.Stage.REVEAL;
        else if (now > revealTimeEnd)
            return AdvancedPLCRVotingCheckpointStorage.Stage.RESOLVED;
    }


    function _getNoOfChoice(uint256 _noOfChoice) internal pure returns(uint256 noOfChoice) {
        noOfChoice = _noOfChoice == 0 ? DEFAULTCHOICE : _noOfChoice;
    }
    
}