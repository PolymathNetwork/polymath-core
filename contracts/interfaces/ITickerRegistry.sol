pragma solidity ^0.4.23;


contract ITickerRegistry {
    /**
    * @dev Check the validity of the symbol
    * @param _symbol token symbol
    * @param _owner address of the owner
    * @param _tokenName Name of the token
    * @return bool
    */
    function checkValidity(string _symbol, address _owner, string _tokenName) public returns(bool);

    /**
    * @dev Returns the owner and timestamp for a given symbol
    * @param _symbol symbol
    */
    function getDetails(string _symbol) public view returns (address, uint256, string, bytes32, bool);


}
