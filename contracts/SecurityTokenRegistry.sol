pragma solidity ^0.4.23;

import "./interfaces/ITickerRegistry.sol";
import "./tokens/SecurityToken.sol";
import "./interfaces/ISTProxy.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./helpers/Util.sol";


contract SecurityTokenRegistry is Ownable, ISecurityTokenRegistry, Util {

    uint256 public registrationFee = 250 * 10 ** 18;

    // Emit at the time of launching of new security token
    event LogNewSecurityToken(string _ticker, address indexed _securityTokenAddress, address _owner);
    event LogAddCustomSecurityToken(string _name, string _symbol, address _securityToken, uint256 _addedAt);
     /**
     * @dev Constructor used to set the essentials addresses to facilitate
     * the creation of the security token
     */
    constructor (
        address _polyAddress,
        address _moduleRegistry,
        address _tickerRegistry,
        address _stVersionProxy
    )
    public
    {
        polyAddress = _polyAddress;
        moduleRegistry = _moduleRegistry;
        tickerRegistry = _tickerRegistry;

        // By default, the STR version is set to 0.0.1
        setProtocolVersion(_stVersionProxy, "0.0.1");
    }

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, string _tokenDetails, bool _divisible) public {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name and Symbol string length should be greater than 0");
        require(ITickerRegistry(tickerRegistry).checkValidity(_symbol, msg.sender, _name), "Trying to use non-valid symbol");
        if(registrationFee > 0)
            require(ERC20(polyAddress).transferFrom(msg.sender, this, registrationFee), "Failed transferFrom because of sufficent Allowance is not provided");
        string memory symbol = upper(_symbol);
        address newSecurityTokenAddress = ISTProxy(protocolVersionST[protocolVersion]).deployToken(
            _name,
            symbol,
            18,
            _tokenDetails,
            msg.sender,
            _divisible
        );

        securityTokens[newSecurityTokenAddress] = SecurityTokenData(symbol, _tokenDetails);
        symbols[symbol] = newSecurityTokenAddress;
        emit LogNewSecurityToken(symbol, newSecurityTokenAddress, msg.sender);
    }

    /**
     * @dev Add a new custom (Token should follow the ISecurityToken interface) Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _swarmHash off-chain details about the issuer company
     */
    function addCustomSecurityToken(string _name, string _symbol, address _securityToken, string _tokenDetails, bytes32 _swarmHash) public onlyOwner {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name and Symbol string length should be greater than 0");
        require(_securityToken != address(0) && symbols[_symbol] == address(0), "Symbol is already at the polymath network or entered sencurity token address is 0x");
        require(!(ITickerRegistry(tickerRegistry).isReserved(_symbol, msg.sender, _name, _swarmHash)), "Trying to use non-valid symbol");
        symbols[_symbol] = _securityToken;
        securityTokens[_securityToken] = SecurityTokenData(_symbol, _tokenDetails);
        emit LogAddCustomSecurityToken(_name, _symbol, _securityToken, now);
    }
    /**
    * @dev Changes the protocol version and the SecurityToken contract that the registry points to
    * Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * Changing versions does not affect existing tokens.
    */
    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public onlyOwner {
        protocolVersion = _version;
        protocolVersionST[_version] = _stVersionProxyAddress;
    }

    function setPolyRegistrationFee(uint256 _registrationFee) public onlyOwner {
        registrationFee = _registrationFee;
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
     * @return string, address, string
     */
    function getSecurityTokenData(address _securityToken) public view returns (string, address, string) {
        return (
            securityTokens[_securityToken].symbol,
            ISecurityToken(_securityToken).owner(),
            securityTokens[_securityToken].tokenDetails
        );
    }

    /**
    * @dev Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) public view returns (bool) {
        return (keccak256(securityTokens[_securityToken].symbol) != keccak256(""));
    }
}
