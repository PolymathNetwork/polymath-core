pragma solidity ^0.4.24;

/**
 * @title Interface for the polymath ticker registry contract
 */
interface ITickerRegistry {
    /**
    * @notice Check the validity of the symbol
    * @param _symbol token symbol
    * @param _owner address of the owner
    * @param _tokenName Name of the token
    * @return bool
    */
    function checkValidity(string _symbol, address _owner, string _tokenName) external returns(bool);

    /**
    * @notice Returns the owner and timestamp for a given symbol
    * @param _symbol symbol
    */
    function getDetails(string _symbol) public view returns (address, uint256, uint256, string, bool);

    /**
     * @notice Check the symbol is reserved or not
     * @param _symbol Symbol of the token
     * @return bool
     */
     function isReserved(string _symbol, address _owner, string _tokenName) external returns(bool);

     /**
      * @notice Register the token symbol for its particular owner
      * @notice Once the token symbol is registered to its owner then no other issuer can claim
      * @notice its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
      * @param _symbol token symbol
      * @param _tokenName Name of the token
      * @param _owner Address of the owner of the token
      */
     function registerTicker(address _owner, string _symbol, string _tokenName) external;

    /**
     * @notice Modify the ticker details. Only polymath account have the ownership
     * to do so. But only allowed to modify the tickers those are not yet deployed
     * @param _owner Owner of the token
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function modifyTickerDetails(address _owner, string _symbol, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external;

     /**
      * @notice Change the expiry time for the token symbol
      * @param _newExpiry new time period for token symbol expiry
      */
     function changeExpiryLimit(uint256 _newExpiry) external;

     /**
      * @notice set the ticker registration fee in POLY tokens
      * @param _registrationFee registration fee in POLY tokens (base 18 decimals)
      */
     function changePolyRegistrationFee(uint256 _registrationFee) external;

     /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers 
     */
    function getTickersByOwner(address _owner) public view returns(bytes32[]);

}
