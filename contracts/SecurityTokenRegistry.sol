pragma solidity ^0.4.18;

import './interfaces/ITickerRegistry.sol';
import './tokens/SecurityToken.sol';
import './interfaces/ISTProxy.sol';
import './interfaces/ISecurityTokenRegistry.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './helpers/Util.sol';

contract SecurityTokenRegistry is Ownable, ISecurityTokenRegistry, Util {

    event LogNewSecurityToken(string _ticker, address _securityTokenAddress, address _owner);

     /**
     * @dev Constructor use to set the essentials addresses to facilitate
     * the creation of the security token
     */
    function SecurityTokenRegistry(address _polyAddress, address _moduleRegistry, address _tickerRegistry, address _STVersionProxy) public {
        polyAddress = _polyAddress;
        moduleRegistry = _moduleRegistry;
        tickerRegistry = _tickerRegistry;

        setProtocolVersion(_STVersionProxy,"0.0.1");
    }

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _decimals Decimals value for token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails) public {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0);
        require(ITickerRegistry(tickerRegistry).checkValidity(_symbol, msg.sender, _name));
        string memory symbol = upper(_symbol);
        address newSecurityTokenAddress = ISTProxy(protocolVersionST[protocolVersion]).deployToken(
          _name,
          symbol,
          _decimals,
          _tokenDetails,
          msg.sender
        );

        securityTokens[newSecurityTokenAddress] = SecurityTokenData(symbol, _tokenDetails);
        symbols[symbol] = newSecurityTokenAddress;
        LogNewSecurityToken(symbol, newSecurityTokenAddress, msg.sender);
    }

    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public onlyOwner {
      protocolVersion = _version;
      protocolVersionST[_version]=_stVersionProxyAddress;
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
      string memory __symbol = upper(_symbol);
      return symbols[__symbol];
    }

     /**
     * @dev Get security token data by its address
     * @param _securityToken Address of the Scurity token
     * @return string, address, bytes32
     */
    function getSecurityTokenData(address _securityToken) public view returns (string, address, bytes32) {
      return (
        securityTokens[_securityToken].symbol,
        ISecurityToken(_securityToken).owner(),
        securityTokens[_securityToken].tokenDetails
      );
    }
}
