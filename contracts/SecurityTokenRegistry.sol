pragma solidity ^0.4.24;

import "./interfaces/ITickerRegistry.sol";
import "./tokens/SecurityToken.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./Pausable.sol";
import "./RegistryUpdater.sol";
import "./ReclaimTokens.sol";
import "./helpers/Util.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistry is ISecurityTokenRegistry, Util, Pausable, RegistryUpdater, ReclaimTokens {

    // Versioning data
    bytes32 public protocolVersion = "0.0.1";
    mapping (bytes32 => address) public protocolVersionST;

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;

    struct SecurityTokenData {
        string symbol;
        string tokenDetails;
        uint256 registrationTimestamp;
    }

    // Stored Security Token Data
    mapping(address => SecurityTokenData) securityTokens;

    // Stored token symbol addresses
    mapping(string => address) symbols;

    // Emit when changePolyRegistrationFee is called
    event LogChangePolyRegistrationFee(uint256 _oldFee, uint256 _newFee);
    // Emit at the time of launching of new security token
    event LogNewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant
    );

    constructor (
        address _polymathRegistry,
        address _STFactory,
        uint256 _registrationFee
    )
    public
    RegistryUpdater(_polymathRegistry)
    {
        registrationFee = _registrationFee;
        // By default, the STR version is set to 0.0.1
        setProtocolVersion(_STFactory, "0.0.1");
    }

    /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _tokenDetails off-chain details of the token
     * @param _divisible Set to true if token is divisible
     */
    function generateSecurityToken(string _name, string _symbol, string _tokenDetails, bool _divisible) external whenNotPaused {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name and Symbol string length should be greater than 0");
        require(ITickerRegistry(tickerRegistry).checkValidity(_symbol, msg.sender, _name), "Trying to use non-valid symbol");
        if(registrationFee > 0)
            require(IERC20(polyToken).transferFrom(msg.sender, this, registrationFee), "Failed transferFrom because of sufficent Allowance is not provided");
        string memory symbol = _upper(_symbol);
        address newSecurityTokenAddress = ISTFactory(protocolVersionST[protocolVersion]).deployToken(
            _name,
            symbol,
            18,
            _tokenDetails,
            msg.sender,
            _divisible,
            polymathRegistry
        );

        securityTokens[newSecurityTokenAddress] = SecurityTokenData(symbol, _tokenDetails, now);
        symbols[symbol] = newSecurityTokenAddress;
        emit LogNewSecurityToken(symbol, _name, newSecurityTokenAddress, msg.sender, now, msg.sender);
    }

    /**
     * @notice Add a new custom (Token should follow the ISecurityToken interface) Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _owner Owner of the token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _deployedAt Timestamp at which security token comes deployed on the ethereum blockchain
     */
    function addCustomSecurityToken(string _name, string _symbol, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external onlyOwner {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name and Symbol string length should be greater than 0");
        string memory symbol = _upper(_symbol);
        require(_securityToken != address(0) && symbols[symbol] == address(0), "Symbol is already at the polymath network or entered security token address is 0x");
        require(_owner != address(0));
        require(!(ITickerRegistry(tickerRegistry).isReserved(symbol, _owner, _name)), "Trying to use non-valid symbol");
        symbols[symbol] = _securityToken;
        securityTokens[_securityToken] = SecurityTokenData(symbol, _tokenDetails, _deployedAt);
        emit LogNewSecurityToken(symbol, _name, _securityToken, _owner, _deployedAt, msg.sender);
    }

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    */
    function setProtocolVersion(address _STFactoryAddress, bytes32 _version) public onlyOwner {
        protocolVersion = _version;
        protocolVersionST[_version] = _STFactoryAddress;
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @notice Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address
     */
    function getSecurityTokenAddress(string _symbol) external view returns (address) {
        string memory __symbol = _upper(_symbol);
        return symbols[__symbol];
    }

     /**
     * @notice Get security token data by its address
     * @param _securityToken Address of the Scurity token.
     * @return string Symbol of the Security Token.
     * @return address Address of the issuer of Security Token.
     * @return string Details of the Token.
     * @return uint256 Timestamp at which Security Token get launched on Polymath platform.
     */
    function getSecurityTokenData(address _securityToken) external view returns (string, address, string, uint256) {
        return (
            securityTokens[_securityToken].symbol,
            Ownable(_securityToken).owner(),
            securityTokens[_securityToken].tokenDetails,
            securityTokens[_securityToken].registrationTimestamp
        );
    }

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool) {
        return (keccak256(bytes(securityTokens[_securityToken].symbol)) != keccak256(""));
    }

    /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _registrationFee registration fee in POLY tokens (base 18 decimals)
     */
    function changePolyRegistrationFee(uint256 _registrationFee) external onlyOwner {
        require(registrationFee != _registrationFee);
        emit LogChangePolyRegistrationFee(registrationFee, _registrationFee);
        registrationFee = _registrationFee;
    }

    /**
     * @notice pause registration function
     */
    function unpause() public onlyOwner  {
        _unpause();
    }

    /**
     * @notice unpause registration function
     */
    function pause() public onlyOwner {
        _pause();
    }

}
