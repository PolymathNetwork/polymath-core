pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IOwnable.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./storage/EternalStorage.sol";
import "./libraries/Util.sol";
import "./libraries/Encoder.sol";
import "./libraries/VersionUtils.sol";

/**
 * @title Registry contract for issuers to register their tickers and security tokens
 */
contract SecurityTokenRegistry is ISecurityTokenRegistry, EternalStorage {

    /**
     * @notice state variables

       address public polyToken;
       uint256 public stLaunchFee;
       uint256 public tickerRegFee;
       uint256 public expiryLimit;
       uint256 public latestProtocolVersion;
       bool public paused;
       address public owner;
       address public polymathRegistry;

       address[] public activeUsers;
       mapping(address => bool) public seenUsers;

       mapping(address => bytes32[]) userToTickers;
       mapping(string => address) tickerToSecurityToken;
       mapping(string => uint) tickerIndex;
       mapping(string => TickerDetails) registeredTickers;
       mapping(address => SecurityTokenData) securityTokens;
       mapping(bytes32 => address) protocolVersionST;
       mapping(uint256 => ProtocolVersion) versionData;

       struct ProtocolVersion {
           uint8 major;
           uint8 minor;
           uint8 patch;
       }

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

    // Emit when network becomes paused
    event Pause(uint256 _timestammp);
     // Emit when network becomes unpaused
    event Unpause(uint256 _timestamp);
    // Emit when the ticker is removed from the registry
    event TickerRemoved(string _ticker, uint256 _removedAt, address _removedBy);
    // Emit when the token ticker expiry is changed
    event ChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);
     // Emit when changeSecurityLaunchFee is called
    event ChangeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee);
    // Emit when changeTickerRegistrationFee is called
    event ChangeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee);
    // Emit when ownership gets transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // Emit when ownership of the ticker gets changed
    event ChangeTickerOwnership(string _ticker, address indexed _oldOwner, address indexed _newOwner);
    // Emit at the time of launching a new security token
    event NewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant,
        bool _fromAdmin,
        uint256 _registrationFee
    );
    // Emit after ticker registration
    event RegisterTicker(
        address indexed _owner,
        string _ticker,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate,
        bool _fromAdmin,
        uint256 _registrationFee
    );

    /////////////////////////////
    // Modifiers
    /////////////////////////////

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner());
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPausedOrOwner() {
        if (msg.sender == owner())
            _;
        else {
            require(!isPaused(), "Already paused");
            _;
        }
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.
     */
    modifier whenNotPaused() {
        require(!isPaused(), "Already paused");
        _;
    }


    /**
     * @notice Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(isPaused(), "Should not be paused");
        _;
    }


    /////////////////////////////
    // Initialization
    /////////////////////////////

    /**
     * @notice initializes instance of STR
     * @param _polymathRegistry is the address of the Polymath Registry
     * @param _STFactory is the address of the Proxy contract for Security Tokens
     * @param _stLaunchFee is the fee in POLY required to launch a token
     * @param _tickerRegFee is the fee in POLY required to register a ticker
     * @param _polyToken is the address of the POLY ERC20 token
     * @param _owner is the owner of the STR
     */
    function initialize(address _polymathRegistry, address _STFactory, uint256 _stLaunchFee, uint256 _tickerRegFee, address _polyToken, address _owner) payable external {
        require(!getBool(Encoder.getKey("initialised")));
        require(_STFactory != address(0) && _polyToken != address(0) && _owner != address(0) && _polymathRegistry != address(0), "Invalid address");
        require(_stLaunchFee != 0 && _tickerRegFee != 0, "Fees should not be 0");
        set(Encoder.getKey("polyToken"), _polyToken);
        set(Encoder.getKey("stLaunchFee"), _stLaunchFee);
        set(Encoder.getKey("tickerRegFee"), _tickerRegFee);
        set(Encoder.getKey("expiryLimit"), uint256(60 * 1 days));
        set(Encoder.getKey("paused"), false);
        set(Encoder.getKey("owner"), _owner);
        set(Encoder.getKey("polymathRegistry"), _polymathRegistry);
        _setProtocolVersion(_STFactory, uint8(0), uint8(0), uint8(2));
        set(Encoder.getKey("initialised"), true);
    }

    /////////////////////////////
    // Token Ticker Management
    /////////////////////////////

    /**
     * @notice Registers the token ticker to the selected owner
     * @notice Once the token ticker is registered to its owner then no other issuer can claim
     * @notice its ownership. If the ticker expires and its issuer hasn't used it, then someone else can take it.
     * @param _owner is address of the owner of the token
     * @param _ticker is unique token ticker
     * @param _tokenName is the name of the token
     */
    function registerTicker(address _owner, string _ticker, string _tokenName) external whenNotPausedOrOwner {
        require(_owner != address(0), "Owner should not be 0x");
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        // Attempt to charge the reg fee if it is > 0 POLY
        uint256 tickerFee = getTickerRegistrationFee();
        if (tickerFee > 0)
            require(IERC20(getAddress(Encoder.getKey("polyToken"))).transferFrom(msg.sender, address(this), tickerFee), "Insufficent allowance");
        string memory ticker = Util.upper(_ticker);
        require(_tickerAvailable(ticker), "Ticker is reserved");
        // Check whether ticker was previously registered (and expired)
        address previousOwner = _tickerOwner(ticker);
        if (previousOwner != address(0)) {
            _deleteTickerOwnership(previousOwner, ticker);
        }
        _addTicker(_owner, ticker, _tokenName, now, now.add(getExpiryLimit()), false, false, tickerFee);
    }

    /**
     * @notice Internal - Sets the details of the ticker
     */
    function _addTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _fee) internal {
        _setTickerOwnership(_owner, _ticker);
        _storeTickerDetails(_ticker, _owner, _registrationDate, _expiryDate, _tokenName, _status);
        emit RegisterTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate, _fromAdmin, _fee);
    }

    /**
     * @notice Modifies the ticker details. Only Polymath has the ability to do so.
     * @notice Only allowed to modify the tickers which are not yet deployed.
     * @param _owner is the owner of the token
     * @param _ticker is the token ticker
     * @param _tokenName is the name of the token
     * @param _registrationDate is the date at which ticker is registered
     * @param _expiryDate is the expiry date for the ticker
     * @param _status is the token deployment status
     */
    function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external onlyOwner {
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        require(_expiryDate != 0 && _registrationDate != 0, "Dates should not be 0");
        require(_registrationDate <= _expiryDate, "Registration date should < expiry date");
        require(_owner != address(0), "Invalid address");
        string memory ticker = Util.upper(_ticker);
        _modifyTicker(_owner, ticker, _tokenName, _registrationDate, _expiryDate, _status);
    }

    /**
     * @notice Internal -- Modifies the ticker details.
     */
    function _modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal {
        address currentOwner = _tickerOwner(_ticker);
        if (currentOwner != address(0)) {
            _deleteTickerOwnership(currentOwner, _ticker);
        }
        if (_tickerStatus(_ticker) && !_status) {
            set(Encoder.getKey("tickerToSecurityToken", _ticker), address(0));
        }
        // If status is true, there must be a security token linked to the ticker already
        if (_status) {
            require(getAddress(Encoder.getKey("tickerToSecurityToken", _ticker)) != address(0), "Token not registered");
        }
        _addTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate, _status, true, uint256(0));
    }

    function _tickerOwner(string _ticker) internal view returns(address) {
        return getAddress(Encoder.getKey("registeredTickers_owner", _ticker));
    }

    /**
     * @notice Removes the ticker details, associated ownership & security token mapping
     * @param _ticker is the token ticker
     */
    function removeTicker(string _ticker) external onlyOwner {
        string memory ticker = Util.upper(_ticker);
        address owner = _tickerOwner(ticker);
        require(owner != address(0), "Ticker doesn't exist");
        _deleteTickerOwnership(owner, ticker);
        set(Encoder.getKey("tickerToSecurityToken", ticker), address(0));
        _storeTickerDetails(ticker, address(0), 0, 0, "", false);
        emit TickerRemoved(ticker, now, msg.sender);
    }

    /**
     * @notice Internal - Checks if the entered ticker is registered and has not expired
     * @param _ticker is the token ticker
     * @return bool
     */
    function _tickerAvailable(string _ticker) internal view returns(bool) {
        if (_tickerOwner(_ticker) != address(0)) {
            if ((now > getUint(Encoder.getKey("registeredTickers_expiryDate", _ticker))) && !_tickerStatus(_ticker)) {
                return true;
            } else
                return false;
        }
        return true;
    }

    function _tickerStatus(string _ticker) internal view returns(bool) {
        return getBool(Encoder.getKey("registeredTickers_status", _ticker));
    }

    /**
     * @notice Internal - Sets the ticker owner
     * @param _owner is the address of the owner of the ticker
     * @param _ticker is the ticker symbol
     */
    function _setTickerOwnership(address _owner, string _ticker) internal {
        bytes32 _ownerKey = Encoder.getKey("userToTickers", _owner);
        uint256 length = uint256(getArrayBytes32(_ownerKey).length);
        pushArray(_ownerKey, Util.stringToBytes32(_ticker));
        set(Encoder.getKey("tickerIndex", _ticker), length);
        bytes32 seenKey = Encoder.getKey("seenUsers", _owner);
        if (!getBool(seenKey)) {
            pushArray(Encoder.getKey("activeUsers"), _owner);
            set(seenKey, true);
        }
    }

    /**
     * @notice Internal - Stores the ticker details
     */
    function _storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status) internal {
        bytes32 key = Encoder.getKey("registeredTickers_owner", _ticker);
        if (getAddress(key) != _owner)
            set(key, _owner);
        key = Encoder.getKey("registeredTickers_registrationDate", _ticker);
        if (getUint(key) != _registrationDate)
            set(key, _registrationDate);
        key = Encoder.getKey("registeredTickers_expiryDate", _ticker);
        if (getUint(key) != _expiryDate)
            set(key, _expiryDate);
        key = Encoder.getKey("registeredTickers_tokenName", _ticker);
        if (Encoder.getKey(getString(key)) != Encoder.getKey(_tokenName))
            set(key, _tokenName);
        key = Encoder.getKey("registeredTickers_status", _ticker);
        if (getBool(key) != _status)
            set(key, _status);
    }

    /**
     * @notice Transfers the ownership of the ticker
     * @param _newOwner is the address of the new owner of the ticker
     * @param _ticker is the ticker symbol
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external whenNotPausedOrOwner {
        string memory ticker = Util.upper(_ticker);
        require(_newOwner != address(0), "Invalid address");
        bytes32 ownerKey = Encoder.getKey("registeredTickers_owner", ticker);
        require(getAddress(ownerKey) == msg.sender, "Not authorised");
        if (_tickerStatus(ticker))
            require(IOwnable(getAddress(Encoder.getKey("tickerToSecurityToken", ticker))).owner() == _newOwner, "New owner does not match token owner");
        _deleteTickerOwnership(msg.sender, ticker);
        _setTickerOwnership(_newOwner, ticker);
        set(ownerKey, _newOwner);
        emit ChangeTickerOwnership(ticker, msg.sender, _newOwner);
    }

    /**
     * @notice Internal - Removes the owner of a ticker
     */
    function _deleteTickerOwnership(address _owner, string _ticker) internal {
        uint256 index = uint256(getUint(Encoder.getKey("tickerIndex", _ticker)));
        bytes32 ownerKey = Encoder.getKey("userToTickers", _owner);
        bytes32[] memory tickers = getArrayBytes32(ownerKey);
        assert(index < tickers.length);
        assert(_tickerOwner(_ticker) == _owner);
        deleteArrayBytes32(ownerKey, index);
        if (getArrayBytes32(ownerKey).length > index) {
            bytes32 switchedTicker = getArrayBytes32(ownerKey)[index];
            set(Encoder.getKey("tickerIndex", Util.bytes32ToString(switchedTicker)), index);
        }
    }

    /**
     * @notice Changes the expiry time for the token ticker. Only available to Polymath.
     * @param _newExpiry is the new expiry for newly generated tickers
     */
    function changeExpiryLimit(uint256 _newExpiry) external onlyOwner {
        require(_newExpiry >= 1 days, "Expiry should >= 1 day");
        bytes32 key = Encoder.getKey('expiryLimit');
        emit ChangeExpiryLimit(getUint(key), _newExpiry);
        set(key, _newExpiry);
    }

    /**
     * @notice Returns the list of tickers owned by the selected address
     * @param _owner is the address which owns the list of tickers
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[]) {
         uint counter = 0;
         // accessing the data structure userTotickers[_owner].length
         bytes32[] memory tickers = getArrayBytes32(Encoder.getKey("userToTickers", _owner));
         bytes32[] memory tempList = new bytes32[](tickers.length);
         for (uint i = 0; i < tickers.length; i++) {
             string memory ticker = Util.bytes32ToString(tickers[i]);
             if (getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)) >= now || _tickerStatus(ticker)) {
                 tempList[counter] = tickers[i];
                 counter ++;
             }
         }
        return tempList;
    }

    /**
     * @notice Returns the list of tokens owned by the selected address
     * @param _owner is the address which owns the list of tickers
     * @dev Intention is that this is called off-chain so block gas limit is not relevant
     */
    function getTokensByOwner(address _owner) external view returns(address[]) {
        // Loop over all active users, then all associated tickers of those users
        // This ensures we find tokens, even if their owner has been modified
        address[] memory activeUsers = getArrayAddress(Encoder.getKey("activeUsers"));
        bytes32[] memory tickers;
        address token;
        uint256 count = 0;
        uint256 i = 0;
        uint256 j = 0;
        for (i = 0; i < activeUsers.length; i++) {
            tickers = getArrayBytes32(Encoder.getKey("userToTickers", activeUsers[i]));
            for (j = 0; j < tickers.length; j++) {
                token = getAddress(Encoder.getKey("tickerToSecurityToken", Util.bytes32ToString(tickers[j])));
                if (token != address(0)) {
                    if (IOwnable(token).owner() == _owner) {
                        count = count + 1;
                    }
                }
            }
        }
        uint256 index = 0;
        address[] memory result = new address[](count);
        for (i = 0; i < activeUsers.length; i++) {
            tickers = getArrayBytes32(Encoder.getKey("userToTickers", activeUsers[i]));
            for (j = 0; j < tickers.length; j++) {
                token = getAddress(Encoder.getKey("tickerToSecurityToken", Util.bytes32ToString(tickers[j])));
                if (token != address(0)) {
                    if (IOwnable(token).owner() == _owner) {
                        result[index] = token;
                        index = index + 1;
                    }
                }
            }
        }
        return result;
    }

    /**
     * @notice Returns the owner and timestamp for a given ticker
     * @param _ticker is the ticker symbol
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string _ticker) external view returns (address, uint256, uint256, string, bool) {
        string memory ticker = Util.upper(_ticker);
        bool tickerStatus = _tickerStatus(ticker);
        uint256 expiryDate = getUint(Encoder.getKey("registeredTickers_expiryDate", ticker));
        if ((tickerStatus == true) || (expiryDate > now)) {
            return
            (
                _tickerOwner(ticker),
                getUint(Encoder.getKey("registeredTickers_registrationDate", ticker)),
                expiryDate,
                getString(Encoder.getKey("registeredTickers_tokenName", ticker)),
                tickerStatus
            );
        } else
            return (address(0), uint256(0), uint256(0), "", false);
    }

    /////////////////////////////
    // Security Token Management
    /////////////////////////////

    /**
     * @notice Deploys an instance of a new Security Token and records it to the registry
     * @param _name is the name of the token
     * @param _ticker is the ticker symbol of the security token
     * @param _tokenDetails is the off-chain details of the token
     * @param _divisible is whether or not the token is divisible
     */
    function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external whenNotPausedOrOwner {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "Ticker length > 0");
        string memory ticker = Util.upper(_ticker);
        bytes32 statusKey = Encoder.getKey("registeredTickers_status", ticker);
        require(!getBool(statusKey), "Already deployed");
        set(statusKey, true);
        require(_tickerOwner(ticker) == msg.sender, "Not authorised");
        require(getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)) >= now, "Ticker gets expired");

        uint256 launchFee = getSecurityTokenLaunchFee();
        if (launchFee > 0)
            require(IERC20(getAddress(Encoder.getKey("polyToken"))).transferFrom(msg.sender, address(this), launchFee), "Insufficient allowance");

        address newSecurityTokenAddress = ISTFactory(getSTFactoryAddress()).deployToken(
            _name,
            ticker,
            18,
            _tokenDetails,
            msg.sender,
            _divisible,
            getAddress(Encoder.getKey("polymathRegistry"))
        );

        _storeSecurityTokenData(newSecurityTokenAddress, ticker, _tokenDetails, now);
        set(Encoder.getKey("tickerToSecurityToken", ticker), newSecurityTokenAddress);
        emit NewSecurityToken(ticker, _name, newSecurityTokenAddress, msg.sender, now, msg.sender, false, launchFee);
    }

    /**
     * @notice Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)
     * @param _name is the name of the token
     * @param _ticker is the ticker symbol of the security token
     * @param _owner is the owner of the token
     * @param _securityToken is the address of the securityToken
     * @param _tokenDetails is the off-chain details of the token
     * @param _deployedAt is the timestamp at which the security token is deployed
     */
    function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external onlyOwner {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "String length > 0");
        require(bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        require(_deployedAt != 0 && _owner != address(0), "0 value params not allowed");
        string memory ticker = Util.upper(_ticker);
        require(_securityToken != address(0), "ST address is 0x");
        uint256 registrationTime = getUint(Encoder.getKey("registeredTickers_registrationDate", ticker));
        uint256 expiryTime = getUint(Encoder.getKey("registeredTickers_expiryDate", ticker));
        if (registrationTime == 0) {
            registrationTime = now;
            expiryTime = registrationTime.add(getExpiryLimit());
        }
        set(Encoder.getKey("tickerToSecurityToken", ticker), _securityToken);
        _modifyTicker(_owner, ticker, _name, registrationTime, expiryTime, true);
        _storeSecurityTokenData(_securityToken, ticker, _tokenDetails, _deployedAt);
        emit NewSecurityToken(ticker, _name, _securityToken, _owner, _deployedAt, msg.sender, true, getSecurityTokenLaunchFee());
    }

    /**
     * @notice Internal - Stores the security token details
     */
    function _storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt) internal {
        set(Encoder.getKey("securityTokens_ticker", _securityToken), _ticker);
        set(Encoder.getKey("securityTokens_tokenDetails", _securityToken), _tokenDetails);
        set(Encoder.getKey("securityTokens_deployedAt", _securityToken), _deployedAt);
    }

    /**
    * @notice Checks that Security Token is registered
    * @param _securityToken is the address of the security token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool) {
        return (keccak256(bytes(getString(Encoder.getKey("securityTokens_ticker", _securityToken)))) != keccak256(""));
    }

    /**
     * @notice Returns the security token address by ticker symbol
     * @param _ticker is the ticker of the security token
     * @return address
     */
    function getSecurityTokenAddress(string _ticker) external view returns (address) {
        string memory ticker = Util.upper(_ticker);
        return getAddress(Encoder.getKey("tickerToSecurityToken", ticker));
    }

     /**
     * @notice Returns the security token data by address
     * @param _securityToken is the address of the security token.
     * @return string is the ticker of the security Token.
     * @return address is the issuer of the security Token.
     * @return string is the details of the security token.
     * @return uint256 is the timestamp at which security Token was deployed.
     */
    function getSecurityTokenData(address _securityToken) external view returns (string, address, string, uint256) {
        return (
            getString(Encoder.getKey("securityTokens_ticker", _securityToken)),
            IOwnable(_securityToken).owner(),
            getString(Encoder.getKey("securityTokens_tokenDetails", _securityToken)),
            getUint(Encoder.getKey("securityTokens_deployedAt", _securityToken))
        );
    }

    /////////////////////////////
    // Ownership, lifecycle & Utility
    /////////////////////////////

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0));
        bytes32 key = Encoder.getKey("owner");
        emit OwnershipTransferred(getAddress(key), _newOwner);
        set(key, _newOwner);
    }

    /**
    * @notice called by the owner to pause, triggers stopped state
    */
    function pause() external whenNotPaused onlyOwner {
        set(Encoder.getKey("paused"), true);
        emit Pause(now);
    }

    /**
    * @notice called by the owner to unpause, returns to normal state
    */
    function unpause() external whenPaused onlyOwner {
        set(Encoder.getKey("paused"), false);
        emit Unpause(now);
    }

    /**
    * @notice Sets the ticker registration fee in POLY tokens. Only Polymath.
    * @param _tickerRegFee is the registration fee in POLY tokens (base 18 decimals)
    */
   function changeTickerRegistrationFee(uint256 _tickerRegFee) external onlyOwner {
        bytes32 key = Encoder.getKey('tickerRegFee');
        uint256 fee = getUint(key);
        require(fee != _tickerRegFee);
        emit ChangeTickerRegistrationFee(fee, _tickerRegFee);
        set(key, _tickerRegFee);
   }

   /**
    * @notice Sets the ticker registration fee in POLY tokens. Only Polymath.
    * @param _stLaunchFee is the registration fee in POLY tokens (base 18 decimals)
    */
   function changeSecurityLaunchFee(uint256 _stLaunchFee) external onlyOwner {
        bytes32 key = Encoder.getKey('stLaunchFee');
        uint256 fee = getUint(key);
        require(fee != _stLaunchFee);
        emit ChangeSecurityLaunchFee(fee, _stLaunchFee);
        set(key, _stLaunchFee);
   }

    /**
    * @notice Reclaims all ERC20Basic compatible tokens
    * @param _tokenContract is the address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance));
    }

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress is the address of the proxy.
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external onlyOwner {
        _setProtocolVersion(_STFactoryAddress, _major, _minor, _patch);
    }

    /**
    * @notice Internal - Changes the protocol version and the SecurityToken contract
    */
    function _setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) internal {
        uint8[] memory _version = new uint8[](3);
        _version[0] = _major;
        _version[1] = _minor;
        _version[2] = _patch;
        uint24 _packedVersion = VersionUtils.pack(_major, _minor, _patch);
        require(VersionUtils.isValidVersion(getProtocolVersion(), _version),"In-valid version");
        set(Encoder.getKey("latestVersion"), uint256(_packedVersion));
        set(Encoder.getKey("protocolVersionST", getUint(Encoder.getKey("latestVersion"))), _STFactoryAddress);
    }

    /**
     * @notice Returns the current STFactory Address
     */
    function getSTFactoryAddress() public view returns(address) {
        return getAddress(Encoder.getKey("protocolVersionST", getUint(Encoder.getKey("latestVersion"))));
    }

    /**
     * @notice get Protocol version
     */
    function getProtocolVersion() public view returns(uint8[]) {
        return VersionUtils.unpack(uint24(getUint(Encoder.getKey("latestVersion"))));
    }

    /**
     * @notice Changes the PolyToken address. Only Polymath.
     * @param _newAddress is the address of the polytoken.
     */
    function updatePolyTokenAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0));
        set(Encoder.getKey("polyToken"), _newAddress);
    }

    /**
     * @notice Gets the security token launch fee
     * @return Fee amount
     */
    function getSecurityTokenLaunchFee() public view returns(uint256) {
        return getUint(Encoder.getKey("stLaunchFee"));
    }

    /**
     * @notice Gets the ticker registration fee
     * @return Fee amount
     */
    function getTickerRegistrationFee() public view returns(uint256) {
        return getUint(Encoder.getKey("tickerRegFee"));
    }

    /**
     * @notice Gets the expiry limit
     * @return Expiry limit
     */
    function getExpiryLimit() public view returns(uint256) {
        return getUint(Encoder.getKey("expiryLimit"));
    }

    /**
     * @notice Check whether the registry is paused or not
     * @return bool
     */
    function isPaused() public view returns(bool) {
        return getBool(Encoder.getKey("paused"));
    }

    /**
     * @notice Gets the owner of the contract
     * @return address owner
     */
    function owner() public view returns(address) {
        return getAddress(Encoder.getKey("owner"));
    }

}
