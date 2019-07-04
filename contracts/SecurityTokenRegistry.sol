/**
    //
        IMPORTANT: Developer should update the ISecurityTokenRegistry.sol (Interface) if there is any change in
        function signature or addition/removal of the functions from SecurityTokenRegistry & STRGetter contract.
    //

 */

pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOwnable.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/ISecurityToken.sol";
import "./interfaces/IPolymathRegistry.sol";
import "./interfaces/IOracle.sol";
import "./storage/EternalStorage.sol";
import "./libraries/Util.sol";
import "./libraries/Encoder.sol";
import "./libraries/VersionUtils.sol";
import "./libraries/DecimalMath.sol";
import "./proxy/Proxy.sol";

/**
 * @title Registry contract for issuers to register their tickers and security tokens
 */
contract SecurityTokenRegistry is EternalStorage, Proxy {

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
           string tokenName; //Not stored since 3.0.0
           bool status;
       }

       struct SecurityTokenData {
           string ticker;
           string tokenDetails;
           uint256 deployedAt;
       }

     */

    using SafeMath for uint256;

    bytes32 constant INITIALIZE = 0x9ef7257c3339b099aacf96e55122ee78fb65a36bd2a6c19249882be9c98633bf; //keccak256("initialised")
    bytes32 constant POLYTOKEN = 0xacf8fbd51bb4b83ba426cdb12f63be74db97c412515797993d2a385542e311d7; //keccak256("polyToken")
    bytes32 constant STLAUNCHFEE = 0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2; //keccak256("stLaunchFee")
    bytes32 constant TICKERREGFEE = 0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2; //keccak256("tickerRegFee")
    bytes32 constant EXPIRYLIMIT = 0x604268e9a73dfd777dcecb8a614493dd65c638bad2f5e7d709d378bd2fb0baee; //keccak256("expiryLimit")
    bytes32 constant PAUSED = 0xee35723ac350a69d2a92d3703f17439cbaadf2f093a21ba5bf5f1a53eb2a14d9; //keccak256("paused")
    bytes32 constant OWNER = 0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040c0; //keccak256("owner")
    bytes32 constant POLYMATHREGISTRY = 0x90eeab7c36075577c7cc5ff366e389fefa8a18289b949bab3529ab4471139d4d; //keccak256("polymathRegistry")
    bytes32 constant STRGETTER = 0x982f24b3bd80807ec3cb227ba152e15c07d66855fa8ae6ca536e689205c0e2e9; //keccak256("STRGetter")
    bytes32 constant IS_FEE_IN_POLY = 0x7152e5426955da44af11ecd67fec5e2a3ba747be974678842afa9394b9a075b6; //keccak256("IS_FEE_IN_POLY")
    bytes32 constant ACTIVE_USERS = 0x425619ce6ba8e9f80f17c0ef298b6557e321d70d7aeff2e74dd157bd87177a9e; //keccak256("activeUsers")
    bytes32 constant LATEST_VERSION = 0x4c63b69b9117452b9f11af62077d0cda875fb4e2dbe07ad6f31f728de6926230; //keccak256("latestVersion")

    string constant POLY_ORACLE = "StablePolyUsdOracle";

    // Emit when network becomes paused
    event Pause(address account);
    // Emit when network becomes unpaused
    event Unpause(address account);
    // Emit when the ticker is removed from the registry
    event TickerRemoved(string _ticker, address _removedBy);
    // Emit when the token ticker expiry is changed
    event ChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);
    // Emit when changeSecurityLaunchFee is called
    event ChangeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee);
    // Emit when changeTickerRegistrationFee is called
    event ChangeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee);
    // Emit when Fee currency is changed
    event ChangeFeeCurrency(bool _isFeeInPoly);
    // Emit when ownership gets transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // Emit when ownership of the ticker gets changed
    event ChangeTickerOwnership(string _ticker, address indexed _oldOwner, address indexed _newOwner);
    // Emit at the time of launching a new security token of version 3.0+
    event NewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant,
        bool _fromAdmin,
        uint256 _usdFee,
        uint256 _polyFee,
        uint256 _protocolVersion
    );
    // Emit at the time of launching a new security token v2.0.
    // _registrationFee is in poly
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
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate,
        bool _fromAdmin,
        uint256 _registrationFeePoly,
        uint256 _registrationFeeUsd
    );
    // For backwards compatibility
    event RegisterTicker(
        address indexed _owner,
        string _ticker,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate,
        bool _fromAdmin,
        uint256 _registrationFee
    );
    // Emit at when issuer refreshes exisiting token
    event SecurityTokenRefreshed(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant,
        uint256 _protocolVersion
    );
    event ProtocolFactorySet(address indexed _STFactory, uint8 _major, uint8 _minor, uint8 _patch);
    event LatestVersionSet(uint8 _major, uint8 _minor, uint8 _patch);
    event ProtocolFactoryRemoved(address indexed _STFactory, uint8 _major, uint8 _minor, uint8 _patch);
    /////////////////////////////
    // Modifiers
    /////////////////////////////

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner(), "Only owner");
    }

    modifier onlyOwnerOrSelf() {
        require(msg.sender == owner() || msg.sender == address(this), "Only owner or self");
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPausedOrOwner() {
        _whenNotPausedOrOwner();
        _;
    }

    function _whenNotPausedOrOwner() internal view {
        if (msg.sender != owner()) {
            require(!isPaused(), "Paused");
        }
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.
     */
    modifier whenNotPaused() {
        require(!isPaused(), "Paused");
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(isPaused(), "Not paused");
        _;
    }

    /////////////////////////////
    // Initialization
    /////////////////////////////

    // Constructor
    constructor() public {
        set(INITIALIZE, true);
    }

    /**
     * @notice Initializes instance of STR
     * @param _polymathRegistry is the address of the Polymath Registry
     * @param _stLaunchFee is the fee in USD required to launch a token
     * @param _tickerRegFee is the fee in USD required to register a ticker
     * @param _owner is the owner of the STR,
     * @param _getterContract Contract address of the contract which consists getter functions.
     */
    function initialize(
        address _polymathRegistry,
        uint256 _stLaunchFee,
        uint256 _tickerRegFee,
        address _owner,
        address _getterContract
    )
        public
    {
        require(!getBoolValue(INITIALIZE),"Initialized");
        require(
            _owner != address(0) && _polymathRegistry != address(0) && _getterContract != address(0),
            "Invalid address"
        );
        set(STLAUNCHFEE, _stLaunchFee);
        set(TICKERREGFEE, _tickerRegFee);
        set(EXPIRYLIMIT, uint256(60 * 1 days));
        set(PAUSED, false);
        set(OWNER, _owner);
        set(POLYMATHREGISTRY, _polymathRegistry);
        set(INITIALIZE, true);
        set(STRGETTER, _getterContract);
        _updateFromRegistry();
    }

    /**
     * @notice Used to update the polyToken contract address
     */
    function updateFromRegistry() external onlyOwner {
        _updateFromRegistry();
    }

    function _updateFromRegistry() internal {
        address polymathRegistry = getAddressValue(POLYMATHREGISTRY);
        set(POLYTOKEN, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"));
    }

    /**
     * @notice Converts USD fees into POLY amounts
     */
    function _takeFee(bytes32 _feeType) internal returns (uint256, uint256) {
        (uint256 usdFee, uint256 polyFee) = getFees(_feeType);
        if (polyFee > 0)
            require(IERC20(getAddressValue(POLYTOKEN)).transferFrom(msg.sender, address(this), polyFee), "Insufficent allowance");
        return (usdFee, polyFee);
    }

    /**
     * @notice Returns the usd & poly fee for a particular feetype
     * @param _feeType Key corresponding to fee type
     */
    function getFees(bytes32 _feeType) public returns (uint256 usdFee, uint256 polyFee) {
        bool isFeesInPoly = getBoolValue(IS_FEE_IN_POLY);
        uint256 rawFee = getUintValue(_feeType);
        address polymathRegistry = getAddressValue(POLYMATHREGISTRY);
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        if (!isFeesInPoly) { //Fee is in USD and not poly
            usdFee = rawFee;
            polyFee = DecimalMath.div(rawFee, polyRate);
        } else {
            usdFee = DecimalMath.mul(rawFee, polyRate);
            polyFee = rawFee;
        }
    }

    /**
     * @notice Gets the security token launch fee
     * @return Fee amount
     */
    function getSecurityTokenLaunchFee() public returns(uint256 polyFee) {
        (, polyFee) = getFees(STLAUNCHFEE);
    }

    /**
     * @notice Gets the ticker registration fee
     * @return Fee amount
     */
    function getTickerRegistrationFee() public returns(uint256 polyFee) {
        (, polyFee) = getFees(TICKERREGFEE);
    }

    /**
     * @notice Set the getter contract address
     * @param _getterContract Address of the contract
     */
    function setGetterRegistry(address _getterContract) public onlyOwnerOrSelf {
        require(_getterContract != address(0));
        set(STRGETTER, _getterContract);
    }

    function _implementation() internal view returns(address) {
        return getAddressValue(STRGETTER);
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
     */
    function registerNewTicker(address _owner, string memory _ticker) public whenNotPausedOrOwner {
        require(_owner != address(0), "Bad address");
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Bad ticker");
        // Attempt to charge the reg fee if it is > 0 USD
        (uint256 usdFee, uint256 polyFee) = _takeFee(TICKERREGFEE);
        string memory ticker = Util.upper(_ticker);
        require(tickerAvailable(ticker), "Ticker reserved");
        // Check whether ticker was previously registered (and expired)
        address previousOwner = _tickerOwner(ticker);
        if (previousOwner != address(0)) {
            _deleteTickerOwnership(previousOwner, ticker);
        }
        /*solium-disable-next-line security/no-block-members*/
        _addTicker(_owner, ticker, now, now.add(getUintValue(EXPIRYLIMIT)), false, false, polyFee, usdFee);
    }

    /**
     * @dev This function is just for backwards compatibility
     */
    function registerTicker(address _owner, string calldata _ticker, string calldata _tokenName) external {
        registerNewTicker(_owner, _ticker);
        (, uint256 polyFee) = getFees(TICKERREGFEE);
        emit RegisterTicker(_owner, _ticker, _tokenName, now, now.add(getUintValue(EXPIRYLIMIT)), false, polyFee);
    }

    /**
     * @notice Internal - Sets the details of the ticker
     */
    function _addTicker(
        address _owner,
        string memory _ticker,
        uint256 _registrationDate,
        uint256 _expiryDate,
        bool _status,
        bool _fromAdmin,
        uint256 _polyFee,
        uint256 _usdFee
    )
        internal
    {
        _setTickerOwnership(_owner, _ticker);
        _storeTickerDetails(_ticker, _owner, _registrationDate, _expiryDate, _status);
        emit RegisterTicker(_owner, _ticker, _registrationDate, _expiryDate, _fromAdmin, _polyFee, _usdFee);
    }

    /**
     * @notice Modifies the ticker details. Only Polymath has the ability to do so.
     * @notice Only allowed to modify the tickers which are not yet deployed.
     * @param _owner is the owner of the token
     * @param _ticker is the token ticker
     * @param _registrationDate is the date at which ticker is registered
     * @param _expiryDate is the expiry date for the ticker
     * @param _status is the token deployment status
     */
    function modifyExistingTicker(
        address _owner,
        string memory _ticker,
        uint256 _registrationDate,
        uint256 _expiryDate,
        bool _status
    )
        public
        onlyOwner
    {
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Bad ticker");
        require(_expiryDate != 0 && _registrationDate != 0, "Bad dates");
        require(_registrationDate <= _expiryDate, "Bad dates");
        require(_owner != address(0), "Bad address");
        string memory ticker = Util.upper(_ticker);
        _modifyTicker(_owner, ticker, _registrationDate, _expiryDate, _status);
    }

    /**
     * @dev This function is just for backwards compatibility
     */
    function modifyTicker(
        address _owner,
        string calldata _ticker,
        string calldata _tokenName,
        uint256 _registrationDate,
        uint256 _expiryDate,
        bool _status
    )
        external
    {
        modifyExistingTicker(_owner, _ticker, _registrationDate, _expiryDate, _status);
        emit RegisterTicker(_owner, _ticker, _tokenName, now, now.add(getUintValue(EXPIRYLIMIT)), false, 0);
    }

    /**
     * @notice Internal -- Modifies the ticker details.
     */
    function _modifyTicker(
        address _owner,
        string memory _ticker,
        uint256 _registrationDate,
        uint256 _expiryDate,
        bool _status
    )
        internal
    {
        address currentOwner = _tickerOwner(_ticker);
        if (currentOwner != address(0)) {
            _deleteTickerOwnership(currentOwner, _ticker);
        }
        if (_tickerStatus(_ticker) && !_status) {
            set(Encoder.getKey("tickerToSecurityToken", _ticker), address(0));
        }
        // If status is true, there must be a security token linked to the ticker already
        if (_status) {
            require(getAddressValue(Encoder.getKey("tickerToSecurityToken", _ticker)) != address(0), "Not registered");
        }
        _addTicker(_owner, _ticker, _registrationDate, _expiryDate, _status, true, uint256(0), uint256(0));
    }

    function _tickerOwner(string memory _ticker) internal view returns(address) {
        return getAddressValue(Encoder.getKey("registeredTickers_owner", _ticker));
    }

    /**
     * @notice Removes the ticker details, associated ownership & security token mapping
     * @param _ticker is the token ticker
     */
    function removeTicker(string memory _ticker) public onlyOwner {
        string memory ticker = Util.upper(_ticker);
        address owner = _tickerOwner(ticker);
        require(owner != address(0), "Bad ticker");
        _deleteTickerOwnership(owner, ticker);
        set(Encoder.getKey("tickerToSecurityToken", ticker), address(0));
        _storeTickerDetails(ticker, address(0), 0, 0, false);
        /*solium-disable-next-line security/no-block-members*/
        emit TickerRemoved(ticker, msg.sender);
    }

    /**
     * @notice Checks if the entered ticker is registered and has not expired
     * @param _ticker is the token ticker
     * @return bool
     */
    function tickerAvailable(string memory _ticker) public view returns(bool) {
        if (_tickerOwner(_ticker) != address(0)) {
            /*solium-disable-next-line security/no-block-members*/
            if ((now > getUintValue(Encoder.getKey("registeredTickers_expiryDate", _ticker))) && !_tickerStatus(_ticker)) {
                return true;
            } else return false;
        }
        return true;
    }

    function _tickerStatus(string memory _ticker) internal view returns(bool) {
        return getBoolValue(Encoder.getKey("registeredTickers_status", _ticker));
    }

    /**
     * @notice Internal - Sets the ticker owner
     * @param _owner is the address of the owner of the ticker
     * @param _ticker is the ticker symbol
     */
    function _setTickerOwnership(address _owner, string memory _ticker) internal {
        bytes32 _ownerKey = Encoder.getKey("userToTickers", _owner);
        uint256 length = uint256(getArrayBytes32(_ownerKey).length);
        pushArray(_ownerKey, Util.stringToBytes32(_ticker));
        set(Encoder.getKey("tickerIndex", _ticker), length);
        bytes32 seenKey = Encoder.getKey("seenUsers", _owner);
        if (!getBoolValue(seenKey)) {
            pushArray(ACTIVE_USERS, _owner);
            set(seenKey, true);
        }
    }

    /**
     * @notice Internal - Stores the ticker details
     */
    function _storeTickerDetails(
        string memory _ticker,
        address _owner,
        uint256 _registrationDate,
        uint256 _expiryDate,
        bool _status
    )
        internal
    {
        bytes32 key = Encoder.getKey("registeredTickers_owner", _ticker);
        set(key, _owner);
        key = Encoder.getKey("registeredTickers_registrationDate", _ticker);
        set(key, _registrationDate);
        key = Encoder.getKey("registeredTickers_expiryDate", _ticker);
        set(key, _expiryDate);
        key = Encoder.getKey("registeredTickers_status", _ticker);
        set(key, _status);
    }

    /**
     * @notice Transfers the ownership of the ticker
     * @param _newOwner is the address of the new owner of the ticker
     * @param _ticker is the ticker symbol
     */
    function transferTickerOwnership(address _newOwner, string memory _ticker) public whenNotPausedOrOwner {
        string memory ticker = Util.upper(_ticker);
        require(_newOwner != address(0), "Bad address");
        bytes32 ownerKey = Encoder.getKey("registeredTickers_owner", ticker);
        require(getAddressValue(ownerKey) == msg.sender, "Only owner");
        if (_tickerStatus(ticker)) require(
            IOwnable(getAddressValue(Encoder.getKey("tickerToSecurityToken", ticker))).owner() == _newOwner,
            "Owner mismatch"
        );
        _deleteTickerOwnership(msg.sender, ticker);
        _setTickerOwnership(_newOwner, ticker);
        set(ownerKey, _newOwner);
        emit ChangeTickerOwnership(ticker, msg.sender, _newOwner);
    }

    /**
     * @notice Internal - Removes the owner of a ticker
     */
    function _deleteTickerOwnership(address _owner, string memory _ticker) internal {
        uint256 index = uint256(getUintValue(Encoder.getKey("tickerIndex", _ticker)));
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
    function changeExpiryLimit(uint256 _newExpiry) public onlyOwner {
        require(_newExpiry >= 1 days, "Bad dates");
        emit ChangeExpiryLimit(getUintValue(EXPIRYLIMIT), _newExpiry);
        set(EXPIRYLIMIT, _newExpiry);
    }

    /////////////////////////////
    // Security Token Management
    /////////////////////////////

    /**
     * @notice Deploys an instance of a new Security Token of version 2.0 and records it to the registry
     * @dev this function is for backwards compatibilty with 2.0 dApp.
     * @param _name is the name of the token
     * @param _ticker is the ticker symbol of the security token
     * @param _tokenDetails is the off-chain details of the token
     * @param _divisible is whether or not the token is divisible
     */
    function generateSecurityToken(
        string calldata _name,
        string calldata _ticker,
        string calldata _tokenDetails,
        bool _divisible
    )
        external
    {
        generateNewSecurityToken(_name, _ticker, _tokenDetails, _divisible, msg.sender, VersionUtils.pack(2, 0, 0));
    }

    /**
     * @notice Deploys an instance of a new Security Token and records it to the registry
     * @param _name is the name of the token
     * @param _ticker is the ticker symbol of the security token
     * @param _tokenDetails is the off-chain details of the token
     * @param _divisible is whether or not the token is divisible
     * @param _treasuryWallet Ethereum address which will holds the STs.
     * @param _protocolVersion Version of securityToken contract
     * - `_protocolVersion` is the packed value of uin8[3] array (it will be calculated offchain)
     * - if _protocolVersion == 0 then latest version of securityToken will be generated
     */
    function generateNewSecurityToken(
        string memory _name,
        string memory _ticker,
        string memory _tokenDetails,
        bool _divisible,
        address _treasuryWallet,
        uint256 _protocolVersion
    )
        public
        whenNotPausedOrOwner
    {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "Bad ticker");
        require(_treasuryWallet != address(0), "0x0 not allowed");
        if (_protocolVersion == 0) {
            _protocolVersion = getUintValue(LATEST_VERSION);
        }
        _ticker = Util.upper(_ticker);
        bytes32 statusKey = Encoder.getKey("registeredTickers_status", _ticker);
        require(!getBoolValue(statusKey), "Already deployed");
        set(statusKey, true);
        address issuer = msg.sender;
        require(_tickerOwner(_ticker) == issuer, "Not authorised");
        /*solium-disable-next-line security/no-block-members*/
        require(getUintValue(Encoder.getKey("registeredTickers_expiryDate", _ticker)) >= now, "Ticker expired");
        (uint256 _usdFee, uint256 _polyFee) = _takeFee(STLAUNCHFEE);
        address newSecurityTokenAddress =
            _deployToken(_name, _ticker, _tokenDetails, issuer, _divisible, _treasuryWallet, _protocolVersion);
        if (_protocolVersion == VersionUtils.pack(2, 0, 0)) {
            // For backwards compatibilty. Should be removed with an update when we disable st 2.0 generation.
            emit NewSecurityToken(
                _ticker, _name, newSecurityTokenAddress, issuer, now, issuer, false, _polyFee
            );
        } else {
            emit NewSecurityToken(
                _ticker, _name, newSecurityTokenAddress, issuer, now, issuer, false, _usdFee, _polyFee, _protocolVersion
            );
        }
    }

    /**
     * @notice Deploys an instance of a new Security Token and replaces the old one in the registry
     * This can be used to upgrade from version 2.0 of ST to 3.0 or in case something goes wrong with earlier ST
     * @dev This function needs to be in STR 3.0. Defined public to avoid stack overflow
     * @param _name is the name of the token
     * @param _ticker is the ticker symbol of the security token
     * @param _tokenDetails is the off-chain details of the token
     * @param _divisible is whether or not the token is divisible
     */
    function refreshSecurityToken(
        string memory _name,
        string memory _ticker,
        string memory _tokenDetails,
        bool _divisible,
        address _treasuryWallet
    )
        public whenNotPausedOrOwner returns (address)
    {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "Bad ticker");
        require(_treasuryWallet != address(0), "0x0 not allowed");
        string memory ticker = Util.upper(_ticker);
        require(_tickerStatus(ticker), "not deployed");
        address st = getAddressValue(Encoder.getKey("tickerToSecurityToken", ticker));
        address stOwner = IOwnable(st).owner();
        require(msg.sender == stOwner, "Unauthroized");
        require(ISecurityToken(st).transfersFrozen(), "Transfers not frozen");
        uint256 protocolVersion = getUintValue(LATEST_VERSION);
        address newSecurityTokenAddress =
            _deployToken(_name, ticker, _tokenDetails, stOwner, _divisible, _treasuryWallet, protocolVersion);
        emit SecurityTokenRefreshed(
            _ticker, _name, newSecurityTokenAddress, stOwner, now, stOwner, protocolVersion
        );
    }

    function _deployToken(
        string memory _name,
        string memory _ticker,
        string memory _tokenDetails,
        address _issuer,
        bool _divisible,
        address _wallet,
        uint256 _protocolVersion
    )
        internal
        returns(address newSecurityTokenAddress)
    {
        // In v2.x of STFactory, the final argument to deployToken is the PolymathRegistry.
        // In v3.x of STFactory, the final argument to deployToken is the Treasury wallet.
        uint8[] memory upperLimit = new uint8[](3);
        upperLimit[0] = 2;
        upperLimit[1] = 99;
        upperLimit[2] = 99;
        if (VersionUtils.lessThanOrEqual(VersionUtils.unpack(uint24(_protocolVersion)), upperLimit)) {
            _wallet = getAddressValue(POLYMATHREGISTRY);
        }

        newSecurityTokenAddress = ISTFactory(getAddressValue(Encoder.getKey("protocolVersionST", _protocolVersion))).deployToken(
            _name,
            _ticker,
            18,
            _tokenDetails,
            _issuer,
            _divisible,
            _wallet
        );

        /*solium-disable-next-line security/no-block-members*/
        _storeSecurityTokenData(newSecurityTokenAddress, _ticker, _tokenDetails, now);
        set(Encoder.getKey("tickerToSecurityToken", _ticker), newSecurityTokenAddress);
    }

    /**
     * @notice Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)
     * @param _ticker is the ticker symbol of the security token
     * @param _owner is the owner of the token
     * @param _securityToken is the address of the securityToken
     * @param _tokenDetails is the off-chain details of the token
     * @param _deployedAt is the timestamp at which the security token is deployed
     */
    function modifyExistingSecurityToken(
        string memory _ticker,
        address _owner,
        address _securityToken,
        string memory _tokenDetails,
        uint256 _deployedAt
    )
        public
        onlyOwner
    {
        require(bytes(_ticker).length <= 10, "Bad ticker");
        require(_deployedAt != 0 && _owner != address(0), "Bad data");
        string memory ticker = Util.upper(_ticker);
        require(_securityToken != address(0), "Bad address");
        uint256 registrationTime = getUintValue(Encoder.getKey("registeredTickers_registrationDate", ticker));
        uint256 expiryTime = getUintValue(Encoder.getKey("registeredTickers_expiryDate", ticker));
        if (registrationTime == 0) {
            /*solium-disable-next-line security/no-block-members*/
            registrationTime = now;
            expiryTime = registrationTime.add(getUintValue(EXPIRYLIMIT));
        }
        set(Encoder.getKey("tickerToSecurityToken", ticker), _securityToken);
        _modifyTicker(_owner, ticker, registrationTime, expiryTime, true);
        _storeSecurityTokenData(_securityToken, ticker, _tokenDetails, _deployedAt);
        emit NewSecurityToken(
            ticker, ISecurityToken(_securityToken).name(), _securityToken, _owner, _deployedAt, msg.sender, true, uint256(0), uint256(0), 0
        );
    }

    /**
     * @dev This function is just for backwards compatibility
     */
    function modifySecurityToken(
        string calldata /* */,
        string calldata _ticker,
        address _owner,
        address _securityToken,
        string calldata _tokenDetails,
        uint256 _deployedAt
    )
        external
    {
        modifyExistingSecurityToken(_ticker, _owner, _securityToken, _tokenDetails, _deployedAt);
    }

    /**
     * @notice Internal - Stores the security token details
     */
    function _storeSecurityTokenData(
        address _securityToken,
        string memory _ticker,
        string memory _tokenDetails,
        uint256 _deployedAt
    ) internal {
        set(Encoder.getKey("securityTokens_ticker", _securityToken), _ticker);
        set(Encoder.getKey("securityTokens_tokenDetails", _securityToken), _tokenDetails);
        set(Encoder.getKey("securityTokens_deployedAt", _securityToken), _deployedAt);
    }

    /**
    * @notice Checks that Security Token is registered
    * @param _securityToken is the address of the security token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns(bool) {
        return (keccak256(bytes(getStringValue(Encoder.getKey("securityTokens_ticker", _securityToken)))) != keccak256(""));
    }

    /////////////////////////////
    // Ownership, lifecycle & Utility
    /////////////////////////////

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Bad address");
        emit OwnershipTransferred(getAddressValue(OWNER), _newOwner);
        set(OWNER, _newOwner);
    }

    /**
    * @notice Called by the owner to pause, triggers stopped state
    */
    function pause() external whenNotPaused onlyOwner {
        set(PAUSED, true);
        /*solium-disable-next-line security/no-block-members*/
        emit Pause(msg.sender);
    }

    /**
    * @notice Called by the owner to unpause, returns to normal state
    */
    function unpause() external whenPaused onlyOwner {
        set(PAUSED, false);
        /*solium-disable-next-line security/no-block-members*/
        emit Unpause(msg.sender);
    }

    /**
    * @notice Sets the ticker registration fee in USD tokens. Only Polymath.
    * @param _tickerRegFee is the registration fee in USD tokens (base 18 decimals)
    */
    function changeTickerRegistrationFee(uint256 _tickerRegFee) public onlyOwner {
        uint256 fee = getUintValue(TICKERREGFEE);
        require(fee != _tickerRegFee, "Bad fee");
        _changeTickerRegistrationFee(fee, _tickerRegFee);
    }

    function _changeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee) internal {
        emit ChangeTickerRegistrationFee(_oldFee, _newFee);
        set(TICKERREGFEE, _newFee);
    }

    /**
    * @notice Sets the ticker registration fee in USD tokens. Only Polymath.
    * @param _stLaunchFee is the registration fee in USD tokens (base 18 decimals)
    */
    function changeSecurityLaunchFee(uint256 _stLaunchFee) public onlyOwner {
        uint256 fee = getUintValue(STLAUNCHFEE);
        require(fee != _stLaunchFee, "Bad fee");
        _changeSecurityLaunchFee(fee, _stLaunchFee);
    }

    function _changeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee) internal {
        emit ChangeSecurityLaunchFee(_oldFee, _newFee);
        set(STLAUNCHFEE, _newFee);
    }

    /**
    * @notice Sets the ticker registration and ST launch fee amount and currency
    * @param _tickerRegFee is the ticker registration fee (base 18 decimals)
    * @param _stLaunchFee is the st generation fee (base 18 decimals)
    * @param _isFeeInPoly defines if the fee is in poly or usd
    */
    function changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly) public onlyOwner {
        uint256 tickerFee = getUintValue(TICKERREGFEE);
        uint256 stFee = getUintValue(STLAUNCHFEE);
        bool isOldFeesInPoly = getBoolValue(IS_FEE_IN_POLY);
        require(isOldFeesInPoly != _isFeeInPoly, "Currency unchanged");
        _changeTickerRegistrationFee(tickerFee, _tickerRegFee);
        _changeSecurityLaunchFee(stFee, _stLaunchFee);
        emit ChangeFeeCurrency(_isFeeInPoly);
        set(IS_FEE_IN_POLY, _isFeeInPoly);
    }

    /**
    * @notice Reclaims all ERC20Basic compatible tokens
    * @param _tokenContract is the address of the token contract
    */
    function reclaimERC20(address _tokenContract) public onlyOwner {
        require(_tokenContract != address(0), "Bad address");
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Transfer failed");
    }

    /**
    * @notice Changes the SecurityToken contract for a particular factory version
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress is the address of the proxy.
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) public onlyOwner {
        _setProtocolFactory(_STFactoryAddress, _major, _minor, _patch);
    }

    function _setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) internal {
        require(_STFactoryAddress != address(0), "Bad address");
        uint24 _packedVersion = VersionUtils.pack(_major, _minor, _patch);
        address stFactoryAddress = getAddressValue(Encoder.getKey("protocolVersionST", uint256(_packedVersion)));
        require(stFactoryAddress == address(0), "Already exists");
        set(Encoder.getKey("protocolVersionST", uint256(_packedVersion)), _STFactoryAddress);
        emit ProtocolFactorySet(_STFactoryAddress, _major, _minor, _patch);
    }

    /**
    * @notice Removes a STFactory
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch) public onlyOwner {
        uint24 _packedVersion = VersionUtils.pack(_major, _minor, _patch);
        require(getUintValue(LATEST_VERSION) != _packedVersion, "Cannot remove latestVersion");
        emit ProtocolFactoryRemoved(getAddressValue(Encoder.getKey("protocolVersionST", _packedVersion)), _major, _minor, _patch);
        set(Encoder.getKey("protocolVersionST", uint256(_packedVersion)), address(0));
    }

    /**
    * @notice Changes the default protocol version
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) public onlyOwner {
        _setLatestVersion(_major, _minor, _patch);
    }

    function _setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) internal {
        uint24 _packedVersion = VersionUtils.pack(_major, _minor, _patch);
        require(getAddressValue(Encoder.getKey("protocolVersionST", _packedVersion)) != address(0), "No factory");
        set(LATEST_VERSION, uint256(_packedVersion));
        emit LatestVersionSet(_major, _minor, _patch);
    }

    /**
     * @notice Changes the PolyToken address. Only Polymath.
     * @param _newAddress is the address of the polytoken.
     */
    function updatePolyTokenAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Bad address");
        set(POLYTOKEN, _newAddress);
    }

    /**
     * @notice Check whether the registry is paused or not
     * @return bool
     */
    function isPaused() public view returns(bool) {
        return getBoolValue(PAUSED);
    }

    /**
     * @notice Gets the owner of the contract
     * @return address owner
     */
    function owner() public view returns(address) {
        return getAddressValue(OWNER);
    }
}
