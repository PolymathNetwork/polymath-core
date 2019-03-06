pragma solidity ^0.4.24;

/**
 * @title Interface to be implemented by all STO modules
 */
interface ISTO {
    /**
     * @notice Returns the total no. of tokens sold
     */
    function getTokensSold() public view returns (uint256);
}
