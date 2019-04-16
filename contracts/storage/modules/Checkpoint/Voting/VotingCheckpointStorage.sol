pragma solidity ^0.5.0;

contract VotingCheckpointStorage {

    mapping(address => uint256) defaultExemptIndex;
    address[] defaultExemptedVoters;
    
}