pragma solidity ^0.4.21;


contract ISTProxy {

    function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
        public returns (address);
}
