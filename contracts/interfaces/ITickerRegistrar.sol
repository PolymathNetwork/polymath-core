pragma solidity ^0.4.18;

interface ITickerRegistrar {

    function checkValidity(string _symbol, address _owner) public;
    
}