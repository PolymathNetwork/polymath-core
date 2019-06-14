pragma solidity 0.5.8;

/**
 * @title Contract used to store layout for the DummySTO storage
 */
contract DummySTOStorage {

    uint256 public investorCount;

    uint256 public cap;
    string public someString;

    mapping (address => uint256) public investors;

}
