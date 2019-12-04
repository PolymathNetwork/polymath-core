# Voting-Checkpoint-Modules

## VotingCheckpoint \(Transparent & PLCR voting module\)

* **Introduced in:** 3.0.0
* **Contract name:** VotingCheckpoint
* **Type:** Voting module

### How it works

It is a voting module that used to create governance on a given agenda by the board of directors of the securityToken. It will allow investors to vote to elect one of the proposals of the agenda.

### VotingCheckpoint

It is the common base class that is inherited by the Voting modules \(aka WeightedVoteCheckpoint & PLCRVoteCheckpoint\).

### Key functionalities \(as defined in the Smart Contract\)

#### Initialization

No initialization needed for this module

#### Change default exempted voters list

This function is used to add/remove the address from the default exemption list. Default exemption list is the list of addresses that are not allowed to take participation in all given ballots of the voting module.

```text
    /**
     * Change the global exempted voters list
     * @param _voter Address of the voter
     * @param _change Whether it is exempted or not
     */
    function changeDefaultExemptedVotersList(address _voter, bool _change) external withPerm(ADMIN)
```

#### Change default exempted voters list \(Multi\)

It will allow adding multiple addresses to remove/add in once.

```text
    /**
     * Change the global exempted voters list
     * @param _voters Address of the voter
     * @param _changes Whether it is exempted or not
     */
    function changeDefaultExemptedVotersListMulti(address[] calldata _voters, bool[] calldata _changes) external withPerm(ADMIN)
```

#### Get default exemption voter list

```text
    /**
     * Return the default exemption list
     */
    function getDefaultExemptionVotersList() external view returns(address[] memory)
```

## WeightedVoteCheckpoint

* **Introduced in:** 3.0.0
* **Contract name:** WeightedVoteCheckpoint
* **Type:** Voting module

### How it works

This module allows investors to vote corresponds to there token balance. A proposal will only win when it has total weight more than the given quorum of the ballot. Every investor can take participate in the voting besides who have zero token balance at a given checkpoint or present in the exemption list. Each ballot is created with a snapshot of balances of the token holders so it will allow investors to transact their tokens freely as well as it will not spoil the voting results with the double voting effect.

### Key functionalities \(as defined in the Smart Contract\)

#### Initialization

No initialization needed for this module

#### Create Ballot

This function allows issuer or authorized a delegate to create a new ballot by giving no. of proposals in a ballot, how long the voting will run & what will be the desired quorum to chose a winning proposal.

**Required Checks:-**

1. `_duration` should be greater than zero.
2. `_noOfProposals` should be greater than 1. It means 0th proposal id is not entertained as the proposal to vote. 
3. `_proposedQuorum` should be less than `100 * 10 ** 16` \(100 % of the totalSupply\) and should be more than 0.

```text
    /**
     * @notice Allows the token issuer to create a ballot
     * @param _duration The duration of the voting period in seconds
     * @param _noOfProposals Number of proposals
     * @param _proposedQuorum Minimum Quorum  percentage required to make a proposal won
     */
    function createBallot(uint256 _duration, uint256 _noOfProposals, uint256 _proposedQuorum) external withPerm(ADMIN)
```

#### Create a custom ballot

This function also allows issuer or authorized a delegate to create a ballot but with custom settings. An issuer can provide the desired start time, end time & the valid checkpoint as well.

**Required Checks:-**

1. `_duration` should be greater than zero.
2. `_noOfProposals` should be greater than 1. It means 0th proposal id is not entertained as the proposal to vote. 
3. `_proposedQuorum` should be less than `100 * 10 ** 16` \(100 % of the totalSupply\) and should be more than 0.
4. `_startTime` should be greater than or equal to now.
5. `_endTime` should be greater than `_startTime`.
6. valid checkpoint Id.

```text
    /**
     * @notice Allows the token issuer to create a ballot with custom settings
     * @param _checkpointId Index of the checkpoint to use for token balances
     * @param _proposedQuorum Minimum Quorum  percentage required to make a proposal won
     * @param _startTime Start time of the voting period in Unix Epoch time
     * @param _endTime End time of the voting period in Unix Epoch time
     * @param _noOfProposals Number of proposals
     */
    function createCustomBallot(uint256 _checkpointId, uint256 _proposedQuorum, uint256 _startTime, uint256 _endTime, uint256 _noOfProposals) external withPerm(ADMIN)
```

**Cast Vote**

This function allows the investors to vote for a given ballotId by passing chosen proposalId of the ballot.

**Required Checks:-**

1. Should be a valid ballotId. It means given ballotId should be less than ballot array length.
2. Given ballot should be in the active state and current time respects the bound of start and end time of the ballot.
3. `msg.sender` should have a balance greater than 0 at the ballotId checkpoint.
4. `msg.sender` should not be in the default or in the ballot exemption list.
5. `msg.sender` should not already vote for the given ballotId.
6. Should be a valid proposal id.

```text
    /**
     * @notice Allows a token holder to cast their vote on a specific ballot
     * @param _ballotId The index of the target ballot
     * @param _proposalId Id of the proposal which investor want to vote for proposal
     */
    function castVote(uint256 _ballotId, uint256 _proposalId) external
```

#### Add/Remove address from the ballot exemption list

Similar to the default exemption list ballot has its own exemption list which will be used to restrict the addresses to vote for a particular ballot.

```text
    /**
     * Change the given ballot exempted list
     * @param _ballotId Given ballot Id
     * @param _voter Address of the voter
     * @param _change Whether it is exempted or not
     */
    function changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _change) external withPerm(ADMIN)


/**
     * Change the given ballot exempted list (Multi)
     * @param _ballotId Given ballot Id
     * @param _voters Address of the voter
     * @param _changes Whether it is exempted or not
     */
    function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _voters, bool[] calldata _changes) external withPerm(ADMIN)
```

#### Change ballot status

It is used to switch on/off the given ballot. Can be called by the issuer or the authorised delegate.

**Required checks:-**

1. Not allowed to call this function when ballot is expired.
2. Only changeable state is allowed i.e `active = true` then `_isActive` should be `false` or vice versa.

```text
    /**
     * @notice Allows the token issuer to set the active stats of a ballot
     * @param _ballotId The index of the target ballot
     * @param _isActive The bool value of the active stats of the ballot
     * @return bool success
     */
    function changeBallotStatus(uint256 _ballotId, bool _isActive) external withPerm(ADMIN)
```

### Getters

#### Get ballot results

This function is used to get the conclusion of the given ballotId after or during the ballot.

```text
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
    )
```

#### Get selected proposal

It returns the selected proposal by the given voter for a given ballotId.

```text
    /**
     * @notice Get the voted proposal
     * @param _ballotId Id of the ballot
     * @param _voter Address of the voter
     */
    function getSelectedProposal(uint256 _ballotId, address _voter) external view returns(uint256 proposalId)
```

#### Get the ballot details

It is used to get the ballot details.

```text
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
    function getBallotDetails(uint256 _ballotId) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

#### Check whether is voter allowed or not

To check whether the voter is allowed to vote or not

```text
    /**
     * Use to check whether the voter is allowed to vote or not
     * @param _ballotId The index of the target ballot
     * @param _voter Address of the voter
     * @return bool 
     */
    function isVoterAllowed(uint256 _ballotId, address _voter) public view returns(bool)
```

## PLCRVotingCheckpoint

* **Introduced in:** 3.0.0
* **Contract name:** PLCRVotingCheckpoint
* **Type:** Voting module

### How it works

Addition to the summarization of `WeightedVoteCheckpoint`. It kept the vote of investor hidden until the `commit` stage is over. This will lead to unaffected results of the voting.

### Key functionalities \(as defined in the Smart Contract\)

#### Initialization

No initialization needed for this module.

#### Create a ballot

This function allows issuer or authorized a delegate to create a new ballot by giving no. of proposals in a ballot, how long the commit & reveal stage will run & what will be the desired quorum to chose a winning proposal.

**Required Checks:-**

1. `_commitDuration` &  `_revealDuration` should be greater than zero.
2. `_noOfProposals` should be greater than 1. It means 0th proposal id is not entertained as the proposal to vote. 
3. `_proposedQuorum` should be less than `100 * 10 ** 16` \(100 % of the totalSupply\) and should be more than 0.

```text
/**
 * @notice Use to create the ballot
 * @param _commitDuration Unix time period till the voters commit there vote
 * @param _revealDuration Unix time period till the voters reveal there vote starts when commit duration ends
 * @param _noOfProposals Total number of proposal used in the ballot. In general it is 2 (For & Against)
 * @param _proposedQuorum Minimum number of weight vote requires to win a election.
 */
function createBallot(
    uint256 _commitDuration,
    uint256 _revealDuration,
    uint256 _noOfProposals,
    uint256 _proposedQuorum
)   
    external
    withPerm(ADMIN)
```

#### Create a custom ballot

This function also allows issuer or authorized a delegate to create a ballot but with custom settings. An issuer can provide the desired start time & the valid checkpoint as well.

**Required Checks:-**

1. `_commitDuration` &  `_revealDuration` should be greater than zero.
2. `_noOfProposals` should be greater than 1. It means 0th proposal id is not entertained as the proposal to vote. 
3. `_proposedQuorum` should be less than `100 * 10 ** 16` \(100 % of the totalSupply\) and should be more than 0.
4. `_startTime` should be greater than or equal to `now`.
5. Should be a valid checkpointId.

```text
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
```

#### Commit Vote

Used to vote secretly by an investor. The investor will pass the hashed version of its vote with the help of some unique salt.

**Required checks:-**

1. Valid ballot Id. Not more than or equal to the length of the ballots array.
2. `msg.sender` should have a balance greater than 0 at the ballotId checkpoint.
3. `msg.sender` should not be in the default or in the ballot exemption list.
4. `msg.sender` should not already commit the vote for the given ballotId.
5. Given ballot should be in the active state and current time respects the bound of the `commit` stage of the ballot.
6. `_secretVote` should not be zero.

```text
/**
 * @notice Used to commit the vote
 * @param _ballotId Given ballot Id
 * @param _secretVote It is secret hash value (hashed offchain)
 */
function commitVote(uint256 _ballotId, bytes32 _secretVote) external
```

#### Reveal Vote

This function is used to reveal the vote. If the voter doesn’t call this function after the commit stage ends then voter votes don’t count in the tally.

**Required checks:-**

1. Given ballot should be in the active state and current time respects the bound of the `commit` stage of the ballot.
2. `msg.sender` did take participate during the commit stage.
3. Valid proposal & ballot id.
4. `msg.sender` should pass the correct salt and proposal id that will give the same secret hash that was passed during the commit stage.

```text
/**
 * @notice Used to reveal the vote
 * @param _ballotId Given ballot Id
 * @param _choiceOfProposal Proposal chossed by the voter. It varies from (0 to totalProposals - 1)
 * @param _salt used salt for hashing (unique for each user)
 */
function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external
```

#### Add/Remove address from the ballot exemption list

Similar to the default exemption list ballot has its own exemption list which will be used to restrict the addresses to vote for a particular ballot.

```text
    /**
     * Change the given ballot exempted list
     * @param _ballotId Given ballot Id
     * @param _voter Address of the voter
     * @param _change Whether it is exempted or not
     */
    function changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _change) external withPerm(ADMIN)


    /**
     * Change the given ballot exempted list (Multi)
     * @param _ballotId Given ballot Id
     * @param _voters Address of the voter
     * @param _changes Whether it is exempted or not
     */
    function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _voters, bool[] calldata _changes) external withPerm(ADMIN)
```

#### Change ballot status

It is used to switch on/off the given ballot. Can be called by the issuer or the authorized delegate.

**Required checks:-** 1. Not allowed to call this function when the ballot is expired. 2. Only changeable state is allowed i.e `active = true` then `_isActive` should be `false` or vice versa.

```text
/**
 * @notice Allows the token issuer to set the active stats of a ballot
 * @param _ballotId The index of the target ballot
 * @param _isActive The bool value of the active stats of the ballot
 * @return bool success
 */
function changeBallotStatus(uint256 _ballotId, bool _isActive) external withPerm(ADMIN)
```

### Getters

#### Get ballot results

This function is used to get the conclusion of the given ballotId after or during the ballot.

```text
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
    )
```

#### Get selected proposal

It returns the selected proposal by the given voter for a given ballotId.

```text
    /**
     * @notice Get the voted proposal
     * @param _ballotId Id of the ballot
     * @param _voter Address of the voter
     */
    function getSelectedProposal(uint256 _ballotId, address _voter) external view returns(uint256 proposalId)
```

#### Get the ballot details

It is used to get the ballot details.

```text
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
    function getBallotDetails(uint256 _ballotId) external view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

#### Get the commit & reveal duration of the ballot

Used to get the commit and reveal duration of the given ballot id.

```text
    /**
     * Return the commit relveal time duration of ballot
     * @param _ballotId Id of a ballot
     */
    function getBallotCommitRevealDuration(uint256 _ballotId) external view returns(uint256, uint256)
```

#### Get the ballot stage

Used to get the current stage of the ballot.

```text
    /**
     * @notice Used to get the current stage of the ballot
     * @param _ballotId Given ballot Id
     */
    function getCurrentBallotStage(uint256 _ballotId) public view returns (Stage)
```

Check whether is voter allowed or not

#### To check whether the voter is allowed to vote or not

```text
    /**
     * Use to check whether the voter is allowed to vote or not
     * @param _ballotId The index of the target ballot
     * @param _voter Address of the voter
     * @return bool 
     */
    function isVoterAllowed(uint256 _ballotId, address _voter) public view returns(bool)
```

#### Special considerations / notes

* All batch expected to fail because of out of gas error. They will allow 70 - 80 investors in a single batch \(approximately not tested\).
* Need to add the functionality where ballot exemption list trumps the default exemption list for better switching of investors within different ballots.

