pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IOwner.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/IPolyToken.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./storage/OldEternalStorage.sol";
import "./helpers/Util.sol";

/**
 * @title Registry contract for issuers to register their security tokens
 */
contract OldSecurityTokenRegistry is ISecurityTokenRegistry, OldEternalStorage {

    /**
     * @notice state variables

       address public polyToken;
       uint256 public stLaunchFee;
       uint256 public tickerRegFee;
       uint256 public expiryLimit;
       bool public paused;
       address public owner;
       address public polymathRegistry;

       mapping(address => bytes32[]) userToTickers;
       mapping(string => address) tickerToSecurityTokens;
       mapping(string => uint) tickerIndex;
       mapping(string => TickerDetails) registeredTickers;
       mapping(address => SecurityTokenData) securityTokens;
       mapping(bytes32 => address) protocolVersionST;

       struct TickerDetails {
           address owner;
           uint256 registrationDate;
           uint256 expiryDate;
           string tokenName;
           bool status;
       }

       struct SecurityTokenData {
           string ticker;
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
    // Emit when the token ticker expiry get changed
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
    event LogModifyTickerDetails(address _owner, string _ticker, string _name, uint256 _registrationDate, uint256 _expiryDate);
    // Emit at the time of launching of new security token
    event LogNewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant
    );
    // Emit after the ticker registration
    event LogRegisterTicker(
        address indexed _owner,
        string _ticker,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate
    );

    ///@notice if isReserved returns:
    // OD - Owned and Deployed
    // NN - Not-owned and Not-deployed
    // ON - Owned and Not-deployed
    // ND - Not-owned and Deployed
    enum TickerStatus { OD, NN, ON, ND}

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
        require(!getBool("initialised"));
        require(_STFactory != address(0) && _polyToken != address(0) && _owner != address(0) && _polymathRegistry != address(0), "Address should not be 0x");
        require(_stLaunchFee != 0 && _tickerRegFee != 0, "Fees should not be 0x");
        set("polyToken", _polyToken);
        set("stLaunchFee", _stLaunchFee);
        set("tickerRegFee", _tickerRegFee);
        set("expiryLimit", uint256(15 * 1 days));
        set("paused", false);
        set("owner", _owner);
        set("polymathRegistry", _polymathRegistry);
        _setProtocolVersion(_STFactory, "0.0.1");
        set("initialised", true);
    }

    /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _ticker Ticker ticker of the security token
     * @param _tokenDetails off-chain details of the token
     * @param _divisible Set to true if token is divisible
     */
    function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external whenNotPaused {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "String length should > 0");
        string memory ticker = Util.upper(_ticker);
        require(_checkValidity(ticker, msg.sender, _name), "Non-valid ticker");
        _storeSymbolDetails(ticker, msg.sender, getMapUint("registeredTickers_registrationDate", ticker), getMapUint("registeredTickers_expiryDate", ticker), _name, true);
        if (getUint("stLaunchFee") > 0)
            require(IPolyToken(getAddress("polyToken")).transferFrom(msg.sender, address(this), getUint("stLaunchFee")), "Sufficent allowance is not provided");
        address newSecurityTokenAddress = ISTFactory(getSTFactoryAddress()).deployToken(
            _name,
            ticker,
            18,
            _tokenDetails,
            msg.sender,
            _divisible,
            getAddress("polymathRegistry")
        );
        _storeSecurityTokenData(newSecurityTokenAddress, ticker, _tokenDetails, now);
        setMap("tickerToSecurityTokens", ticker, newSecurityTokenAddress);
        emit LogNewSecurityToken(ticker, _name, newSecurityTokenAddress, msg.sender, now, msg.sender);
    }

    /**
     * @notice Add a new custom (Token should follow the ISecurityToken interface) Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _ticker Ticker of the security token
     * @param _owner Owner of the token
     * @param _securityToken Address of the securityToken
     * @param _tokenDetails off-chain details of the token
     * @param _deployedAt Timestamp at which security token comes deployed on the ethereum blockchain
     */
    function addCustomSecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external onlyOwner {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "String length should > 0");
        require(bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        string memory ticker = Util.upper(_ticker);
        require(_securityToken != address(0) && getMapAddress("tickerToSecurityTokens", ticker) == address(0), "Ticker already exists or ST address is 0x");
        require(_owner != address(0));
        if (_isReserved(ticker, _owner) == TickerStatus.ON) {
            _storeSymbolDetails(ticker, _owner, getMapUint("registeredTickers_registrationDate", ticker), getMapUint("registeredTickers_expiryDate", ticker), _name, true);
        } else if(_isReserved(ticker, _owner) == TickerStatus.NN) {
            _addTicker(_owner, ticker, _name, now, now.add(getUint("expiryLimit")), true);
        } else
            revert();
        setMap("tickerToSecurityTokens", ticker, _securityToken);
        _storeSecurityTokenData(_securityToken, ticker, _tokenDetails, _deployedAt);
        emit LogNewSecurityToken(ticker, _name, _securityToken, _owner, _deployedAt, msg.sender);
    }

    /**
     * @notice Register the token ticker for its particular owner
     * @notice Once the token ticker is registered to its owner then no other issuer can claim
     * @notice its ownership. If the ticker expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Address of the owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     */
    function registerTicker(address _owner, string _ticker, string _tokenName) external whenNotPaused {
        require(_owner != address(0), "Owner should not be 0x");
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        if (getUint("tickerRegFee") > 0)
            require(IPolyToken(getAddress("polyToken")).transferFrom(msg.sender, address(this), getUint("tickerRegFee")), "Sufficent allowance is not provided");
        string memory ticker = Util.upper(_ticker);
        require(_expiryCheck(ticker), "Ticker is already reserved");
        _addTicker(_owner, ticker, _tokenName, now, now.add(getUint("expiryLimit")), false);
    }

    /**
     * @notice Register the ticker without paying the fee
       Once the token ticker is registered to its owner then no other issuer can claim
       Its ownership. If the ticker expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner Owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function addCustomTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external onlyOwner {
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        require(_expiryDate != 0 && _registrationDate != 0, "Dates should not be 0");
        require(_registrationDate < _expiryDate, "Registration date should be less than the expiry date");
        require(_owner != address(0), "Address should not be 0x");
        string memory ticker = Util.upper(_ticker);
        require(_expiryCheck(ticker), "Ticker is already reserved");
        _addTicker(_owner, ticker, _tokenName, _registrationDate, _expiryDate, false);
    }

    /**
     * @notice Modify the ticker details. Only polymath account have the ownership
     * to do so. But only allowed to modify the tickers those are not yet deployed
     * @param _owner Owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function modifyTickerDetails(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate) external onlyOwner {
        string memory ticker = Util.upper(_ticker);
        require(!getMapBool("registeredTickers_status", ticker), "Ticker is already deployed");
        _setTickerOwner(_owner, ticker);
        _storeSymbolDetails(ticker, _owner, _registrationDate, _expiryDate, _tokenName, false);
        emit LogModifyTickerDetails(_owner, _ticker, _tokenName, _registrationDate, _expiryDate);
    }

    /**
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Symbol
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external whenNotPaused {
        string memory ticker = Util.upper(_ticker);
        require(_newOwner != address(0), "Address should not be 0x");
        require(bytes(ticker).length > 0, "Ticker length should > 0");
        require(getMapAddress("registeredTickers_owner", ticker) == msg.sender, "Not authorised");
        require(IOwner(getSecurityTokenAddress(ticker)).owner() == _newOwner, "Deployed ticker should have same owner as new owner");
        uint256 _index = getMapUint("tickerIndex", ticker);
        deleteMapArrayBytes32("userToTickers", msg.sender, _index);
        if (getMapArrayBytes32("userToTickers", msg.sender).length >= _index) {
            bytes32 __ticker =  getMapArrayBytes32("userToTickers", msg.sender)[_index];
            setMap("tickerIndex", Util.bytes32ToString(__ticker), _index);
        }
        _setTickerOwner(_newOwner, ticker);
        setMap("tickerIndex", ticker, (getMapArrayBytes32("userToTickers", _newOwner).length - 1));
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
     * @notice Change the expiry time for the token ticker
     * @param _newExpiry new time period for token ticker expiry
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
        return (keccak256(bytes(getMapString("securityTokens_ticker", _securityToken))) != keccak256(""));
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

    /**
     * @notice Change the PolyToken address
     * @param _newAddress Address of the polytoken 
     */
    function updatePolyTokenAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0));
        set("polyToken", _newAddress);
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @notice Get security token address by ticker name
     * @param _ticker Symbol of the Scurity token
     * @return address
     */
    function getSecurityTokenAddress(string _ticker) public view returns (address) {
        string memory __ticker = Util.upper(_ticker);
        return getMapAddress("tickerToSecurityTokens", __ticker);
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
            getMapString("securityTokens_ticker", _securityToken),
            IOwner(_securityToken).owner(),
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
         uint _len = getMapArrayBytes32("userToTickers", _owner).length;
         bytes32[] memory tempList = new bytes32[](_len);
         for (uint j = 0; j < _len; j++) {
             string memory _ticker = Util.bytes32ToString(getMapArrayBytes32("userToTickers", _owner)[j]);
             if (getMapUint("registeredTickers_expiryDate", _ticker) >= now || getMapBool("registeredTickers_status", _ticker) == true) {
                 tempList[counter] = getMapArrayBytes32("userToTickers", _owner)[j];
                 counter ++;
             }
         }
         return tempList;
    }

    /**
     * @notice Returns the owner and timestamp for a given ticker
     * @param _ticker ticker
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string _ticker) external view returns (address, uint256, uint256, string, bool) {
        string memory ticker = Util.upper(_ticker);
        if (getMapBool("registeredTickers_status", ticker) == true || getMapUint("registeredTickers_expiryDate", ticker) > now) {
            return
            (
                getMapAddress("registeredTickers_owner", ticker),
                getMapUint("registeredTickers_registrationDate", ticker),
                getMapUint("registeredTickers_expiryDate", ticker),
                getMapString("registeredTickers_tokenName", ticker),
                getMapBool("registeredTickers_status", ticker)
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
     * @notice Check the validity of the ticker
     * @param _ticker token ticker
     * @param _owner address of the owner
     * @param _tokenName Name of the token
     * @return bool
     */
    function _checkValidity(string _ticker, address _owner, string _tokenName) internal view returns(bool) {
        require(getMapBool("registeredTickers_status", _ticker) != true, "Deployed ticker are not allowed");
        require(getMapAddress("registeredTickers_owner", _ticker) == _owner, "Should have same owner");
        require(getMapUint("registeredTickers_expiryDate", _ticker) >= now, "Ticker should not be expired");
        return true;
    }

    /**
     * @notice Check the ticker is reserved or not
     * @param _ticker Symbol of the token
     * @param _owner Owner of the token
     * @return TickerStatus
     */
     function _isReserved(string _ticker, address _owner) internal view returns(TickerStatus) {
        if (getMapAddress("registeredTickers_owner", _ticker) == _owner && !_expiryCheck(_ticker)) {
            return TickerStatus.ON;
        }
        else if (getMapAddress("registeredTickers_owner", _ticker) == address(0) || _expiryCheck(_ticker)) {
            // This also cover that the ticker is expired but owned by someone else or _owner itself
            // but _ticker status is false it means the token having ticker is not deployed yet.
            return TickerStatus.NN;
        } else
            return TickerStatus.ND; // can also return OD
     }

    /**
     * @notice To re-initialize the token ticker details if ticker validity expires
     * @param _ticker token ticker
     * @return bool
     */
    function _expiryCheck(string _ticker) internal view returns(bool) {
        if (getMapAddress("registeredTickers_owner", _ticker) != address(0)) {
            if (now > getMapUint("registeredTickers_expiryDate", _ticker) && !getMapBool("registeredTickers_status", _ticker)) {
                return true;
            } else
                return false;
        }
        return true;
    }

    /**
     * @notice Internal function use to store the ticker details
     */
    function _storeSymbolDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status) internal {
        if (getMapAddress("registeredTickers_owner", _ticker) != _owner)
            setMap("registeredTickers_owner", _ticker, _owner);
        if (getMapUint("registeredTickers_registrationDate", _ticker) != _registrationDate)
            setMap("registeredTickers_registrationDate", _ticker, _registrationDate);
        if (getMapUint("registeredTickers_expiryDate", _ticker) != _expiryDate)
            setMap("registeredTickers_expiryDate", _ticker, _expiryDate);
        if (keccak256(abi.encodePacked(getMapString("registeredTickers_tokenName", _ticker))) != keccak256(abi.encodePacked(_tokenName)))
            setMap("registeredTickers_tokenName", _ticker, _tokenName);
        if (getMapBool("registeredTickers_status", _ticker) != _status)
            setMap("registeredTickers_status", _ticker, _status);
    }

    /**
     * @notice Internal function use to store the securitytoken details
     */
    function _storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt) internal {
        setMap("securityTokens_ticker", _securityToken, _ticker);
        setMap("securityTokens_tokenDetails", _securityToken, _tokenDetails);
        setMap("securityTokens_deployedAt", _securityToken, _deployedAt);
    }

    /**
     * @notice Internal function to set the ticker owner
     * @param _owner Address of the owner of ticker
     * @param _ticker Ticker
     */
    function _setTickerOwner(address _owner, string _ticker) internal {
        pushMapArray("userToTickers", _owner, Util.stringToBytes32(_ticker));
        setMap("tickerIndex", _ticker, (getMapArrayBytes32("userToTickers", _owner).length - 1));
    }

    /**
     * @notice Internal function to set the details of the ticker
     */
    function _addTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal {
        _setTickerOwner(_owner, _ticker);
        _storeSymbolDetails(_ticker, _owner, _registrationDate, _expiryDate, _tokenName, _status);
        emit LogRegisterTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate);
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
