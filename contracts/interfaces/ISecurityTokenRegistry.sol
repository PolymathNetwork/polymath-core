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
     */
    function generateSecurityToken(string _name, string _symbol, string _tokenDetails, bool _divisible) external;

    /**
     * @notice Add a new custom (Token should follow the ISecurityToken interface) Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _owner Owner of the token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _swarmHash off-chain details about the issuer company
     */
    function addCustomSecurityToken(string _name, string _symbol, address _owner, address _securityToken, string _tokenDetails, bytes32 _swarmHash) external;

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    */
    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) external;

    /**
     * @notice Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) external view returns (address);

     /**
     * @notice Get security token data by its address
     * @param _securityToken Address of the Scurity token
     * @return string, address, bytes32
     */
    function getSecurityTokenData(address _securityToken) external view returns (string, address, string);

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool);

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
     * @return bytes32
     * @return bool
     */
    function getTickerDetails(string _symbol) external view returns (address, uint256, uint256, string, bytes32, bool);

    /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _tickerRegFee registration fee in POLY tokens (base 18 decimals)
     */
    function changeTickerRegistrationFee(uint256 _tickerRegFee) external;

}
