pragma solidity ^0.4.24;

/**
 * @title Interface for the Polymath Security Token Registry contract
 */
interface ISecurityTokenRegistry {

   /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _ticker Ticker ticker of the security token
     * @param _tokenDetails off-chain details of the token
     * @param _divisible whether the token is divisible or not
     */
    function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external;

    /**
     * @notice Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)
     * @param _name Name of the token
     * @param _ticker Ticker of the security token
     * @param _owner Owner of the token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _deployedAt Timestamp at which security token comes deployed on the ethereum blockchain
     */
    function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external;

    /**
     * @notice Register the token ticker for its particular owner
     * @notice Once the token ticker is registered to its owner then no other issuer can claim
     * @notice its ownership. If the ticker expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Address of the owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     */
    function registerTicker(address _owner, string _ticker, string _tokenName) external;

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress Address of the proxy.
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external;

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool);

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external;

    /**
     * @notice Get security token address by ticker name
     * @param _ticker Symbol of the Scurity token
     * @return address
     */
    function getSecurityTokenAddress(string _ticker) external view returns (address);

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
    function getSTFactoryAddress() external view returns(address);

    /**
     * @notice get Protocol version
     */
    function getProtocolVersion() external view returns(uint8[]);

    /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[]);

    /**
     * @notice Returns the list of tokens owned by the selected address
     * @param _owner is the address which owns the list of tickers
     * @dev Intention is that this is called off-chain so block gas limit is not relevant
     */
    function getTokensByOwner(address _owner) external view returns(address[]);

    /**
     * @notice Returns the owner and timestamp for a given ticker
     * @param _ticker ticker
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string _ticker) external view returns (address, uint256, uint256, string, bool);

    /**
     * @notice Modify the ticker details. Only polymath account has the ability
     * to do so. Only allowed to modify the tickers which are not yet deployed
     * @param _owner Owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     * @param _status Token deployed status
     */
    function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external;

     /**
     * @notice Remove the ticker details and associated ownership & security token mapping
     * @param _ticker token ticker
     */
    function removeTicker(string _ticker) external;

    /**
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Ticker
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external;

    /**
     * @notice Change the expiry time for the token ticker
     * @param _newExpiry new time period for token ticker expiry
     */
    function changeExpiryLimit(uint256 _newExpiry) external;

    /**
    * @notice set the ticker registration fee in POLY tokens
    * @param _tickerRegFee registration fee in POLY tokens (base 18 decimals)
    */
   function changeTickerRegistrationFee(uint256 _tickerRegFee) external;

   /**
    * @notice set the ticker registration fee in POLY tokens
    * @param _stLaunchFee registration fee in POLY tokens (base 18 decimals)
    */
   function changeSecurityLaunchFee(uint256 _stLaunchFee) external;

    /**
     * @notice Change the PolyToken address
     * @param _newAddress Address of the polytoken
     */
    function updatePolyTokenAddress(address _newAddress) external;

    /**
     * @notice Gets the security token launch fee
     * @return Fee amount
     */
    function getSecurityTokenLaunchFee() external view returns(uint256);

    /**
     * @notice Gets the ticker registration fee
     * @return Fee amount
     */
    function getTickerRegistrationFee() external view returns(uint256);

    /**
     * @notice Gets the expiry limit
     * @return Expiry limit
     */
    function getExpiryLimit() external view returns(uint256);

    /**
     * @notice Check whether the registry is paused or not
     * @return bool
     */
    function isPaused() external view returns(bool);

    /**
     * @notice Gets the owner of the contract
     * @return address owner
     */
    function owner() external view returns(address);

}
