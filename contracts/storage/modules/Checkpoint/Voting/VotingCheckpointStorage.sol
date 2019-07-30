pragma solidity 0.5.8;

contract VotingCheckpointStorage {

    mapping(address => uint256) defaultExemptIndex;
    address[] defaultExemptedVoters;

}
