pragma solidity ^0.5.0;

interface IBoot {
    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() external pure returns(bytes4);

}