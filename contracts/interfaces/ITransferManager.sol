pragma solidity ^0.4.18;

import './IModule.sol';

contract ITransferManager is IModule {

    function verifyTransfer(address _to, address _from) external returns(bool);

}
