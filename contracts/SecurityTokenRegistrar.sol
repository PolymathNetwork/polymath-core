pragma solidity ^0.4.18;

import './interfaces/ITickerRegistrar.sol';
import './SecurityToken.sol';

contract SecurityTokenRegistrar {

    address public moduleRegistry;
    address public tickerRegistrar;
    address public transferManagerFactory;

    struct SecurityTokenData {
      string symbol;
      address owner;
      bytes32 securityDetails;
    }

    mapping(address => SecurityTokenData) public securityTokens;
    mapping(string => address) symbols;

    event LogNewSecurityToken(string _ticker, address _securityTokenAddress, address _owner);

     /**
     * @dev Constructor use to set the essentials addresses to facilitate
     * the creation of the security token
     */
    function SecurityTokenRegistrar(address _moduleRegistry, address _tickerRegistrar, address _transferManagerFactory) public {
        moduleRegistry = _moduleRegistry;
        tickerRegistrar = _tickerRegistrar;
        transferManagerFactory = _transferManagerFactory;
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
        ITickerRegistrar(tickerRegistrar).checkValidity(_symbol, _owner);
        address newSecurityTokenAddress = new SecurityToken(
          _owner,
          _name,
          _symbol,
          _decimals,
          _securityDetails,
          moduleRegistry,
          transferManagerFactory
          );
        securityTokens[newSecurityTokenAddress] = SecurityTokenData(_symbol, _owner, _securityDetails);
        symbols[_symbol] = newSecurityTokenAddress;
        LogNewSecurityToken(_symbol, newSecurityTokenAddress, _owner);
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @dev Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address) {
      return symbols[_symbol];
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
        securityTokens[_STAddress].symbol,
        securityTokens[_STAddress].owner,
        securityTokens[_STAddress].securityDetails
      );
    }
}