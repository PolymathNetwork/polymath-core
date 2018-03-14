pragma solidity ^0.4.18;

import './SecurityToken.sol';
import './interfaces/ITokenRegistrar';

contract SecurityTokenRegistrar {

    address public moduleRegistry;
    address public tickerRegistrar;

    struct SecurityTokenData {
      string symbol;
      address owner;
      bytes32 securityDetails;
    }

    mapping(address => SecurityTokenData) public securityTokens;
    mapping(string => address) tickers;

    event LogNewSecurityToken(string _ticker, address _securityTokenAddress, address _owner);

     /**
     * @dev Constructor use to set the essentials addresses to facilitate
     * the creation of the security token
     */
    function SecurityTokenRegistrar(address _moduleRegistry, address _tickerRegistrar) public {
        moduleRegistry = _moduleRegistry;
        tickerRegistrar = _tickerRegistrar;
    }

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _owner Ethereum public key address of the security token owner
     * @param _name Name of the security token
     * @param _symbol Ticker name of the security
     * @param _decimals Decimals value for token
     * @param _securityDetails off-chain security details
     */
    function generateSecurityToken(address _owner, string _name, string _symbol, uint8 _decimals, bytes32 _securityDetails) public {
        require(_owner != address(0));
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0);
        ITokenRegistrar(tickerRegistrar).checkValidity(_symbol,_owner);
        address newSecurityTokenAddress = new SecurityToken(_owner, _name, _symbol, _decimals, _securityDetails, _moduleRegistry);
        securityTokens[newSecurityTokenAddress] = SecurityTokenData(_symbol, _owner, _securityDetails);
        tickers[_symbol] = newSecurityTokenAddress;
        LogNewSecurityToken(_nameSpaceName, _ticker, newSecurityTokenAddress, _owner, _type);
    }

    function attachTokenTransferModule() internal {
        // TODO : Yet decided
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @dev Get security token address by ticker name
     * @param _ticker Symbol of the Scurity token
     * @return address _ticker
     */
    function getSecurityTokenAddress(string _ticker) public view returns (address) {
      return tickers[_ticker];
    }

    /**
     * @dev Get Security token details by its ethereum address
     * @param _STAddress Security token address
     */
    function getSecurityTokenData(address _STAddress) public view returns (
      string,
      address,
      bytes32
    ) {
      return (
        securityTokens[_STAddress].ticker,
        securityTokens[_STAddress].owner,
        securityTokens[_STAddress].securityDetails
      );
    }
}