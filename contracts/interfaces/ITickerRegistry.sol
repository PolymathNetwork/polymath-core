pragma solidity ^0.4.24;

/**
 * @title Interface for the polymath ticker registry contract
 */
contract ITickerRegistry {
    /**
    * @notice Check the validity of the symbol
    * @param _symbol token symbol
    * @param _owner address of the owner
    * @param _tokenName Name of the token
    * @return bool
    */
    function checkValidity(string _symbol, address _owner, string _tokenName) public returns(bool);

    /**
    * @notice Returns the owner and timestamp for a given symbol
    * @param _symbol symbol
    */
    function getDetails(string _symbol) public view returns (address, uint256, string, bytes32, bool);

    /**
     * @notice Check the symbol is reserved or not
     * @param _symbol Symbol of the token
     * @return bool
     */
     function isReserved(string _symbol, address _owner, string _tokenName, bytes32 _swarmHash) public returns(bool);

}
