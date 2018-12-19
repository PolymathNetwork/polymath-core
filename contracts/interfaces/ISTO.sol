pragma solidity ^0.5.0;

/**
 * @title Interface to be implemented by all STO modules
 */
interface ISTO {
    /**
     * @notice Returns the total no. of tokens sold
     */
    function getTokensSold() external view returns(uint256);

}
