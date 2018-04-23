pragma solidity ^0.4.23;


contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}
