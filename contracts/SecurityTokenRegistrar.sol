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
      bytes32 tokenDetails;
    }

    //Shoud be set to false when we have more TransferManager options
    bool addGeneralTransferManager = true;

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
     * @param _name Name of the security token
     * @param _symbol Ticker name of the security
     * @param _decimals Decimals value for token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails) public {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0);
        ITickerRegistrar(tickerRegistrar).checkValidity(_symbol, msg.sender);
        address newSecurityTokenAddress = new SecurityToken(
          _name,
          _symbol,
          _decimals,
          _tokenDetails,
          moduleRegistry
        );
        if (addGeneralTransferManager) {          
          SecurityToken(newSecurityTokenAddress).addModule(transferManagerFactory, "", 0, true);
        }
        SecurityToken(newSecurityTokenAddress).transferOwnership(msg.sender);
        securityTokens[newSecurityTokenAddress] = SecurityTokenData(_symbol, msg.sender, _tokenDetails);
        symbols[_symbol] = newSecurityTokenAddress;
        LogNewSecurityToken(_symbol, newSecurityTokenAddress, msg.sender);
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
}
