pragma solidity ^0.4.18;

import '../../interfaces/IModule.sol';

contract ISTO is IModule {

    function getRaiseEther() public view returns (uint256);

    function getRaisePOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

}
