pragma solidity ^0.4.18;

contract ISecurityTokenRegistry {

    address public polyAddress;

    address public moduleRegistry;
    address public tickerRegistry;

    bytes32 public protocolVersion = "0.0.1";
    mapping (bytes32 => address) public protocolVersionST;

    struct SecurityTokenData {
      string symbol;
      address owner;
      bytes32 tokenDetails;
    }

    mapping(address => SecurityTokenData) public securityTokens;
    mapping(string => address) symbols;

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _name Name of the security token
     * @param _symbol Ticker symbol of the security token
     * @param _decimals Decimals value for token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails) public;

    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public;

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @dev Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address);
}
