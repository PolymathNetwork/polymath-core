pragma solidity 0.4.23;

import "../../interfaces/IModule.sol";

contract IStaking is IModule {

    function intiateStaking(uint256 _startDate, uint256 _endDate) public;

    function getHolderByModule(address _moduleAddress, address _holderAddress) public returns(uint256, bool, uint256);

    function provideAllowance() public returns(bool); 

    function updateStatus(address _holder) public returns(bool);

}