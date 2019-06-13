pragma solidity 0.5.8;

/**
 * @title Storage layout for the ISTO contract
 */
contract ISTOStorage {

    mapping (uint8 => bool) public fundRaiseTypes;
    mapping (uint8 => uint256) public fundsRaised;

    // Start time of the STO
    uint256 public startTime;
    // End time of the STO
    uint256 public endTime;
    // Time STO was paused
    uint256 public pausedTime;
    // Number of individual investors
    uint256 public investorCount;
    // Address where ETH & POLY funds are delivered
    address public wallet;
     // Final amount of tokens sold
    uint256 public totalTokensSold;

}
