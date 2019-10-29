pragma solidity ^0.5.8;

import "../VotingCheckpoint.sol";
import "./AdvancedPLCRVotingCheckpointStorage.sol";
import "../../../../libraries/AdvancedPLCRVotingLib.sol";

contract AdvancedPLCRVotingCheckpoint is AdvancedPLCRVotingCheckpointStorage, VotingCheckpoint {

    using SafeMath for uint256;

    // Emits when the statutory ballot is created
    event StatutoryBallotCreated(
        uint256 indexed _ballotId,
        uint256 indexed _checkpointId,
        bytes32 indexed _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        bytes32 _details,
        uint256 _noOfChoices,
        string _proposalTitle,
        string _choices
    );
    // Emits when the cumulative ballot is created
    event CumulativeBallotCreated(
        uint256 indexed _ballotId,
        uint256 indexed _checkpointId,
        bytes32 indexed _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        bytes32[] _details,
        uint256[] _noOfChoices,
        string _proposalTitle,
        string _choices
    );
    // Emits when the voters get exempted from a given ballot
    event VotersExempted(uint256 indexed _ballotId, address[] _exemptedAddresses);
    // Emits when the allowed voter take participate in the commit phase of the given ballot
    event VoteCommit(address indexed _voter, uint256 _weight, uint256 _ballotId, bytes32 _secretHash);
    // Emits when the allowed voter take participate in the reveal phase of the given ballot
    event VoteRevealed(
        address indexed _voter,
        uint256 _weight,
        uint256 indexed _ballotId,
        uint256[] _choices,
        uint256 _salt
    );
    // Emits when the ballot is cancelled
    event BallotCancelled(uint256 indexed _ballotId);
    // Emits when the ballot exemption list gets changed
    event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address _exemptedAddress, bool _exempt);

    constructor(address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {

    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitle Title of proposal
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals
     * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     */
    function createStatutoryBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitle,
        bytes32 _details,
        string memory _choices,
        uint256 _noOfChoices
    )
    public
    withPerm(ADMIN)
    {   
        uint256 currentCheckpointId = securityToken.createCheckpoint();
        _createCustomStatutoryBallot(_name, _startTime, _commitDuration, _revealDuration, _proposalTitle, _details, _choices, _noOfChoices, currentCheckpointId);
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitle Title of proposal
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals
     * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY/ABSTAIN ballot type is choosen).
     * @param _checkpointId Valid checkpoint Id
     */
    function createCustomStatutoryBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitle,
        bytes32 _details,
        string memory _choices,
        uint256 _noOfChoices,
        uint256 _checkpointId
    )
    public
    withPerm(ADMIN) 
    {   
        _checkValidCheckpointId(_checkpointId);
        _createCustomStatutoryBallot(_name, _startTime, _commitDuration, _revealDuration, _proposalTitle, _details, _choices, _noOfChoices, _checkpointId);
    }

    function _createCustomStatutoryBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitle,
        bytes32 _details,
        string memory _choices,
        uint256 _noOfChoices,
        uint256 _checkpointId
    )
    internal
    {   
        _validateMaximumLimitCount();
        _startTime = _getStartTime(_startTime);
        _isEmptyBytes32(_name);
        _isEmptyString(_proposalTitle);
        _isGreaterThanZero(_commitDuration, _revealDuration);
        _deductUsageFee(); // Deducting the usage cost of creating the ballots
        uint256 ballotId = ballots.length;
        ballots.push(Ballot(
            _checkpointId, uint64(_commitDuration), uint64(_revealDuration), uint64(_startTime), uint24(1), uint32(0), false, _name
        ));
        _addProposal(_details, _noOfChoices, ballots[ballotId], 0);
        emit StatutoryBallotCreated(
            ballotId, _checkpointId, _name, _startTime, _commitDuration, _revealDuration, _details, _noOfChoices, _proposalTitle, _choices
        );
    }

    function _addProposal(
        bytes32 _details,
        uint256 _noOfChoices,
        Ballot storage _ballot,
        uint256 _proposalNo
    ) 
    internal 
    {
        _ballot.proposals[_proposalNo] = Proposal(_details, _noOfChoices);
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitles Title of proposals (In a comma seperated string)
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (In a comma seperated string)
     * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     * @param _checkpointId Valid checkpoint Id
     */
    function createCustomCumulativeBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitles,
        bytes32[] memory _details,
        string memory _choices,
        uint256[] memory _noOfChoices,
        uint256 _checkpointId
    ) 
    public
    withPerm(ADMIN) 
    {
        _checkValidCheckpointId(_checkpointId);
        _createCustomCumulativeBallot(
            _name, _startTime, _commitDuration, _revealDuration, _proposalTitles, _details, _choices, _noOfChoices, _checkpointId
        );
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitles Title of proposal (In a comma seperated string)
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (In a comma seperated string)
     * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     */
    function createCumulativeBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitles,
        bytes32[] memory _details,
        string memory _choices,
        uint256[] memory _noOfChoices
    ) 
    public
    withPerm(ADMIN)
    {   
        uint256 checkpointId = securityToken.createCheckpoint();
        _createCustomCumulativeBallot(
            _name, _startTime, _commitDuration, _revealDuration, _proposalTitles, _details, _choices, _noOfChoices, checkpointId
        );
    }

    function _createCustomCumulativeBallot(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string memory _proposalTitles,
        bytes32[] memory _details,
        string memory _choices,
        uint256[] memory _noOfChoices,
        uint256 _checkpointId
    )
    internal
    {
        //TODO: Charging Usage cost
        _validateMaximumLimitCount();
        _startTime = _getStartTime(_startTime);
        _isEmptyBytes32(_name);
        _isEmptyString(_proposalTitles);
        _isGreaterThanZero(_commitDuration, _revealDuration);
        _isValidLength(_noOfChoices.length, _details.length);
        _deductUsageFee(); // Deducting the usage cost of creating the ballots
        uint256 ballotId = ballots.length;
        ballots.push(Ballot(
            _checkpointId, uint64(_commitDuration), uint64(_revealDuration), uint64(_startTime), uint24(_noOfChoices.length), uint32(0), false, _name
        ));
        for (uint256 i = 0; i < _noOfChoices.length; i++) {
            _addProposal(_details[i], _noOfChoices[i], ballots[ballotId], i);
        }
        emit CumulativeBallotCreated(
            ballotId, _checkpointId, _name, _startTime, _commitDuration, _revealDuration, _details, _noOfChoices, _proposalTitles, _choices
        );
    } 

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitles Title of proposal (Comma seperated values)
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (Comma seperated values)
     * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     * @param _checkpointId Valid checkpoint Id
     * @param _exemptedAddresses List of addresses not allowed to vote
     */
    function createCustomCumulativeBallotWithExemption( 
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string calldata _proposalTitles,
        bytes32[] calldata _details,
        string calldata _choices,
        uint256[] calldata _noOfChoices,
        uint256 _checkpointId,
        address[] calldata _exemptedAddresses
    )
    external  // Permission will be taken care at createCustomCumulativeBallot function level
    {
        createCustomCumulativeBallot(
            _name,
            _startTime,
            _commitDuration,
            _revealDuration,
            _proposalTitles,
            _details,
            _choices,
            _noOfChoices,
            _checkpointId
        );         
        _addExemptedAddresses(_exemptedAddresses, ballots.length - 1);
    } 

    function _addExemptedAddresses(address[] memory _exemptedAddresses, uint256 _ballotId) internal {
        for (uint256 i = 0; i < _exemptedAddresses.length; i++) {
            Ballot storage ballot = ballots[_ballotId];
            if (_exemptedAddresses[i] != address(0))
                ballot.exemptedVoters[_exemptedAddresses[i]] = true;
        }
        emit VotersExempted(_ballotId, _exemptedAddresses);
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitles Title of proposal (Comma seperated values)
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (Comma seperated values)
     * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     * @param _exemptedAddresses List of addresses not allowed to vote
     */
    function createCumulativeBallotWithExemption(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string calldata _proposalTitles,
        bytes32[] calldata _details,
        string calldata _choices,
        uint256[] calldata _noOfChoices,
        address[] calldata _exemptedAddresses
    )
    external  // Permission will be taken care at createCumulativeBallot function level
    {
        createCumulativeBallot(
            _name,
            _startTime,
            _commitDuration,
            _revealDuration,
            _proposalTitles,
            _details,
            _choices,
            _noOfChoices
        );
        _addExemptedAddresses(_exemptedAddresses, ballots.length - 1);
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitle Title of proposal
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (Comma seperated values)
     * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     * @param _exemptedAddresses List of addresses not allowed to vote
     */
    function createStatutoryBallotWithExemption(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string calldata _proposalTitle,
        bytes32 _details,
        string calldata _choices,
        uint256 _noOfChoices,
        address[] calldata _exemptedAddresses
    )
    external  // Permission will be taken care at createStatutoryBallot function level
    {
        createStatutoryBallot(
            _name,
            _startTime,
            _commitDuration,
            _revealDuration,
            _proposalTitle,
            _details,
            _choices,
            _noOfChoices
        );
        _addExemptedAddresses(_exemptedAddresses, ballots.length - 1);
    }

    /**
     * @notice Use to create the ballot
     * @param _name Name of the ballot (Should be unique)
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitle Title of proposal
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (Comma seperated values)
     * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     * @param _checkpointId Valid checkpoint Id
     * @param _exemptedAddresses List of addresses not allowed to vote
     */
    function createCustomStatutoryBallotWithExemption(
        bytes32 _name,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        string calldata _proposalTitle,
        bytes32 _details,
        string calldata _choices,
        uint256 _noOfChoices,
        uint256 _checkpointId,
        address[] calldata _exemptedAddresses
    )
    external  // Permission will be taken care at createCustomStatutoryBallot function level
    {
        createCustomStatutoryBallot(
            _name,
            _startTime,
            _commitDuration,
            _revealDuration,
            _proposalTitle,
            _details,
            _choices,
            _noOfChoices,
            _checkpointId
        );
        _addExemptedAddresses(_exemptedAddresses, ballots.length - 1);
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
        require(ballot.voteDetails[msg.sender].secretVote == bytes32(0), "Already voted");
        require(!ballot.isCancelled, "Cancelled ballot");
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = uint256(ballot.totalProposals).mul(securityToken.balanceOfAt(msg.sender, ballot.checkpointId));
        require(weight > 0, "Invalid weight");
        // Update the storage value.
        ballot.voteDetails[msg.sender] = Vote(_secretVote);
        emit VoteCommit(msg.sender, weight, _ballotId, _secretVote);
    }

    /**
     * @notice Used to reveal the vote
     * @param _ballotId Given ballot Id
     * @param _choices Choices opt by the voter. 
     * @dev Its length should be equal to the aggregation of ∑(proposalᵢ * noOfChoicesᵢ) where i = 0 ...totalProposal-1
     * @param _salt used salt for hashing (unique for each user)
     */
    function revealVote(uint256 _ballotId, uint256[] calldata _choices, uint256 _salt) external {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        // Check for the valid stage. Whether that ballot is in the REVEAL state or not.
        _checkValidStage(_ballotId, Stage.REVEAL);
        Ballot storage ballot = ballots[_ballotId];
        // validate the storage values 
        require(!ballot.isCancelled, "Cancelled ballot");
        require(ballot.voteDetails[msg.sender].secretVote != bytes32(0), "No secret vote");
        uint256 choiceCount = 0;
        uint256 i;
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoice = ballot.proposals[i].noOfChoices;
            _noOfChoice = _noOfChoice == 0 ? 3 : _noOfChoice;
            choiceCount = choiceCount.add(_noOfChoice);
        }
        require(choiceCount == _choices.length, "Choices mismatch");

        // validate the secret vote
        require(
            bytes32(keccak256(abi.encodePacked(_choices, _salt))) == ballot.voteDetails[msg.sender].secretVote,
            "Invalid vote"
        );
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = uint256(ballot.totalProposals).mul(securityToken.balanceOfAt(msg.sender, ballot.checkpointId));
        choiceCount = 0;
        uint256 totalChoiceWeight = 0;
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoice = _getNoOfChoice(ballot.proposals[i].noOfChoices);
            uint256 temp = (choiceCount + _noOfChoice);
            for (uint256 j = choiceCount; j < temp; j++) {
                ballot.voteDetails[msg.sender].voteOptions[i].push(_choices[j]);
                totalChoiceWeight = totalChoiceWeight.add(_choices[j]);
            }
            choiceCount = temp;
        }
        require(totalChoiceWeight <= weight);
        // update the storage values
        ballot.totalVoters = ballot.totalVoters + 1;
        ballot.voteDetails[msg.sender] = Vote(bytes32(0));
        emit VoteRevealed(msg.sender, totalChoiceWeight, _ballotId, _choices, _salt);
    }

    /**
     * @notice Allows the token issuer to scrapped down a ballot
     * @param _ballotId The index of the target ballot
     */
    function cancelBallot(uint256 _ballotId) external withPerm(ADMIN) { 
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        require(
            now <= uint256(ballots[_ballotId].startTime)
            .add(uint256(ballots[_ballotId].commitDuration)
            .add(uint256(ballots[_ballotId].revealDuration))),
            "Already ended"
        );
        require(!ballots[_ballotId].isCancelled, "Already cancelled");
        ballots[_ballotId].isCancelled = true;
        emit BallotCancelled(_ballotId);
    }

    /**
     * Change the given ballot exempted list
     * @param _ballotId Given ballot Id
     * @param _exemptedAddress Address of the voter
     * @param _exempt Whether it is exempted or not
     */
    function changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) external withPerm(ADMIN) {
        _changeBallotExemptedVotersList(_ballotId, _exemptedAddress, _exempt);
    }

    /**
     * Change the given ballot exempted list (Multi)
     * @param _ballotId Given ballot Id
     * @param _exemptedAddresses Address of the voters
     * @param _exempts Whether it is exempted or not
     */
    function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _exemptedAddresses, bool[] calldata _exempts) external withPerm(ADMIN) {
        _isValidLength(_exemptedAddresses.length, _exempts.length);
        for (uint256 i = 0; i < _exemptedAddresses.length; i++) {
            _changeBallotExemptedVotersList(_ballotId, _exemptedAddresses[i], _exempts[i]);
        }
    }

    function _changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) internal {
         // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        // Check the valid stage of ballot
        require(getCurrentBallotStage(_ballotId) == Stage.PREP);
        require(_exemptedAddress != address(0), "Invalid address");
        require(ballots[_ballotId].exemptedVoters[_exemptedAddress] != _exempt, "No change");
        ballots[_ballotId].exemptedVoters[_exemptedAddress] = _exempt;
        emit ChangedBallotExemptedVotersList(_ballotId, _exemptedAddress, _exempt);
    }

    /**
     * Change the global exempted voters list
     * @param _voter Address of the voter
     * @param _exempt Whether it is exempted or not
     */
    function changeDefaultExemptedVotersList(address _voter, bool _exempt) public {
        // @FIXME add a reason string once we decrease overall contract size (also for all other instances of _isAnyBallotRunning)
        require(!_isAnyBallotRunning());
        super.changeDefaultExemptedVotersList(_voter, _exempt);
    }

    /**
     * Change the global exempted voters list
     * @param _voters Address of the voter
     * @param _exempts Whether it is exempted or not
     */
    function changeDefaultExemptedVotersListMulti(address[] memory _voters, bool[] memory _exempts) public {
        require(!_isAnyBallotRunning());
        super.changeDefaultExemptedVotersListMulti(_voters, _exempts);
    }

    function _isAnyBallotRunning() internal view returns (bool isAnyBallotActive) {
        uint256 length = ballots.length;
        isAnyBallotActive = false;
        if (length != 0) {
            uint256 count = length - 1;
            // "i <= count" is to prevert underflow.
            for (uint256 i = count; i >= 0 && i <= count; i--) {
                Stage currentStage = getCurrentBallotStage(i);
                if (!ballots[i].isCancelled && (currentStage == Stage.COMMIT || currentStage == Stage.REVEAL)) {
                    isAnyBallotActive = true;
                    break;
                }
            }
        }
    }

    ///////////////
    /// Getters
    //////////////

    /**
     * @notice Retrieves list of investors, their balances
     * @param _checkpointId Checkpoint Id to query for
     * @return address[] list of investors
     * @return uint256[] investor balances
     */
    function getCheckpointData(uint256 _checkpointId) external view returns (address[] memory investors, uint256[] memory balances) {
        investors = securityToken.getInvestorsAt(_checkpointId);
        balances = new uint256[](investors.length);
        for (uint256 i; i < investors.length; i++) {
            balances[i] = securityToken.balanceOfAt(investors[i], _checkpointId);
        }
    }

    /**
     * @notice Retrives the list of investors who are remain to vote
     * @param _ballotId Id of the ballot
     * @return address[] list of invesotrs who are remain to vote
     */
    function getPendingInvestorToVote(uint256 _ballotId) external view returns(address[] memory pendingInvestors) {
        if (_ballotId >= ballots.length)
            return pendingInvestors;
        else {
            pendingInvestors = AdvancedPLCRVotingLib.getPendingInvestorToVote(getAllowedVotersByBallot(_ballotId), ballots[_ballotId]);
        }
    }

    /**
     * @notice It will return the no. of the voters who take part in the commit phase of the voting
     * @param _ballotId Targeted ballot index
     * @return commitedVoteCount no. of the voters who take part in the commit phase of the voting    
     */
    function getCommitedVoteCount(uint256 _ballotId) public view returns(uint256 commitedVoteCount) {
        if (_ballotId >= ballots.length)
            return commitedVoteCount;
        else {
            commitedVoteCount = AdvancedPLCRVotingLib.getCommitedVoteCount(getAllowedVotersByBallot(_ballotId), ballots[_ballotId]);
        }
    }

    /**
     * @notice Get eligible voters list for the given ballot
     * @dev should be called off-chain
     * @param  _ballotId The index of the target ballot
     * @return voters Addresses of the voters
     */
    function getAllowedVotersByBallot(uint256 _ballotId) public view returns (address[] memory voters) {
        if (_ballotId >= ballots.length) {
            return voters;
        } else {
            uint256 count = 0;
            uint256 i;
            address[] memory investorAtCheckpoint = securityToken.getInvestorsAt(ballots[_ballotId].checkpointId);
            for (i = 0; i < investorAtCheckpoint.length; i++) {
                if (isVoterAllowed(_ballotId, investorAtCheckpoint[i]))
                    count++;
            }
            voters = new address[](count);
            count = 0;
            for (i = 0; i < investorAtCheckpoint.length; i++) {
                if (isVoterAllowed(_ballotId, investorAtCheckpoint[i])) {
                    voters[count] = investorAtCheckpoint[i];
                    count++;
                }
            }
        }
    }

    /**
     * @notice Get the data of all the ballots
     * @return ballotIds Id list of the ballots
     * @return names Name of the ballots
     * @return totalProposals List of the no. of the proposals in the ballot
     * @return currentStages Current stage of the ballot
     * @return isCancelled Array of boolean to know the status of the ballot
     */
    function getAllBallots() external view returns(
        uint256[] memory ballotIds,
        bytes32[] memory names,
        uint256[] memory totalProposals,
        Stage[] memory currentStages,
        bool[] memory isCancelled 
    )
    {
        uint256 len = ballots.length;
        ballotIds = new uint256[](len);
        names = new bytes32[](len);
        totalProposals = new uint256[](len);
        currentStages = new Stage[](len);
        isCancelled = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            ballotIds[i] = i;
            names[i] = ballots[i].name;
            totalProposals[i] = uint256(ballots[i].totalProposals);
            currentStages[i] = getCurrentBallotStage(i);
            isCancelled[i] = ballots[i].isCancelled;
        }
    }

    /**
     * @notice Return the list of the exempted voters list for a given ballotId
     * @param _ballotId BallotId for which exempted voters are queried.
     * @return exemptedVoters List of the exempted voters.
     */
    function getExemptedVotersByBallot(uint256 _ballotId) external view returns(address[] memory exemptedVoters) {
        if (_ballotId >= ballots.length) {
            return exemptedVoters;
        } else {
            exemptedVoters = AdvancedPLCRVotingLib.getExemptedVotersByBallot(
                    securityToken.getInvestorsAt(ballots[_ballotId].checkpointId),
                    defaultExemptedVoters,
                    ballots[_ballotId]
                );
            }
    }

    /**
     * @notice Provide the list of ballot in which given address is eligible for vote
     * @param _voter Ethereum address of the voter
     * @return ballots list of indexes of ballots on which given voter has to commit
     * @return ballots list of indexes of ballots on which given voter has to reveal
     */
    function pendingBallots(address _voter) external view returns (uint256[] memory commitBallots, uint256[] memory revealBallots) {
        uint256 revealCount = 0;
        uint256 commitCount = 0;
        for (uint256 i = 0; i < ballots.length; i ++) {
            if (getVoteTokenCount(_voter, i) > 0 && !ballots[i].isCancelled)
                commitCount++;
            else if (getCurrentBallotStage(i) == Stage.REVEAL && !ballots[i].isCancelled) {
                if (ballots[i].voteDetails[_voter].voteOptions[0].length == 0) {
                    revealCount++;
                }
            }
        }
        commitBallots = new uint256[](commitCount);
        revealBallots = new uint256[](revealCount);
        commitCount = 0;
        revealCount = 0;
        for (uint256 i = 0; i < ballots.length; i ++) {
            if (getVoteTokenCount(_voter, i) > 0 && !ballots[i].isCancelled) {
                commitBallots[commitCount] = i;
                commitCount++;
            }
            else if (getCurrentBallotStage(i) == Stage.REVEAL && !ballots[i].isCancelled) {
                if (ballots[i].voteDetails[_voter].voteOptions[0].length == 0) {
                    revealBallots[revealCount] = i;
                    revealCount++;
                }
            }
        }
    }

    /**
     * @notice Used to get the current stage of the ballot
     * @param _ballotId Given ballot Id
     */
    function getCurrentBallotStage(uint256 _ballotId) public view returns (Stage) {
        Ballot storage ballot = ballots[_ballotId];
        return AdvancedPLCRVotingLib.getCurrentBallotStage(ballot);
    }

    /**
     * @notice Get the voting power for an voter in terms of the token
     * @param _voter Address of the voter (Who will vote).
     * @param _ballotId Id of the ballot.
     */
    function getVoteTokenCount(address _voter, uint256 _ballotId) public view returns(uint256) {
        _checkIndexOutOfBound(_ballotId);
        Ballot storage ballot = ballots[_ballotId];
        if (ballot.voteDetails[_voter].secretVote == bytes32(0) && 
            (getCurrentBallotStage(_ballotId) != Stage.REVEAL && getCurrentBallotStage(_ballotId) != Stage.RESOLVED) &&
            isVoterAllowed(_ballotId, _voter)
        ) {
            return (ballot.totalProposals * securityToken.balanceOfAt(_voter, ballot.checkpointId));
        } else {
            // Return voting power = 0, when voter already vote for the given ballotId
            return uint256(0);
        }
    }

    /**
     * @notice Queries the result of a given ballot
     * @dev should be called off-chain
     * @param _ballotId Id of the target ballot
     * @return uint256 choicesWeighting
     * @return uint256 noOfChoicesInProposal
     * @return address voters
     */
    function getBallotResults(uint256 _ballotId) external view returns(
        uint256[] memory choicesWeighting,
        uint256[] memory noOfChoicesInProposal,
        address[] memory voters
    )
    {
        if (_ballotId >= ballots.length 
            || getCurrentBallotStage(_ballotId) != Stage.RESOLVED
            || ballots[_ballotId].isCancelled
        )
            return (choicesWeighting, noOfChoicesInProposal, voters);
        else {
            (choicesWeighting, noOfChoicesInProposal, voters) = AdvancedPLCRVotingLib.getBallotResults(
                getAllowedVotersByBallot(_ballotId),
                ballots[_ballotId]
            );
        }
    }

    /**
     * @notice Get the details of the ballot
     * @param _ballotId The index of the target ballot
     * @return name of the ballot
     * @return uint256 totalSupplyAtCheckpoint
     * @return uint256 checkpointId
     * @return uint256 startTime
     * @return uint256 commitDuration
     * @return uint256 revealDuration
     * @return uint256 totalProposals
     * @return uint256 totalVoters
     * @return uint256 commitedVoteCount
     * @return bool isCancelled
     * @return Stage currentStage
     * @return bytes32 proposalDetails
     * @return uint256 proposalChoicesCount
     */
    function getBallotDetails(uint256 _ballotId) public view returns(
        bytes32 name,
        uint256 totalSupplyAtCheckpoint,
        uint256 checkpointId,
        uint256 startTime,
        uint256 commitDuration,
        uint256 revealDuration,
        uint256 totalProposals,
        uint256 totalVoters,
        uint256 commitedVoteCount,
        bool isCancelled,
        Stage currentStage,
        bytes32[] memory proposalDetails,
        uint256[] memory proposalChoicesCounts
    ) {
        Ballot storage ballot = ballots[_ballotId];
        commitedVoteCount = getCommitedVoteCount(_ballotId);
        currentStage = getCurrentBallotStage(_ballotId);
        proposalDetails = new bytes32[](ballot.totalProposals);
        proposalChoicesCounts = new uint256[](ballot.totalProposals);
        for (totalProposals = 0; totalProposals < ballot.totalProposals; totalProposals++) { 
            proposalDetails[totalProposals] = ballot.proposals[totalProposals].details;
            proposalChoicesCounts[totalProposals] = ballot.proposals[totalProposals].noOfChoices; // if noOfChoices == 0 then it means the type of ballot is NAY/YAY
        }
        return (
            ballot.name,
            securityToken.totalSupplyAt(ballot.checkpointId),
            ballot.checkpointId,
            ballot.startTime,
            ballot.commitDuration,
            ballot.revealDuration,
            ballot.totalProposals,
            ballot.totalVoters,
            commitedVoteCount,
            ballot.isCancelled,
            currentStage,
            proposalDetails,
            proposalChoicesCounts
        );
    }

    /**
     * @notice Get the length of the ballots array
     * @return uint256 Length of the ballots array
     */
    function getBallotsArrayLength() public view returns(uint256 length) {
        return ballots.length;
    }

    /**
     * Use to check whether the voter is allowed to vote or not
     * @param _ballotId The index of the target ballot
     * @param _voter Address of the voter
     * @return bool
     */
    function isVoterAllowed(uint256 _ballotId, address _voter) public view returns(bool) {
        bool notAllowed = (ballots[_ballotId].exemptedVoters[_voter] || (defaultExemptIndex[_voter] != 0));
        return !notAllowed;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns(bytes4 initFunction) {
        return bytes4(0);
    }

    /**
     * @notice Return the permission flags that are associated with a module
     */
    function getPermissions() external view returns(bytes32[] memory permissions) {
        permissions = new bytes32[](1);
        permissions[0] = ADMIN;
        return permissions;
    }

    ////// Internal helper functions //////

    function _getStartTime(uint256 _startTime) internal view returns(uint256 startTime) {
        startTime = _startTime == 0 ? now : _startTime;
    }

    function _isGreaterThanZero(uint256 _commitDuration, uint256 _revealDuration) internal pure {
        require(_commitDuration > 0 && _revealDuration > 0, "Invalid duration");
    }

    function _isEmptyString(string memory _title) internal pure {
        require(keccak256(abi.encodePacked(_title)) != keccak256(abi.encodePacked("")), "Empty title");
    }

    function _isValidLength(uint256 _length1, uint256 _length2) internal pure {
        require(_length1 == _length2, "Length mismatch");
    }

    function _checkIndexOutOfBound(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }

    function _checkValidStage(uint256 _ballotId, Stage _stage) internal view {
        require(getCurrentBallotStage(_ballotId) == _stage, "Invalid stage");
    }

    function _isEmptyBytes32(bytes32 _name) internal pure {
        require(_name != bytes32(0), "Invalid name");
    }

    function _validateMaximumLimitCount() internal view {
        require(ballots.length < MAXLIMIT, "Max Limit Reached");
    }

    function _getNoOfChoice(uint256 _noOfChoice) internal pure returns(uint256 noOfChoice) {
        noOfChoice = _noOfChoice == 0 ? DEFAULTCHOICE : _noOfChoice;
    }

    function _checkValidCheckpointId(uint256 _checkpointId) internal view {
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpointId");
    }

}