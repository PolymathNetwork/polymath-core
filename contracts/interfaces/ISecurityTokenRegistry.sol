pragma solidity ^0.4.24;

import "./ISecurityToken.sol";

/**
 * @title Interface for the polymath security token registry contract
 */
contract ISecurityTokenRegistry {

    bytes32 public protocolVersion = "0.0.1";
    mapping (bytes32 => address) public protocolVersionST;

    struct SecurityTokenData {
        string symbol;
        string tokenDetails;
        uint256 registrationTimestamp;
    }

    mapping(address => SecurityTokenData) securityTokens;
    mapping(string => address) symbols;

    // Address of POLYUSD Oracle
    mapping (bytes32 => mapping (bytes32 => address)) oracles;

    /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, string _tokenDetails, bool _divisible) public;

    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public;

    /**
     * @notice Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address);

     /**
     * @notice Get security token data by its address
     * @param _securityToken Address of the Scurity token
     * @return string, address, bytes32
     */
    function getSecurityTokenData(address _securityToken) public view returns (string, address, string, uint256);

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) public view returns (bool);

    /**
    * @notice Get oracle for currency pair
    * @param _currency Symbol of currency
    * @param _denominatedCurrency Symbol of denominated currency
    * @return address of IOracle
    */
    function getOracle(bytes32 _currency, bytes32 _denominatedCurrency) public view returns (address);
}
