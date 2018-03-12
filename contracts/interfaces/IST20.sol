pragma solidity ^0.4.18;

contract IST20 {

    //Swarm hash of security details
    bytes32 public securityDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to) public returns (bool success);

}
