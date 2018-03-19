pragma solidity ^0.4.18;

contract IST20 {

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}
