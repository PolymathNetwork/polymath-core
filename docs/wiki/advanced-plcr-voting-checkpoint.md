# Advanced PLCR Voting Checkpoint

|  |  |
| :--- | :--- |
| **Introduced in** | 3.1.0 |
| **Contract name** | AdvancedPLCRVotingCheckpoint.sol |
| **Module Type** | Checkpoint Module |
| **Compatible Protocol Version** | ^3.0.0 |

## How it works

This module is useful for the corporate voting where the issuer or board members can propose an agenda to get the opinion of the investors over it. Issuer/ADMIN personnel can create a ballot which consists a proposal title and choices on which investors/participant can vote on it, once the voting period ends result can be calculated on the basis of the vote given by the participants. This module uses a partial confidentiality vote mechanism where participant votes will be encrypted until the voting period ends and reveal phase begins, this mechanism will avoid the vote biasness and lead the fair voting for a given proposal.

This module supports two types of ballots namely -  
**Statutory** - This type of ballot will only consist of a single proposal.  
**Cumulative** - This type of ballot will consist of one or more proposals.

There are two types of the proposal supported by the module namely -

* Nay/Yay type proposal.
* Multiple choices proposal.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

This module is initialized with no parameters. That means during the creation of this contract there’s no need to call any type of `configure()` function.

### Using the module

_Layout for voting lifecycle_

**UseCase**: Issuer wants to create a cumulative ballot with 3 proposals.  
We have 4 ways to create a cumulative ballot -

1. createCustomCumulativeBallotWithExemption\(\)     
2. createCustomCumulativeBallot\(\)       
3. createCumulativeBallot\(\)  
4. createCumulativeBallotWithExemption\(\)   

An issuer can choose anyone as per the need, for simplicity, we are going to use `createCumulativeBallot()` function with parameter values as follows -

```text
      _name -> Name of the ballot i.e DemoBallot     
      _startTime -> At what time it will start i.e 0 (now)       
      _commitDuration -> Duration for which commit phase will be live i.e 259200 (3 days)     
      _revealDuartion -> Duration for which reveal phase will be live i.e 345600 (4 days)       
      _proposalTitles -> List of proposal titles i.e title1,title2,title3            
      _details -> Off chain details related to proposals i.e [0x123,0x42,0x455631]       
      _choices -> Choices of proposal i.e A1,B1,C1,D1,A3,B3,C3        
      _noOfChoices -> Array of no. of choices i.e[4,0,3]
```

The above function will create a ballot and all investors on the current checkpoint will only be eligible participants \(If global exemption list has no addresses\) to vote for the created ballot. As `_startTime` is `now` then commit phase will be started until `_startTime + _commitDuration`.

Let’s say we have 3 voters Alice, Bob & Charlie on the current checkpoint and all three are eligible to vote.

### Alice call `commitVote()`

```text
       _ballotId = 1 (As above ballot is the only ballot in the ballots array).        
       _secretVote = ****** (A secret hash) Created something like this
```

If Alice balance at the current checkpoint is 100 then Alice vote power will be `100 * no of proposals in a ballot` i.e 300 \(100 \* 3\). `web3.soliditySha3(100,0,0,0,150,0,0,0,50,0,salt)` where salt will be a random string used to increase the anonymity. And the sum of weight should be equal to 300.

Similarly, Bob will call `commitVote()` while Charlie forgot to commit its vote. Commit duration gets passed and reveal phase get started automatically.

### Alice call `revealVote()`

```text
      _ballotId = 1
      _choices = [100,0,0,0,150,0,0,0,50,0]
      _salt = salt
```

If everything validates transaction will pass through and Alice vote will be counted in the result calculation.

### Charlie call `revealVote()`

```text
      _ballotId = 1
      _choices = [0,70,30,0,0,0,0,200,0,0]
      _salt = some salt
```

This transaction will fail as charlie did not commit his vote in the commit phase. After the end of the reveal phase, anyone can call `getBallotResults()` to get the result of the voting.

## Creation of Ballot

A ballot can be created with 4 ways and this module is supporting 2 types of ballots i.e statutory & cumulative. It means issuer/Admin personnel has total 8 functions to create the ballot as per the desired functionality.

### Create a statutory ballot

A simple way of creating a ballot which will take current checkpoint Id of the security token automatically and allowed single proposal in a given ballot.

```text
     /**
      * @notice Use to create the ballot
      * @param _name Name of the ballot (Should be unique)
      * @param _startTime startTime of the ballot
      * @param _commitDuration Unix time period till the voters commit their vote
      * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
      * @param _proposalTitle Title of proposal
      * @param _details Off-chain details related to the proposal
      * @param _choices Choices of proposals
      * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
```

**Restrictions applied** -

* Ballots array length should be less than to the MAX\_LIMIT of ballots allowed.
* The name should not be empty.
* Proposal title should not be empty.
* Commit and reveal duration should be greater than 0.
* Sufficient usage fee is allowed by the ST to successfully create a ballot.   

**Note -** If `_noOfChoices` is 0 then smart contract will assume that proposal is Nay/yay type proposal and it will have 3 choices.

### Create a custom statutory ballot

The only difference between `createStatutoryBallot()` and this function is that Issuer has to provide the checkpoint Id \(should be less than or equal to current checkpoint Id\) at which ballot will be created beside this it works similar to `createStatutoryBallot()`.

```text
     /**
      * @notice Use to create the ballot           
      * @param _name Name of the ballot (Should be unique) 
      * @param _startTime startTime of the ballot 
      * @param _commitDuration Unix time period till the voters commit their vote
      * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
      * @param _proposalTitle Title of proposal
      * @param _details Off-chain details related to the proposal
      * @param _choices Choices of proposals
      * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY/ABSTAIN ballot type is chosen).
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
```

**Note** - Similar restrictions applied as above

### Create statutory ballot with exemption

Additional list of exemption addresses will be passed in this function rest it works same as createStatutoryBallot\(\).

```text
/**
 * @notice Use to create the ballot 
 * @param _name Name of the ballot (Should be unique)
 * @param _startTime startTime of the ballot
 * @param _commitDuration Unix time period till the voters commit their vote
 * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
 * @param _proposalTitle Title of proposal
 * @param _details Off-chain details related to the proposal
 * @param _choices Choices of proposals (Comma separated values)
 * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
   external
```

**Note -** Similar restrictions applied as above.

### Create custom statutory ballot with exemption

Additional list of exemption addresses will be passed in this function rest it works same as createCustomStatutoryBallot\(\).

```text
   /**
    * @notice Use to create the ballot
    * @param _name Name of the ballot (Should be unique)
    * @param _startTime startTime of the ballot
    * @param _commitDuration Unix time period till the voters commit their vote
    * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
    * @param _proposalTitle Title of proposal
    * @param _details Off-chain details related to the proposal
    * @param _choices Choices of proposals (Comma separated values)
    * @param _noOfChoices No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
   external
```

**Note** - Similar restrictions applied as above.

### Create a cumulative ballot

This function will allow creating multiple proposal in a ballot.

```text
  /**
   * @notice Use to create the ballot
   * @param _name Name of the ballot (Should be unique)
   * @param _startTime startTime of the ballot
   * @param _commitDuration Unix time period till the voters commit their vote
   * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
   * @param _proposalTitles Title of proposal (In a comma separated string)
   * @param _details Off-chain details related to the proposal
   * @param _choices Choices of proposals (In a comma separated string)
   * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
```

**Restrictions applied -**

* Ballots array length should be less than to the `MAX_LIMIT` of ballots allowed.
* Name should not be empty.
* Proposal title should not be empty.
* Commit and reveal duration should be greater than 0.
* Sufficient usage fee is allowed by the ST to successfully create a ballot.
* Length of `_details` and `_noOfChoices` should be equal.

**Note**- We are not storing the `_choices`, `_proposalTitles` in the contract storage, These variables will only be emitted in an event for off-chain use.

### Create Custom cumulative ballot

The only difference between `createCumulativeBallot()` and this function is Issuer has to provide the checkpoint Id \(should be less than or equal to current checkpoint Id\) at which ballot will be created beside this it works similar to `createCumulativeBallot()`.

```text
   /**
    * @notice Use to create the ballot
    * @param _name Name of the ballot (Should be unique)
    * @param _startTime startTime of the ballot
    * @param _commitDuration Unix time period till the voters commit their vote
    * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
    * @param _proposalTitles Title of proposals (In a comma separated string)
    * @param _details Off-chain details related to the proposal
    * @param _choices Choices of proposals (In a comma separated string)
    * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
```

**Note** - Restrictions are same as above.

### Create cumulative ballot with exemption

Additional list of exemption addresses will be passed in this function rest it works the same as `createCumulativeBallot()`.

```text
   /**
    * @notice Use to create the ballot
    * @param _name Name of the ballot (Should be unique)
    * @param _startTime startTime of the ballot
    * @param _commitDuration Unix time period till the voters commit their vote
    * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
    * @param _proposalTitles Title of proposal (Comma separated values)
    * @param _details Off-chain details related to the proposal
    * @param _choices Choices of proposals (Comma separated values)
    * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
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
      external
```

**Note** - Similar restrictions applied as above

### Create custom cumulative ballot with exemption

Additional list of exemption addresses will be passed in this function rest it works the same as `createCustomCumulativeBallot()`.

```text
  /**
    * @notice Use to create the ballot
    * @param _name Name of the ballot (Should be unique)
    * @param _startTime startTime of the ballot
    * @param _commitDuration Unix time period till the voters commit their vote
    * @param _revealDuration Unix time period till the voters reveal their vote starts when commit duration ends
    * @param _proposalTitles Title of proposal (Comma separated values)
    * @param _details Off-chain details related to the proposal
    * @param _choices Choices of proposals (Comma separated values)
    * @param _noOfChoices Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen).
    * @param _checkpointId Valid checkpoint Id
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
      uint256 _checkpointId,
      address[] calldata _exemptedAddresses
     )
      external
```

**Note -** Similar restrictions applied as above

### Commit vote

`commitVote()` function is used to commit the vote of the investor.

```text
  /**
   * @notice Used to commit the vote 
   * @param _ballotId Given ballot Id
   * @param _secretVote It is secret hash value (hashed offchain)
   */
  function commitVote(uint256 _ballotId, bytes32 _secretVote) external
```

**Restrictions applied**

* Given ballot Id should be less than ballots array length.
* `_secretVote` should not be 0x0.
* Ballot stage should be commit stage.
* msg.sender should be allowed voter.
* msg.sender should not vote already.
* Ballot should not be cancelled ballot.
* msg.sender balance at the ballot checkpoint should be greater than 0.

### Reveal Vote

`revealVote()` function is used to reveal the vote of an investor.

```text
  /**
   * @notice Used to reveal the vote
   * @param _ballotId Given ballot Id
   * @param _choices Choices opt by the voter. 
   * @dev Its length should be equal to the aggregation of ∑(proposalᵢ * noOfChoicesᵢ) where i = 0 ...totalProposal-1
   * @param _salt used salt for hashing (unique for each user)
   */
  function revealVote(uint256 _ballotId, uint256[] calldata _choices, uint256 _salt) external
```

**Restrictions applied**

* Given ballot Id should be less than ballots array length.
* Ballot stage should be reveal stage.
* Ballot should not be cancelled ballot.
* msg.sender should participate in the commit phase.
* `_choices` length should be equal to total choice count of all proposals of a ballot.
* Stored secret vote should be equal to the dynamically created secret vote by the input values.
* Total choices weight should be less than or equal to the vote power of the voter.

### Cancel Ballot

This function is used to turn off the ballot.

```text
   /**
    * @notice Allows the token issuer to scrapped down a ballot
    * @param _ballotId The index of the target ballot
    */
  function cancelBallot(uint256 _ballotId) external withPerm(ADMIN)
```

**Restrictions applied**

* Given ballot Id should be less than ballots array length.
* Should not be already ended ballot.
* The ballot should not be already cancelled.

## Change Exemptions List

In this module, the exemption list exists on the two-level i.e local and global. Local-level applies to a given ballot while global level exemption list applies to all ballots.

### Change ballot exemption list

This function is used to change the ballot exemption list on the local level.

```text
  /**
   * Change the given ballot exempted list
   * @param _ballotId Given ballot Id
   * @param _exemptedAddress Address of the voter
   * @param _exempt Whether it is exempted or not
   */
  function changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) external withPerm(ADMIN)
```

**Restrictions applied**

* Ballot stage should be PREP.
* `_exemptedAddress` should not be 0x0.
* `_exempt` value should not be same as already stored value.

### Change ballot exemption list multi

This function is the batch version of the `changeBallotExemptionVotersList()`

```text
  /**
   * Change the given ballot exempted list (Multi)
   * @param _ballotId Given ballot Id
   * @param _exemptedAddresses Address of the voters
   * @param _exempts Whether it is exempted or not
   */
   function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] calldata _exemptedAddresses, bool[] calldata _exempts) external withPerm(ADMIN)
```

**Note** - It has similar restrictions as above.

### Change default exemption voters list

This function will work on the global level

```text
 /**
  * Change the global exempted voters list
  * @param _voter Address of the voter
  * @param _exempt Whether it is exempted or not
  */
 function changeDefaultExemptedVotersList(address _voter, bool _exempt) public
```

**Restrictions applied**

* Any ballot should not be in the running stage \(or not in commit & reveal phase\).
* `_voter` should not be empty.

### Change default exemption voters list multi

Batch version of the `changeDefaultExemptedVotersList()`.

```text
  /**
   * Change the global exempted voters list
   * @param _voters Address of the voter
   * @param _exempts Whether it is exempted or not
   */
  function changeDefaultExemptedVotersListMulti(address[] memory _voters, bool[] memory _exempts) public
```

**Note** - It has similar restrictions as above.

## Getters

### Get checkpoint data

Retrieves the list of investors and their balances.

```text
  /**
   * @notice Retrieves list of investors, their balances
   * @param _checkpointId Checkpoint Id to query for
   * @return address[] list of investors
   * @return uint256[] investor balances
   */
   function getCheckpointData(uint256 _checkpointId) external view returns (address[] memory investors, uint256[] memory balances)
```

### Get pending investors to vote

Retrieves the list of investors who remain to vote for a given ballot id.

```text
  /**
   * @notice Retrieves the list of investors who remain to vote
   * @param _ballotId Id of the ballot
   * @return address[] list of investors who are remain to vote
   */
  function getPendingInvestorToVote(uint256 _ballotId) external view returns(address[] memory pendingInvestors)
```

### Get committed vote count for a given ballot id

Returns the committed vote count for a given ballot id.

```text
 /**
  * @notice It will return the no. of the voters who take part in the commit phase of the voting
  * @param _ballotId Targeted ballot index
  * @return committedVoteCount no. of the voters who take part in the commit phase of the voting 
  */
 function getCommittedVoteCount(uint256 _ballotId) public view returns(uint256 committedVoteCount)
```

### Get allowed voters of a given ballot

It returns allowed voters for a given ballot

```text
 /**
  * @notice Get eligible voters list for the given ballot
  * @dev should be called off-chain
  * @param  _ballotId The index of the target ballot
  * @return voters Addresses of the voters
  */
 function getAllowedVotersByBallot(uint256 _ballotId) public view returns (address[] memory voters)
```

### Get all ballots data

Returns all ballot data \(Should be called offchain\).

```text
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
```

### Get exempted voters as per the given ballot id -

```text
 /**
  * @notice Return the list of the exempted voters list for a given ballotId
  * @param _ballotId BallotId for which exempted voters are queried.
  * @return exemptedVoters List of the exempted voters.
  */
 function getExemptedVotersByBallot(uint256 _ballotId) external view returns(address[] memory exemptedVoters)
```

### Get the list of pending ballots

Provide the list of the ballot in which given address is eligible for a vote

```text
 /**
  * @notice Provide the list of the ballot in which given address is eligible for a vote
  * @param _voter Ethereum address of the voter
  * @return ballots list of indexes of ballots on which given voter has to commit
  * @return ballots list of indexes of ballots on which given voter has to reveal
  */
 function pendingBallots(address _voter) external view returns (uint256[] memory commitBallots, uint256[] memory revealBallots)
```

### Get the ballot stage

It returns the current ballot stage of given ballot id.

```text
 /**
  * @notice Used to get the current stage of the ballot
  * @param _ballotId Given ballot Id
  */
 function getCurrentBallotStage(uint256 _ballotId) public view returns (Stage)
```

### Get vote token count

Get the voting power for a voter in terms of the token.

```text
 /**
  * @notice Get the voting power for a voter in terms of the token
  * @param _voter Address of the voter (Who will vote).
  * @param _ballotId Id of the ballot.
  */
  function getVoteTokenCount(address _voter, uint256 _ballotId) public view returns(uint256)
```

### Get ballot results

It will return the result of a given ballotId.

```text
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
```

### Get ballot details

It returns the details of the ballot.

```text
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
 * @return uint256 committedVoteCount
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
    uint256 committedVoteCount,
    bool isCancelled,
    Stage currentStage,
    bytes32[] memory proposalDetails,
    uint256[] memory proposalChoicesCounts
   )
```

### Get the ballots array length

Returns the length of ballot array.

```text
 /**
  * @notice Get the length of the ballots array
  * @return uint256 Length of the ballots array
  */
 function getBallotsArrayLength() public view returns(uint256 length)
```

Function to check whether the voter is allowed or not

```text
 /**
  * Use to check whether the voter is allowed to vote or not
  * @param _ballotId The index of the target ballot
  * @param _voter Address of the voter
  * @return bool
  */
 function isVoterAllowed(uint256 _ballotId, address _voter) public view returns(bool)
```

