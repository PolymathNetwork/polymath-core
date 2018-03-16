pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
contract IModule {
    function getInitFunction() public returns (bytes4);
    address public factory;
}
