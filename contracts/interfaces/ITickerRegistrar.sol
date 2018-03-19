pragma solidity ^0.4.18;

interface ITickerRegistrar {
     /**
      * @dev Check the validity of the symbol
      * @param _symbol token symbol
      * @param _owner address of the owner
      */
     function checkValidity(string _symbol, address _owner) public;

     /**
      * @dev Returns the owner and timestamp for a given symbol
      * @param _symbol symbol
      */
     function getDetails(string _symbol) public view returns (address, uint256, string, bool);

    
}