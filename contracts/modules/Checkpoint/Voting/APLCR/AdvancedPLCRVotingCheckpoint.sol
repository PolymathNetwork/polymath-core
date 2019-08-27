pragma solidity ^0.5.8;

import "../VotingCheckpoint.sol";
import "./AdvancedPLCRVotingCheckpointStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract AdvancedPLCRVotingCheckpoint is AdvancedPLCRVotingCheckpointStorage, VotingCheckpoint {

    using SafeMath for uint256;

    // Declared Events

    event StatuaryBallotCreated(
        uint256 indexed _ballotId,
        uint256 indexed _checkpointId,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        bytes32 _details,
        uint256 _noOfChoices,
        string _proposalTitle,
        string _choices
    );

    event CumulativeBallotCreated(
        uint256 indexed _checkpointId,
        uint256 _startTime,
        uint256 _commitDuration,
        uint256 _revealDuration,
        bytes32[] _details,
        uint256[] _noOfChoices,
        string _proposalTitle,
        string _choices
    );

    event VotersExempted(uint256 indexed _ballotId, address[] _exemptedAddresses);

    event VoteCommit(address indexed _voter, uint256 _weight, uint256 _ballotId, bytes32 _secretHash);

    event VoteRevealed(
        address indexed _voter,
        uint256 _weight,
        uint256 indexed _ballotId,
        uint256[] _choices,
        uint256 _salt
    );

    event BallotStatusChanged(uint256 indexed _ballotId, bool _newStatus);
    event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address _exemptedAddress, bool _exempt);

    constructor(address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {

    }

    // 4 way to create the statutory ballot - 
    // 1- createStatutoryBallot (Dynamic creation of checkpoint)
    // 2- createCustomStatutoryBallot (Pass the checkpoint)
    // 3- createStatutoryBallotWithExemption (Pass the exemption)
    // 4- createCustomStatutoryBallotWithExemption (Pass the exemption list + pass the checkpoint)


    // 4 way to create the Cumulative ballot - 
    // 1- createCumulativeBallot (Dynamic creation of checkpoint)
    // 2- createCustomCumulativeBallot (Pass the checkpoint)
    // 3- createCumulativeBallotWithExemption (Pass the exemption)
    // 4- createCustomCumulativeBallotWithExemption (Pass the exemption list + pass the checkpoint)

    // passing the choices in comma seperated value
    // A,B,C,D -- noOfChoices = 4
    // if noOfChoices == 0 then it means ballot is NAY/YAY type

    // Smart contract is not storing the choices because choices are string & expected length is more than 32 bytes so
    // we are just emmiting the choices list to help dApp developers to know about the choices

    // If one proposal with choices A,B,C,D & investor balance is 100 then it means voting token count = 100
    // secretVote = hash([20, 50, 30, 0], salt), where salt is the unique for every investor

    // revaling process will be something like below for above use case
    // pass choices [20,50,30,0] & unique salt

    // if 3 proposal with choices [a,b,c],[d,e,f,g],[h,i,j,k,l] & investor balance is 100 then voting token count = 3 * 100
    // secretVote = hash([10, 30,0,50,10,100,0,20,0,0,0,80], salt)

    /**
     * @notice Use to create the ballot
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitle Title of proposal
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals
     * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     */
    function createStatutoryBallot(
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
        _createCustomStatutoryBallot(_startTime, _commitDuration, _revealDuration, _proposalTitle, _details, _choices, _noOfChoices, currentCheckpointId);
    }

    /**
     * @notice Use to create the ballot
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
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint Id");
        _createCustomStatutoryBallot(_startTime, _commitDuration, _revealDuration, _proposalTitle, _details, _choices, _noOfChoices, _checkpointId);
    }

    function _createCustomStatutoryBallot(
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
        //TODO: Charging Usage cost
        uint256 startTime = _getStartTime(_startTime);
        _isEmptyTitle(_proposalTitle);
        _isGreaterThanZero(_commitDuration, _revealDuration);
        uint256 ballotId = ballots.length;
        ballots.push(Ballot(
            _checkpointId, uint64(_commitDuration), uint64(_revealDuration), uint64(startTime), uint24(1), uint32(0), true
        ));
        Ballot storage currentBallot = ballots[ballotId];
        _addProposal(_details, _noOfChoices, currentBallot, 0);
        emit StatuaryBallotCreated(
            ballotId, _checkpointId, startTime, _commitDuration, _revealDuration, _details, _noOfChoices, _proposalTitle, _choices
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
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint Id");
        _createCustomCumulativeBallot(
            _startTime, _commitDuration, _revealDuration, _proposalTitles, _details, _choices, _noOfChoices, _checkpointId
        );
    }

    /**
     * @notice Use to create the ballot
     * @param _startTime startTime of the ballot
     * @param _commitDuration Unix time period till the voters commit there vote
     * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
     * @param _proposalTitles Title of proposal (In a comma seperated string)
     * @param _details Off-chain details related to the proposal
     * @param _choices Choices of proposals (In a comma seperated string)
     * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is choosen).
     */
    function createCumulativeBallot(
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
            _startTime, _commitDuration, _revealDuration, _proposalTitles, _details, _choices, _noOfChoices, checkpointId
        );
    }

    function _createCustomCumulativeBallot(
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
        uint256 startTime = _getStartTime(_startTime);
        _isGreaterThanZero(_commitDuration, _revealDuration);
        _isValidLength(_noOfChoices.length, _details.length);
        uint256 ballotId = ballots.length;
        ballots.push(Ballot(
            _checkpointId, uint64(_commitDuration), uint64(_revealDuration), uint64(startTime), uint24(_noOfChoices.length), uint32(0), true
        ));
        Ballot storage currentBallot = ballots[ballotId];
        for (uint256 i = 0; i < _noOfChoices.length; i++) {
            _addProposal(_details[i], _noOfChoices[i], currentBallot, i);
        }
        emit CumulativeBallotCreated(
            _checkpointId, startTime, _commitDuration, _revealDuration, _details, _noOfChoices, _proposalTitles, _choices
        );
    } 

    /**
     * @notice Use to create the ballot
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
        require(ballot.isActive, "Inactive ballot");
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = securityToken.balanceOfAt(msg.sender, ballot.checkpointId);
        require(weight > 0, "Zero weight is not allowed");
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
        require(ballot.isActive, "Inactive ballot");
        require(ballot.voteDetails[msg.sender].secretVote != bytes32(0), "Secret vote not available");
        uint256 choiceCount = 0;
        uint256 i;
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoice = ballot.proposals[i].noOfChoices;
            _noOfChoice = _noOfChoice == 0 ? 3 : _noOfChoice;
            choiceCount = choiceCount.add(_noOfChoice);
        }
        require(choiceCount == _choices.length, "Invalid choices");

        // validate the secret vote
        require(
            bytes32(keccak256(abi.encodePacked(_choices, _salt))) == ballot.voteDetails[msg.sender].secretVote,
            "Invalid vote"
        );
        // Get the balance of the voter (i.e `msg.sender`) at the checkpoint on which ballot was created.
        uint256 weight = securityToken.balanceOfAt(msg.sender, ballot.checkpointId);
        choiceCount = 0;
        uint256 totalChoiceWeight = 0;
        for (i = 0; i < ballot.totalProposals; i++) {
            uint256 _noOfChoice = ballot.proposals[i].noOfChoices;
            _noOfChoice = _noOfChoice == 0 ? 3 : _noOfChoice;
            uint256 temp = (choiceCount + _noOfChoice);
            for (uint256 j = choiceCount; j < temp; j++) {
                ballot.voteDetails[msg.sender].voteOptions[i].push(_choices[j]);
                totalChoiceWeight = totalChoiceWeight.add(_choices[j]);
            }
            choiceCount = temp;
        }
        require(totalChoiceWeight == weight, "Invalid distribution of vote token");

        // update the storage values
        ballot.totalVoters = ballot.totalVoters + 1;
        ballot.voteDetails[msg.sender] = Vote(bytes32(0));
        emit VoteRevealed(msg.sender, weight, _ballotId, _choices, _salt);
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
            Ballot memory ballot = ballots[_ballotId];
            address[] memory investorAtCheckpoint = securityToken.getInvestorsAt(ballot.checkpointId);
            uint256 length = investorAtCheckpoint.length;
            for (i = 0; i < length; i++) {
                if (isVoterAllowed(_ballotId, investorAtCheckpoint[i]))
                    count++;
            }
            voters = new address[](count);
            count = 0;
            for (i = 0; i < length; i++) {
                if (isVoterAllowed(_ballotId, investorAtCheckpoint[i])) {
                    voters[count] = investorAtCheckpoint[i];
                    count++;
                }
            }
        }
    }

    /**
     * @notice Provide the list of ballot in which given address is eligible for vote
     * @param _voter Ethereum address of the voter
     * @return ballots list of indexes of ballots
     */
    function pendingBallots(address _voter) view external returns (uint256[] memory ballotIds) {
        uint256 count = 0;
        for (uint256 i = 0; i < ballots.length; i ++) {
            if (getVoteTokenCount(_voter, i) > 0 && ballots[i].isActive)
                count++;
        }
        ballotIds = new uint256[](count);
        count = 0;
        for (uint256 i = 0; i < ballots.length; i ++) {
            if (getVoteTokenCount(_voter, i) > 0 && ballots[i].isActive) {
                ballotIds[count] = i;
                count++;
            }
        }
    }

    /**
     * Change the given ballot exempted list
     * @param _ballotId Given ballot Id
     * @param _exemptedAddress Address of the voter
     * @param _exempt Whether it is exempted or not
     */
    function changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) external withPerm(ADMIN) {
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        _changeBallotExemptedVotersList(_ballotId, _exemptedAddress, _exempt);
    }

    /**
     * Change the given ballot exempted list (Multi)
     * @param _ballotId Given ballot Id
     * @param _exemptedAddresses Address of the voters
     * @param _exempts Whether it is exempted or not
     */
    function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _exemptedAddresses, bool[] calldata _exempts) external withPerm(ADMIN) {
        require(_exemptedAddresses.length == _exempts.length, "Length mismatch");
        // Check for the ballots array out of bound
        _checkIndexOutOfBound(_ballotId);
        for (uint256 i = 0; i < _exemptedAddresses.length; i++) {
            _changeBallotExemptedVotersList(_ballotId, _exemptedAddresses[i], _exempts[i]);
        }
    }

    function _changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) internal {
        require(_exemptedAddress != address(0), "Invalid address");
        require(ballots[_ballotId].exemptedVoters[_exemptedAddress] != _exempt, "No change");
        ballots[_ballotId].exemptedVoters[_exemptedAddress] = _exempt;
        emit ChangedBallotExemptedVotersList(_ballotId, _exemptedAddress, _exempt);
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
     * @notice Get the voting power for an voter in terms of the token
     * @param _voter Address of the voter (Who will vote).
     * @param _ballotId Id of the ballot.
     */
    function getVoteTokenCount(address _voter, uint256 _ballotId) public view returns(uint256) {
        _checkIndexOutOfBound(_ballotId);
        Ballot storage ballot = ballots[_ballotId];
        if (ballot.voteDetails[_voter].secretVote == bytes32(0) && 
            (getCurrentBallotStage(_ballotId) != Stage.REVEAL || getCurrentBallotStage(_ballotId) != Stage.RESOLVED) &&
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
     * @return uint256 remainingTime (Time left in the completion of voting)
     */
    function getBallotResults(uint256 _ballotId) external view returns(
        uint256[] memory choicesWeighting,
        uint256[] memory noOfChoicesInProposal,
        address[] memory voters,
        uint256 remainingTime
    )
    {
        if (_ballotId >= ballots.length 
            || getCurrentBallotStage(_ballotId) == Stage.COMMIT
            || getCurrentBallotStage(_ballotId) == Stage.PREP
            || !ballots[_ballotId].isActive
        )
            return (choicesWeighting, noOfChoicesInProposal, voters, remainingTime);
        else {
            address[] memory allowedVoters = getAllowedVotersByBallot(_ballotId);
            Ballot storage ballot = ballots[_ballotId];
            remainingTime = ((
                uint256(ballot.startTime)
                .add(uint256(ballot.commitDuration)))
                .add(uint256(ballot.revealDuration))
                );
            if (remainingTime > now)
                remainingTime = remainingTime - now;
            else 
                remainingTime = 0;
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
                uint256 _noOfChoice = ballot.proposals[i].noOfChoices;
                _noOfChoice = _noOfChoice == 0 ? 3 : _noOfChoice;
                count = count.add(_noOfChoice);
            }
            choicesWeighting = new uint256[](count);
            noOfChoicesInProposal = new uint256[](ballot.totalProposals);
            count = 0;
            for (i = 0; i < ballot.totalProposals; i++) {
                uint256 _noOfChoices = ballot.proposals[i].noOfChoices;
                _noOfChoices = _noOfChoices == 0 ? 3 : _noOfChoices;
                noOfChoicesInProposal[i] = _noOfChoices;
                uint256 nextProposalChoiceLen = count + _noOfChoices;
                for (j = 0; j < ballot.totalVoters; j++) {
                    uint256[] storage choiceWeight = ballot.voteDetails[voters[j]].voteOptions[i];
                    uint256 l = 0;
                    for (k = count; k < nextProposalChoiceLen; k++) {
                        choicesWeighting[count] = choicesWeighting[count].add(choiceWeight[l]);
                        count++;
                        l++;
                    }
                    count = 0;
                }
                count = nextProposalChoiceLen;
            }
        }
    }

    /**
     * @notice Get the details of the ballot
     * @param _ballotId The index of the target ballot
     * @return uint256 totalSupplyAtCheckpoint
     * @return uint256 checkpointId
     * @return uint256 startTime
     * @return uint256 commitDuration
     * @return uint256 revealDuration
     * @return uint256 totalProposals
     * @return uint256 totalVoters
     * @return bytes32 proposalDetails
     * @return uint256 proposalChoicesCount
     * @return bool isActive
     */
    function getBallotDetails(uint256 _ballotId) external view returns(
        uint256 totalSupplyAtCheckpoint,
        uint256 checkpointId,
        uint256 startTime,
        uint256 commitDuration,
        uint256 revealDuration,
        uint256 totalProposals,
        uint256 totalVoters,
        bytes32[] memory proposalDetails,
        uint256[] memory proposalChoicesCount,
        bool isActive
    ) {
        Ballot storage ballot = ballots[_ballotId];
        proposalDetails = new bytes32[](ballot.totalProposals);
        proposalChoicesCount = new uint256[](ballot.totalProposals);
        for (uint256 i = 0; i < ballot.totalProposals; i++) { 
            proposalDetails[i] = ballot.proposals[i].details;
            proposalChoicesCount[i] = ballot.proposals[i].noOfChoices; // if noOfChoices == 0 then it means the type of ballot is NAY/YAY
        }
        return (
            securityToken.totalSupplyAt(ballot.checkpointId),
            ballot.checkpointId,
            ballot.startTime,
            ballot.commitDuration,
            ballot.revealDuration,
            ballot.totalProposals,
            ballot.totalVoters,
            proposalDetails,
            proposalChoicesCount,
            ballot.isActive
        );
    }

    /**
     * @notice Use to get the ballots Id which are in COMMIT & REVEAL phase
     * @return uint256 commitBallotList Array of the ballot ids which are in the commit stage.
     * @return uint256 revealBallotList Array of the ballot ids which are in the reveal stage.
     */
    function getCommitAndRevealBallots() external view returns(uint256[] memory commitBallotList, uint256[] memory revealBallotList) {
        uint256 len = getBallotsArrayLength();
        uint256 commitCount = 0;
        uint256 revealCount = 0;
        uint256 i;
        for (i = 0; i < len; i++) {
            if (getCurrentBallotStage(i) == Stage.COMMIT)
                commitCount++;
            else if (getCurrentBallotStage(i) == Stage.REVEAL)
                revealCount++;
        }
        commitBallotList = new uint256[](commitCount);
        revealBallotList = new uint256[](revealCount);
        (commitCount, revealCount) = (0, 0);
        for (i = 0; i < len; i++) {
            if (getCurrentBallotStage(i) == Stage.COMMIT) {
                commitBallotList[commitCount] = i;
                commitCount++;
            }
            else if (getCurrentBallotStage(i) == Stage.REVEAL) {
                revealBallotList[revealCount] = i;
                revealCount++;
            }
        }
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
        bool allowed = (ballots[_ballotId].exemptedVoters[_voter] || (defaultExemptIndex[_voter] != 0));
        return !allowed;
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

    ////// Internal functions //////

    function _getStartTime(uint256 _startTime) internal view returns(uint256 startTime) {
        startTime = _startTime == 0 ? now : _startTime;
    }

    function _isGreaterThanZero(uint256 _commitDuration, uint256 _revealDuration) internal pure {
        require(_commitDuration > 0 && _revealDuration > 0, "Invalid duration");
    }

    function _isEmptyTitle(string memory _title) internal pure {
        require(keccak256(abi.encodePacked(_title)) != keccak256(abi.encodePacked("")), "Empty title");
    }

    function _isValidLength(uint256 _length1, uint256 _length2) internal pure {
        require(_length1 == _length2, "Invalid length");
    }

    function _checkIndexOutOfBound(uint256 _ballotId) internal view {
        require(ballots.length > _ballotId, "Index out of bound");
    }

    function _checkValidStage(uint256 _ballotId, Stage _stage) internal view {
        require(getCurrentBallotStage(_ballotId) == _stage, "Not in a valid stage");
    }

}