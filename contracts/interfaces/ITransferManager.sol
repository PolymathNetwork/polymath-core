pragma solidity ^0.4.18;

interface ITransferManager {

    function verifyTransfer(address _to, address _from) external returns(bool);

}
