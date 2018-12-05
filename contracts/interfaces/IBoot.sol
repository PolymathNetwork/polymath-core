pragma solidity ^0.4.24;

interface IBoot {

    function getInitFunction() external pure returns (bytes4);
    
}