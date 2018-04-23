pragma solidity ^0.4.23;

import "../../interfaces/IModule.sol";


contract ITransferManager is IModule {

    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns(bool);

}
