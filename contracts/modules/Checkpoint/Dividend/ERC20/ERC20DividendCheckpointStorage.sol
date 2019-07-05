pragma solidity 0.5.8;

/**
 * @title It holds the storage variables related to ERC20DividendCheckpoint module
 */
contract ERC20DividendCheckpointStorage {
    // Mapping to token address for each dividend
    mapping(uint256 => address) public dividendTokens;

}
