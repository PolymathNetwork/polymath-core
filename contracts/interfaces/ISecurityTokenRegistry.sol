pragma solidity ^0.4.24;

/**
 * @title Interface for the polymath security token registry contract
 */
interface ISecurityTokenRegistry {

   /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _tokenDetails off-chain details of the token
     * @param _divisible Set to true if token is divisible
     */
    function generateSecurityToken(string _name, string _symbol, string _tokenDetails, bool _divisible) external;

    /**
     * @notice Add a new custom (Token should follow the ISecurityToken interface) Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _owner Owner of the token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _deployedAt Timestamp at which security token comes deployed on the ethereum blockchain
     */
    function addCustomSecurityToken(string _name, string _symbol, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external;

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
     * @notice Register the ticker without paying the fee 
       Once the token symbol is registered to its owner then no other issuer can claim
       Its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Owner of the token
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function addCustomTicker(address _owner, string _symbol, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external;

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
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Symbol 
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external;

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress Address of the proxy.
    * @param _version new version of the proxy which is used to deploy the securityToken. 
    */
    function setProtocolVersion(address _STFactoryAddress, bytes32 _version) external;

    /**
     * @notice Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address);

    /**
     * @notice Get security token data by its address
     * @param _securityToken Address of the Scurity token.
     * @return string Symbol of the Security Token.
     * @return address Address of the issuer of Security Token.
     * @return string Details of the Token.
     * @return uint256 Timestamp at which Security Token get launched on Polymath platform.
     */
    function getSecurityTokenData(address _securityToken) external view returns (string, address, string, uint256);

    /**
     * @notice Get the current STFactory Address
     */
    function getSTFactoryAddress() public view returns(address);

    /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers 
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[]);

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool);

    /**
    * @dev Allows the current owner to relinquish control of the contract.
    */
    function renounceOwnership() external;

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external; 

    /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _stLaunchFee registration fee in POLY tokens (base 18 decimals)
     */
    function changeSecurityLaunchFee(uint256 _stLaunchFee) external;

    /**
     * @notice Returns the owner and timestamp for a given symbol
     * @param _symbol symbol
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string _symbol) external view returns (address, uint256, uint256, string, bool);

    /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _tickerRegFee registration fee in POLY tokens (base 18 decimals)
     */
    function changeTickerRegistrationFee(uint256 _tickerRegFee) external;

    /**
     * @notice Check the validity of the ticker
     * @param _ticker token ticker
     * @param _owner address of the owner
     * @param _tokenName Name of the token
     * @return bool
     */
    function checkValidity(string _ticker, address _owner, string _tokenName) public view returns(bool);

}
