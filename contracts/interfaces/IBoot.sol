pragma solidity ^0.4.24;

interface IBoot {

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() external pure returns(bytes4);
}