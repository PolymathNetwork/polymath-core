pragma solidity ^0.4.24;

/**
 * @title Checkpoint module for issuing ERC20 dividends
 */
contract ERC20DividendCheckpointStorage {

    // Mapping to token address for each dividend
    mapping (uint256 => address) public dividendTokens;

}
