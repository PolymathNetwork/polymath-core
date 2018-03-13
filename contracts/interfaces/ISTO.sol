pragma solidity ^0.4.18;

import './IModule.sol';

contract ISTO is IModule {

    function getRaiseEther() public returns (uint256);

    function getRaisePOLY() public returns (uint256);

    function getNumberInvestors() public returns (uint256);

    //More stuff here

}
