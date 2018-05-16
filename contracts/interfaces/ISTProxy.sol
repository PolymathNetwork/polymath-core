pragma solidity ^0.4.23;


contract ISTProxy {

    function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible)
        public returns (address);
}
