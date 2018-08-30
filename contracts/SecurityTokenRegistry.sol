pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/IPolyToken.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./storage/EternalStorage.sol";
import "./helpers/Util.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract SecurityTokenRegistry is ISecurityTokenRegistry, EternalStorage {

    /**
     * @notice state variables

       address public polyToken;
       uint256 public stLaunchFee;
       uint256 public tickerRegFee;
       uint256 public expiryLimit;
       bool public paused;
       address public owner;
       address public polymathRegistry;

       mapping(address => bytes32[]) tokensOwnedByUser;
       mapping(string => address) symbols;
       mapping(string => uint) tickerIndex;
       mapping(string => SymbolDetails) registeredSymbols;
       mapping(address => SecurityTokenData) securityTokens;
       mapping(bytes32 => address) protocolVersionST;

       struct SymbolDetails {
           address owner;
           uint256 registrationDate;
           uint256 expiryDate;
           string tokenName;
           bool status;
       }

       struct SecurityTokenData {
           string symbol;
           string tokenDetails;
           uint256 deployedAt;
       }

     */

    using SafeMath for uint256;

    // Emit when ecosystem get paused
    event Pause(uint256 _timestammp);
     // Emit when ecosystem get unpaused
    event Unpause(uint256 _timestamp);
    // Emit when ownership get renounced
    event OwnershipRenounced(address indexed previousOwner);
    // Emit when the token symbol expiry get changed
    event LogChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);
     // Emit when changeSecurityLaunchFee is called
    event LogChangeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee);
    // Emit when changeTickerRegistrationFee is called
    event LogChangeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee);
    // Emit when ownership get transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // Emit when ownership of the ticker get changed
    event LogChangeTickerOwnership(string _ticker, address indexed _oldOwner, address indexed _newOwner);
    // Emit when a ticker details get modified
    event LogModifyTickerDetails(address _owner, string _symbol, string _name, uint256 _registrationDate, uint256 _expiryDate);
    // Emit at the time of launching of new security token
    event LogNewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant
    );
    // Emit after the symbol registration
    event LogRegisterTicker(
        address indexed _owner,
        string _symbol,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate
    );

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == getAddress("owner"));
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is not paused.
    */
    modifier whenNotPaused() {
        require(!getBool("paused"), "Contract is paused");
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is paused.
    */
    modifier whenPaused() {
        require(getBool("paused"), "Contract is not paused");
        _;
    }

    // Constructor
    constructor () public
    {

    }

    function initialize(address _polymathRegistry, address _STFactory, uint256 _stLaunchFee, uint256 _tickerRegFee, address _polyToken, address _owner) payable public {
        require(!getBool("flag"));
        require(_STFactory != address(0) && _polyToken != address(0) && _owner != address(0) && _polymathRegistry != address(0), "Input address should not be 0x");
        require(_stLaunchFee != 0 && _tickerRegFee != 0, "Input fees should not be 0x");
        set("polyToken", _polyToken);
        set("stLaunchFee", _stLaunchFee);
        set("tickerRegFee", _tickerRegFee);
        set("expiryLimit", uint256(15 * 1 days));
        set("paused", false);
        set("owner", _owner);
        set("polymathRegistry", _polymathRegistry);
        _setProtocolVersion(_STFactory, "0.0.1");
        set("flag", true);
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
        require(_checkValidity(_symbol, msg.sender, _name), "Trying to use non-valid symbol");
        if (getUint("stLaunchFee") > 0)
            require(IPolyToken(getAddress("polyToken")).transferFrom(msg.sender, address(this), getUint("stLaunchFee")), "Failed transferFrom because of sufficent Allowance is not provided");
        string memory symbol = Util.upper(_symbol);
        address newSecurityTokenAddress = ISTFactory(getSTFactoryAddress()).deployToken(
            _name,
            symbol,
            18,
            _tokenDetails,
            msg.sender,
            _divisible,
            getAddress("polymathRegistry")
        );
        _storeSecurityTokenData(newSecurityTokenAddress, symbol, _tokenDetails, now);
        setMap("symbols", symbol, newSecurityTokenAddress);
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
    function addCustomSecurityToken(string _name, string _symbol, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external onlyOwner whenNotPaused {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name and Symbol string length should be greater than 0");
        string memory symbol = Util.upper(_symbol);
        require(_securityToken != address(0) && getMapAddress("symbols", symbol) == address(0), "Symbol is already at the polymath network or entered security token address is 0x");
        require(_owner != address(0));
        require(!_isReserved(symbol, _owner, _name), "Trying to use non-valid symbol");
        setMap("symbols", symbol, _securityToken);
        _storeSecurityTokenData(_securityToken, symbol, _tokenDetails, _deployedAt);
        emit LogNewSecurityToken(symbol, _name, _securityToken, _owner, _deployedAt, msg.sender);
    }

    /**
     * @notice Register the token symbol for its particular owner
     * @notice Once the token symbol is registered to its owner then no other issuer can claim
     * @notice its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Address of the owner of the token
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     */
    function registerTicker(address _owner, string _symbol, string _tokenName) external whenNotPaused {
        require(_owner != address(0), "Owner should not be 0x");
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "Ticker length should always between 0 & 10");
        if (getUint("tickerRegFee") > 0) {
            uint256 _fee = getUint("tickerRegFee");
            address _polyToken = getAddress("polyToken");
            require(IPolyToken(_polyToken).transferFrom(msg.sender, address(this), _fee), "Failed transferFrom because of sufficent Allowance is not provided");
        }
        string memory symbol = Util.upper(_symbol);
        require(_expiryCheck(symbol), "Ticker is already reserved");
        pushMapArray("tokensOwnedByUser", _owner, Util.stringToBytes32(symbol));
        setMap("tickerIndex", symbol, (getMapArrayBytes32("tokensOwnedByUser", _owner).length - 1));
        _storeSymbolDetails(symbol, _owner, now, now.add(getUint('expiryLimit')), _tokenName, false);
        emit LogRegisterTicker(_owner, symbol, _tokenName, now, now.add(getUint('expiryLimit')));
    }

    /**
     * @notice Register the ticker without paying the fee
       Once the token symbol is registered to its owner then no other issuer can claim
       Its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Owner of the token
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function addCustomTicker(address _owner, string _symbol, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external onlyOwner whenNotPaused {
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "Ticker length should always between 0 & 10");
        require(_expiryDate != 0 && _registrationDate != 0, "Dates should not be 0");
        require(_registrationDate < _expiryDate, "Registration date should be less than the expiry date");
        require(_owner != address(0), "Address should not be 0x");
        string memory symbol = Util.upper(_symbol);
        require(_expiryCheck(symbol), "Ticker is already reserved");
        pushMapArray("tokensOwnedByUser", _owner, Util.stringToBytes32(symbol));
        setMap("tickerIndex", symbol, (getMapArrayBytes32("tokensOwnedByUser", _owner).length - 1));
        _storeSymbolDetails(symbol, _owner, _registrationDate, _expiryDate, _tokenName, false);
        emit LogRegisterTicker(_owner, symbol, _tokenName, _registrationDate, _expiryDate);
    }

    /**
     * @notice Modify the ticker details. Only polymath account have the ownership
     * to do so. But only allowed to modify the tickers those are not yet deployed
     * @param _owner Owner of the token
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function modifyTickerDetails(address _owner, string _symbol, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external onlyOwner {
        string memory symbol = Util.upper(_symbol);
        require(!getMapBool("registeredSymbols_status", symbol), "Modifying the details of deployed token is not permitted");
        _storeSymbolDetails(symbol, _owner, _registrationDate, _expiryDate, _tokenName, false);
        emit LogModifyTickerDetails(_owner, _symbol, _tokenName, _registrationDate, _expiryDate);
    }

    /**
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Symbol
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external whenNotPaused {
        string memory ticker = Util.upper(_ticker);
        require(_newOwner != address(0), "Address should not be 0x");
        require(bytes(ticker).length > 0, "Ticker length should be greater than 0");
        require(getMapAddress("registeredSymbols_owner", ticker) == msg.sender, "Only the ticker owner can transfer the ownership");
        require(_renounceTickerOwnership(ticker), "Should successfully renounce the ownership of the ticker");
        setMap("registeredSymbols_owner", ticker, _newOwner);
        pushMapArray("tokensOwnedByUser", _newOwner, Util.stringToBytes32(ticker));
        setMap("tickerIndex", ticker, (getMapArrayBytes32("tokensOwnedByUser", _newOwner).length - 1));
        emit LogChangeTickerOwnership(ticker, msg.sender, _newOwner);
    }

    /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _stLaunchFee registration fee in POLY tokens (base 18 decimals)
     */
    function changeSecurityLaunchFee(uint256 _stLaunchFee) external onlyOwner {
        require(getUint("stLaunchFee") != _stLaunchFee);
        emit LogChangeSecurityLaunchFee(getUint("stLaunchFee"), _stLaunchFee);
        set("stLaunchFee", _stLaunchFee);
    }

    /**
     * @notice Change the expiry time for the token symbol
     * @param _newExpiry new time period for token symbol expiry
     */
    function changeExpiryLimit(uint256 _newExpiry) public onlyOwner {
        require(_newExpiry >= 1 days, "Expiry should greater than or equal to 1 day");
        emit LogChangeExpiryLimit(getUint('expiryLimit'), _newExpiry);
        set('expiryLimit', _newExpiry);
    }

     /**
     * @notice set the ticker registration fee in POLY tokens
     * @param _tickerRegFee registration fee in POLY tokens (base 18 decimals)
     */
    function changeTickerRegistrationFee(uint256 _tickerRegFee) external onlyOwner {
        require(getUint('tickerRegFee') != _tickerRegFee);
        emit LogChangeTickerRegistrationFee(getUint('tickerRegFee'), _tickerRegFee);
        set('tickerRegFee', _tickerRegFee);
    }

    /**
    * @notice Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IPolyToken token = IPolyToken(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(getAddress("owner"), balance));
    }

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress Address of the proxy.
    * @param _version new version of the proxy which is used to deploy the securityToken.
    */
    function setProtocolVersion(address _STFactoryAddress, bytes32 _version) external onlyOwner {
        _setProtocolVersion(_STFactoryAddress, _version);
    }

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool) {
        return (keccak256(bytes(getMapString("securityTokens_symbol", _securityToken))) != keccak256(""));
    }

    /**
    * @dev Allows the current owner to relinquish control of the contract.
    */
    function renounceOwnership() external onlyOwner {
        emit OwnershipRenounced(getAddress("owner"));
        set("owner", address(0));
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external onlyOwner {
        _transferOwnership(_newOwner);
    }

    /**
    * @notice called by the owner to pause, triggers stopped state
    */
    function pause() external whenNotPaused onlyOwner {
        set("paused", true);
        emit Pause(now);
    }

    /**
    * @notice called by the owner to unpause, returns to normal state
    */
    function unpause() external whenPaused onlyOwner {
        set("paused", false);
        emit Unpause(now);
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @notice Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address) {
        string memory __symbol = Util.upper(_symbol);
        return getMapAddress("symbols", __symbol);
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
            getMapString("securityTokens_symbol", _securityToken),
            Ownable(_securityToken).owner(),
            getMapString("securityTokens_tokenDetails", _securityToken),
            getMapUint("securityTokens_deployedAt", _securityToken)
        );
    }

    /**
     * @notice Get the current STFactory Address
     */
    function getSTFactoryAddress() public view returns(address) {
        return getMapAddress("protocolVersionST", getBytes32("protocolVersion"));
    }

    /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[]) {
         uint counter = 0;
         uint _len = getMapArrayBytes32("tokensOwnedByUser", _owner).length;
         bytes32[] memory tempList = new bytes32[](_len);
         for (uint j = 0; j < _len; j++) {
             string memory _symbol = Util.bytes32ToString(getMapArrayBytes32("tokensOwnedByUser", _owner)[j]);
             if (getMapUint("registeredSymbols_expiryDate", _symbol) >= now || getMapBool("registeredSymbols_status", _symbol) == true) {
                 tempList[counter] = getMapArrayBytes32("tokensOwnedByUser", _owner)[j];
                 counter ++;
             }
         }
         return tempList;
    }

    /**
     * @notice Returns the owner and timestamp for a given symbol
     * @param _symbol symbol
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string _symbol) external view returns (address, uint256, uint256, string, bool) {
        string memory symbol = Util.upper(_symbol);
        if (getMapBool("registeredSymbols_status", symbol) == true || getMapUint("registeredSymbols_expiryDate", symbol) > now) {
            return
            (
                getMapAddress("registeredSymbols_owner", symbol),
                getMapUint("registeredSymbols_registrationDate", symbol),
                getMapUint("registeredSymbols_expiryDate", symbol),
                getMapString("registeredSymbols_tokenName", symbol),
                getMapBool("registeredSymbols_status", symbol)
            );
        } else
            return (address(0), uint256(0), uint256(0), "", false);
    }

    ////////////////////////
    //// Internal functions
    ////////////////////////

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    */
    function _setProtocolVersion(address _STFactoryAddress, bytes32 _version) internal {
        set("protocolVersion", _version);
        setMap("protocolVersionST", getBytes32("protocolVersion"), _STFactoryAddress);
    }

    /**
     * @notice Check the validity of the symbol
     * @param _symbol token symbol
     * @param _owner address of the owner
     * @param _tokenName Name of the token
     * @return bool
     */
    function _checkValidity(string _symbol, address _owner, string _tokenName) internal returns(bool) {
        string memory symbol = Util.upper(_symbol);
        require(getMapBool("registeredSymbols_status", symbol)!= true, "Symbol status should not equal to true");
        require(getMapAddress("registeredSymbols_owner", symbol) == _owner, "Owner of the symbol should matched with the requested issuer address");
        require(getMapUint("registeredSymbols_expiryDate", symbol) >= now, "Ticker should not be expired");
        setMap("registeredSymbols_tokenName", symbol, _tokenName);
        setMap("registeredSymbols_status", symbol, true);
        return true;
    }

    /**
     * @notice Check the symbol is reserved or not
     * @param _symbol Symbol of the token
     * @param _owner Owner of the token
     * @param _tokenName Name of the token
     * @return bool
     */
     function _isReserved(string _symbol, address _owner, string _tokenName) internal returns(bool) {
        string memory symbol = Util.upper(_symbol);
        if (getMapAddress("registeredSymbols_owner", symbol) == _owner && ! _expiryCheck(symbol)) {
            setMap("registeredSymbols_stauts", symbol, true);
            return false;
        }
        else if (getMapAddress("registeredSymbols_owner", symbol) == address(0) || _expiryCheck(symbol)) {
            _storeSymbolDetails(symbol, _owner, now, now.add(getMapUint("registeredSymbols_expiryDate", symbol)), _tokenName, false);
            emit LogRegisterTicker (_owner, symbol, _tokenName, now, now.add(getMapUint("registeredSymbols_expiryDate", symbol)));
            return false;
        } else
            return true;
     }

    /**
     * @notice To re-initialize the token symbol details if symbol validity expires
     * @param _symbol token symbol
     * @return bool
     */
    function _expiryCheck(string _symbol) internal returns(bool) {
        if (getMapAddress("registeredSymbols_owner", _symbol) != address(0)) {
            if (now > getMapUint("registeredSymbols_expiryDate", _symbol) && getMapBool("registeredSymbols_status", _symbol) != true) {
                _storeSymbolDetails(_symbol, address(0), uint256(0), uint256(0), "", false);
                return true;
            } else
                return false;
        }
        return true;
    }

    /**
     * @notice Internal function use to store the symbol details
     */
    function _storeSymbolDetails(string _symbol, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status) internal {
        setMap("registeredSymbols_owner", _symbol, _owner);
        setMap("registeredSymbols_registrationDate", _symbol, _registrationDate);
        setMap("registeredSymbols_expiryDate", _symbol, _expiryDate);
        setMap("registeredSymbols_tokenName", _symbol, _tokenName);
        setMap("registeredSymbols_status", _symbol, _status);
    }

    /**
     * @notice Internal function use to store the securitytoken details
     */
    function _storeSecurityTokenData(address _securityToken, string _symbol, string _tokenDetails, uint256 _deployedAt) internal {
        setMap("securityTokens_symbol", _securityToken, _symbol);
        setMap("securityTokens_tokenDetails", _securityToken, _tokenDetails);
        setMap("securityTokens_deployedAt", _securityToken, _deployedAt);
    }

    /**
     * @notice Renounce the ownership of the ticker
     * @param _ticker Symbol of the token
     * @return bool
     */
    function _renounceTickerOwnership(string _ticker) internal returns(bool) {
       address _currentOwner = getMapAddress("registeredSymbols_owner", _ticker);
       uint256 _index = getMapUint("tickerIndex", _ticker);
       require(_index != uint256(1 ether), "Deleted index is not allowed");
       deleteMapArrayBytes32("tokensOwnedByUser", _currentOwner, _index);
       bytes32 _symbol =  getMapArrayBytes32("tokensOwnedByUser", getMapAddress("registeredSymbols_owner", _ticker))[_index];
       setMap("tickerIndex", Util.bytes32ToString(_symbol), _index);
       setMap("tickerIndex", _ticker, uint256(1 ether));
       return true;
    }

    /**
    * @dev Transfers control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function _transferOwnership(address _newOwner) internal {
        require(_newOwner != address(0));
        emit OwnershipTransferred(getAddress("owner"), _newOwner);
        set("owner", _newOwner);
    }

}
