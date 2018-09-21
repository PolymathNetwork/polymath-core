pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/IOwner.sol";
import "./interfaces/ISTFactory.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/ISecurityTokenRegistry.sol";
import "./storage/EternalStorage.sol";
import "./libraries/Util.sol";
import "./libraries/Encoder.sol";
import "./libraries/VersionUtils.sol";

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
       uint256 public latestProtocolVersion;
       bool public paused;
       address public owner;
       address public polymathRegistry;

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

    // Emit when ecosystem get paused
    event Pause(uint256 _timestammp);
     // Emit when ecosystem get unpaused
    event Unpause(uint256 _timestamp);
    // Emit when the ticker is removed from the registry
    event TickerRemoved(string _ticker, uint256 _removedAt, address _removedBy);
    // Emit when the token ticker expiry get changed
    event ChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);
     // Emit when changeSecurityLaunchFee is called
    event ChangeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee);
    // Emit when changeTickerRegistrationFee is called
    event ChangeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee);
    // Emit when ownership get transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // Emit when ownership of the ticker get changed
    event ChangeTickerOwnership(string _ticker, address indexed _oldOwner, address indexed _newOwner);
    // Emit when a ticker details get modified
    event ModifyTickerDetails(address _owner, string _ticker, string _name, uint256 _registrationDate, uint256 _expiryDate, bool _status);
    // Emit at the time of launching of new security token
    event NewSecurityToken(
        string _ticker,
        string _name,
        address indexed _securityTokenAddress,
        address indexed _owner,
        uint256 _addedAt,
        address _registrant,
        bool _fromAdmin
    );
    // Emit after the ticker registration
    event RegisterTicker(
        address indexed _owner,
        string _ticker,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate,
        bool _fromAdmin
    );

    /////////////////////////////
    // Initialization
    /////////////////////////////

    // Constructor
    constructor () public
    {

    }

    function initialize(address _polymathRegistry, address _STFactory, uint256 _stLaunchFee, uint256 _tickerRegFee, address _polyToken, address _owner) payable public {
        require(!getBool(Encoder.getKey("initialised")));
        require(_STFactory != address(0) && _polyToken != address(0) && _owner != address(0) && _polymathRegistry != address(0), "0x address is in-valid");
        require(_stLaunchFee != 0 && _tickerRegFee != 0, "Fees should not be 0");
        // address polyToken = _polyToken;
        set(Encoder.getKey("polyToken"), _polyToken);
        set(Encoder.getKey("stLaunchFee"), _stLaunchFee);
        set(Encoder.getKey("tickerRegFee"), _tickerRegFee);
        set(Encoder.getKey("expiryLimit"), uint256(15 * 1 days));
        set(Encoder.getKey("paused"), false);
        set(Encoder.getKey("owner"), _owner);
        set(Encoder.getKey("polymathRegistry"), _polymathRegistry);
        _setProtocolVersion(_STFactory, uint8(0), uint8(0), uint8(1));
        set(Encoder.getKey("initialised"), true);
    }

    /////////////////////////////
    // Token Ticker Management
    /////////////////////////////

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
        // accessing the tickerRegFee value
        if (getUint(Encoder.getKey("tickerRegFee")) > 0)
            require(IERC20(getAddress(Encoder.getKey("polyToken"))).transferFrom(msg.sender, address(this), getUint(Encoder.getKey("tickerRegFee"))), "Sufficent allowance is not provided");
        string memory ticker = Util.upper(_ticker);
        require(_tickerAvailable(ticker), "Ticker is already reserved");
        _addTicker(_owner, ticker, _tokenName, now, now.add(getUint(Encoder.getKey("expiryLimit"))), false, false);
    }

    /**
     * @notice Modify the ticker details. Only polymath account has the ability
     * to do so. Only allowed to modify the tickers which are not yet deployed
     * @param _owner Owner of the token
     * @param _ticker token ticker
     * @param _tokenName Name of the token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     * @param _status Token deployed status
     */
    function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external onlyOwner {
        require(bytes(_ticker).length > 0 && bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        require(_expiryDate != 0 && _registrationDate != 0, "Dates should not be 0");
        require(_registrationDate <= _expiryDate, "Registration date should < expiry date");
        require(_owner != address(0), "Address should not be 0x");
        string memory ticker = Util.upper(_ticker);
        _modifyTicker(_owner, ticker, _tokenName, _registrationDate, _expiryDate, _status);
    }

    function _modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal {
        address currentOwner = getAddress(Encoder.getKey("registeredTickers_owner", _ticker));
        if (currentOwner == address(0) && _registrationDate == 0 && _expiryDate == 0) {
            _addTicker(_owner, _ticker, _tokenName, now, now.add(getUint(Encoder.getKey("expiryLimit"))), _status, true);
            return;
        }
        // If ticker exists, and is registered to a different owner, switch over
        if ((currentOwner != address(0)) && (currentOwner != _owner)) {
            _transferTickerOwnership(currentOwner, _owner, _ticker);
        }
        if (getBool(Encoder.getKey("registeredTickers_status", _ticker)) && !_status) {
            set(Encoder.getKey("tickerToSecurityToken", _ticker), address(0));
        }
        _storeTickerDetails(_ticker, _owner, _registrationDate, _expiryDate, _tokenName, _status);
        emit RegisterTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate, true);
    }

    /**
     * @notice Remove the ticker details and associated ownership & security token mapping
     * @param _ticker token ticker
     */
    function removeTicker(string _ticker) external onlyOwner {
        string memory ticker = Util.upper(_ticker);
        address owner = getAddress(Encoder.getKey("registeredTickers_owner", ticker));
        require(owner != address(0), "Ticker does not exist");
        _deleteTickerOwnership(owner, ticker);
        set(Encoder.getKey("tickerToSecurityToken", ticker), address(0));
        _storeTickerDetails(ticker, address(0), 0, 0, "", false);
        emit TickerRemoved(_ticker, now, msg.sender);
    }

    /**
     * @notice Checks if the entered ticker is registered and not expired
     * @param _ticker token ticker
     * @return bool
     */
    function _tickerAvailable(string _ticker) internal view returns(bool) {
        if (getAddress(Encoder.getKey("registeredTickers_owner", _ticker)) != address(0)) {
            if (now > getUint(Encoder.getKey("registeredTickers_expiryDate", _ticker)) && !getBool(Encoder.getKey("registeredTickers_status", _ticker))) {
                return true;
            } else
                return false;
        }
        return true;
    }

    /**
     * @notice Internal function to set the details of the ticker
     */
    function _addTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin) internal {
        _setTickerOwner(_owner, _ticker);
        _storeTickerDetails(_ticker, _owner, _registrationDate, _expiryDate, _tokenName, _status);
        emit RegisterTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate, _fromAdmin);
    }

    /**
     * @notice Internal function to set the ticker owner
     * @param _owner Address of the owner of ticker
     * @param _ticker Ticker
     */
    function _setTickerOwner(address _owner, string _ticker) internal {
        uint256 length = uint256(getArrayBytes32(Encoder.getKey("userToTickers", _owner)).length);
        pushArray(Encoder.getKey("userToTickers", _owner), Util.stringToBytes32(_ticker));
        set(Encoder.getKey("tickerIndex", _ticker), length);
    }

    /**
     * @notice Internal function use to store the ticker details
     */
    function _storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status) internal {
        if (getAddress(Encoder.getKey("registeredTickers_owner", _ticker)) != _owner)
            set(Encoder.getKey("registeredTickers_owner", _ticker), _owner);
        if (getUint(Encoder.getKey("registeredTickers_registrationDate", _ticker)) != _registrationDate)
            set(Encoder.getKey("registeredTickers_registrationDate", _ticker), _registrationDate);
        if (getUint(Encoder.getKey("registeredTickers_expiryDate", _ticker)) != _expiryDate)
            set(Encoder.getKey("registeredTickers_expiryDate", _ticker), _expiryDate);
        if (Encoder.getKey(getString(Encoder.getKey("registeredTickers_tokenName", _ticker))) != Encoder.getKey(_tokenName))
            set(Encoder.getKey("registeredTickers_tokenName", _ticker), _tokenName);
        if (getBool(Encoder.getKey("registeredTickers_status", _ticker)) != _status)
            set(Encoder.getKey("registeredTickers_status", _ticker), _status);
    }

    /**
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Ticker
     */
    function transferTickerOwnership(address _newOwner, string _ticker) external whenNotPaused {
        string memory ticker = Util.upper(_ticker);
        require(_newOwner != address(0), "Address should not be 0x");
        require(getAddress(Encoder.getKey("registeredTickers_owner", ticker)) == msg.sender, "Not authorised");
        _transferTickerOwnership(msg.sender, _newOwner, ticker);
        set(Encoder.getKey("registeredTickers_owner", _ticker), _newOwner);
    }

    /**
     * @notice Transfers the control of ticker to a newOwner
     * @param _oldOwner Previous owner
     * @param _newOwner Address of the new owner
     * @param _ticker Ticker
     */
    function _transferTickerOwnership(address _oldOwner, address _newOwner, string _ticker) internal {
        _deleteTickerOwnership(_oldOwner, _ticker);
        _setTickerOwner(_newOwner, _ticker);
        emit ChangeTickerOwnership(_ticker, _oldOwner, _newOwner);
    }

    function _deleteTickerOwnership(address _owner, string _ticker) internal {
        uint256 _index = uint256(getUint(Encoder.getKey("tickerIndex", _ticker)));
        // deleting the _index from the data strucutre userToTickers[_oldowner][_index];
        deleteArrayBytes32(Encoder.getKey("userToTickers", _owner), _index);

        if (getArrayBytes32(Encoder.getKey("userToTickers", _owner)).length > _index) {
            bytes32 switchedTicker =  getArrayBytes32(Encoder.getKey("userToTickers", _owner))[_index];
            set(Encoder.getKey("tickerIndex", Util.bytes32ToString(switchedTicker)), _index);
        }
    }

    /**
     * @notice Change the expiry time for the token ticker
     * @param _newExpiry new time period for token ticker expiry
     */
    function changeExpiryLimit(uint256 _newExpiry) external onlyOwner {
        require(_newExpiry >= 1 days, "Expiry should >= 1 day");
        emit ChangeExpiryLimit(getUint(Encoder.getKey('expiryLimit')), _newExpiry);
        set(Encoder.getKey('expiryLimit'), _newExpiry);
    }

    /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[]) {
         uint counter = 0;
         // accessing the data structure userTotickers[_owner].length
         uint _len = getArrayBytes32(Encoder.getKey("userToTickers", _owner)).length;
         bytes32[] memory tempList = new bytes32[](_len);
         for (uint i = 0; i < _len; i++) {
             string memory _ticker = Util.bytes32ToString(getArrayBytes32(Encoder.getKey("userToTickers", _owner))[i]);
             if (getUint(Encoder.getKey("registeredTickers_expiryDate", _ticker)) >= now || getBool(Encoder.getKey("registeredTickers_status", _ticker))) {
                 tempList[counter] = getArrayBytes32(Encoder.getKey("userToTickers", _owner))[i];
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
        if (getBool(Encoder.getKey("registeredTickers_status", ticker)) == true || getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)) > now) {
            return
            (
                getAddress(Encoder.getKey("registeredTickers_owner", ticker)),
                getUint(Encoder.getKey("registeredTickers_registrationDate", ticker)),
                getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)),
                getString(Encoder.getKey("registeredTickers_tokenName", ticker)),
                getBool(Encoder.getKey("registeredTickers_status", ticker))
            );
        } else
            return (address(0), uint256(0), uint256(0), "", false);
    }

    /////////////////////////////
    // Security Token Management
    /////////////////////////////

    /**
     * @notice Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _ticker Ticker ticker of the security token
     * @param _tokenDetails off-chain details of the token
     * @param _divisible Set to true if token is divisible
     */
    function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external whenNotPaused {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "Ticker length > 0");
        string memory ticker = Util.upper(_ticker);

        require(getBool(Encoder.getKey("registeredTickers_status", ticker)) != true, "Ticker already deployed");
        require(getAddress(Encoder.getKey("registeredTickers_owner", ticker)) == msg.sender, "Should have same owner");
        require(getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)) >= now, "Ticker should not be expired");

        // No need to update the _name - this is the token name, not the ticker name
        set(Encoder.getKey("registeredTickers_status", _ticker), true);

        if (getUint(Encoder.getKey("stLaunchFee")) > 0)
            require(IERC20(getAddress(Encoder.getKey("polyToken"))).transferFrom(msg.sender, address(this), getUint(Encoder.getKey("stLaunchFee"))), "Sufficent allowance is not provided");
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
        emit NewSecurityToken(ticker, _name, newSecurityTokenAddress, msg.sender, now, msg.sender, false);
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
    function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external onlyOwner {
        require(bytes(_name).length > 0 && bytes(_ticker).length > 0, "String length > 0");
        require(bytes(_ticker).length <= 10, "Ticker length range (0,10]");
        require(_deployedAt != 0 && _owner != address(0), "0 value params not allowed");
        string memory ticker = Util.upper(_ticker);
        require(_securityToken != address(0), "ST address is 0x");
        // If ticker didn't previously exist, registration & expiry time will be set according to the now (current) time
        _modifyTicker(_owner, ticker, _name, getUint(Encoder.getKey("registeredTickers_registrationDate", ticker)), getUint(Encoder.getKey("registeredTickers_expiryDate", ticker)), true);
        set(Encoder.getKey("tickerToSecurityToken", ticker), _securityToken);
        _storeSecurityTokenData(_securityToken, ticker, _tokenDetails, _deployedAt);
        emit NewSecurityToken(ticker, _name, _securityToken, _owner, _deployedAt, msg.sender, true);
    }

    /**
     * @notice Internal function use to store the securitytoken details
     */
    function _storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt) internal {
        set(Encoder.getKey("securityTokens_ticker", _securityToken), _ticker);
        set(Encoder.getKey("securityTokens_tokenDetails", _securityToken), _tokenDetails);
        set(Encoder.getKey("securityTokens_deployedAt", _securityToken), _deployedAt);
    }

    /**
    * @notice Check that Security Token is registered
    * @param _securityToken Address of the Scurity token
    * @return bool
    */
    function isSecurityToken(address _securityToken) external view returns (bool) {
        return (keccak256(bytes(getString(Encoder.getKey("securityTokens_ticker", _securityToken)))) != keccak256(""));
    }

    /**
     * @notice Get security token address by ticker name
     * @param _ticker Ticker of the Scurity token
     * @return address
     */
    function getSecurityTokenAddress(string _ticker) public view returns (address) {
        string memory __ticker = Util.upper(_ticker);
        return getAddress(Encoder.getKey("tickerToSecurityToken", __ticker));
    }

     /**
     * @notice Get security token data by its address
     * @param _securityToken Address of the Scurity token.
     * @return string Ticker of the Security Token.
     * @return address Address of the issuer of Security Token.
     * @return string Details of the Token.
     * @return uint256 Timestamp at which Security Token get launched on Polymath platform.
     */
    function getSecurityTokenData(address _securityToken) external view returns (string, address, string, uint256) {
        return (
            getString(Encoder.getKey("securityTokens_ticker", _securityToken)),
            IOwner(_securityToken).owner(),
            getString(Encoder.getKey("securityTokens_tokenDetails", _securityToken)),
            getUint(Encoder.getKey("securityTokens_deployedAt", _securityToken))
        );
    }

    /////////////////////////////
    // Ownership, lifecycle & Utility
    /////////////////////////////

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == getAddress(Encoder.getKey("owner")));
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!getBool(Encoder.getKey("paused")), "Already paused");
        _;
    }

    /**
     * @notice Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(getBool(Encoder.getKey("paused")), "Should not be paused");
        _;
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0));
        emit OwnershipTransferred(getAddress(Encoder.getKey("owner")), _newOwner);
        set(Encoder.getKey("owner"), _newOwner);
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
    * @notice set the ticker registration fee in POLY tokens
    * @param _tickerRegFee registration fee in POLY tokens (base 18 decimals)
    */
   function changeTickerRegistrationFee(uint256 _tickerRegFee) external onlyOwner {
       require(getUint(Encoder.getKey('tickerRegFee')) != _tickerRegFee);
       emit ChangeTickerRegistrationFee(getUint(Encoder.getKey('tickerRegFee')), _tickerRegFee);
       set(Encoder.getKey('tickerRegFee'), _tickerRegFee);
   }

   /**
    * @notice set the ticker registration fee in POLY tokens
    * @param _stLaunchFee registration fee in POLY tokens (base 18 decimals)
    */
   function changeSecurityLaunchFee(uint256 _stLaunchFee) external onlyOwner {
       require(getUint(Encoder.getKey("stLaunchFee")) != _stLaunchFee);
       emit ChangeSecurityLaunchFee(getUint(Encoder.getKey("stLaunchFee")), _stLaunchFee);
       set(Encoder.getKey("stLaunchFee"), _stLaunchFee);
   }

    /**
    * @notice Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(getAddress(Encoder.getKey("owner")), balance));
    }

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
    * @param _STFactoryAddress Address of the proxy.
    * @param _major Major version of the proxy.
    * @param _minor Minor version of the proxy.
    * @param _patch Patch version of the proxy
    */
    function setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external onlyOwner {
        _setProtocolVersion(_STFactoryAddress, _major, _minor, _patch);
    }

    /**
    * @notice Changes the protocol version and the SecurityToken contract
    * @notice Used only by Polymath to upgrade the SecurityToken contract and add more functionalities to future versions
    * @notice Changing versions does not affect existing tokens.
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
     * @notice Get the current STFactory Address
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
     * @notice Change the PolyToken address
     * @param _newAddress Address of the polytoken
     */
    function updatePolyTokenAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0));
        set(Encoder.getKey("polyToken"), _newAddress);
    }


}
