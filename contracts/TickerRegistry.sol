pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interfaces/ITickerRegistry.sol";
import "./helpers/Util.sol";
import "./Pausable.sol";
import "./RegistryUpdater.sol";
import "./ReclaimTokens.sol";

/**
 * @title Registry contract for issuers to reserve their security token symbols
 * @notice Allows issuers to reserve their token symbols ahead of actually generating their security token.
 * @dev SecurityTokenRegistry would reference this contract and ensure that a token symbol exists here and only its owner can deploy the token with that symbol.
 */
contract TickerRegistry is ITickerRegistry, Util, Pausable, RegistryUpdater, ReclaimTokens {

    using SafeMath for uint256;

    // constant variable to check the validity to use the symbol
    uint256 public expiryLimit;

    // Details of the symbol that get registered with the polymath platform
    struct SymbolDetails {
        address owner;
        uint256 registrationDate;
        uint256 expiryDate;
        string tokenName;
        bytes32 swarmHash;
        bool status;
    }

    // Storage of symbols correspond to their details.
    mapping(string => SymbolDetails) registeredSymbols;
    // Mapping of ticker owner with the list of tickers 
    mapping(address => bytes32[]) public tokensOwnedByUser;
    // Store the location index of the ticker in an array
    mapping(string => uint) tickerIndex;

    // Emit after the symbol registration
    event LogRegisterTicker(
        address indexed _owner,
        string _symbol,
        string _name,
        bytes32 _swarmHash,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate
    );
    // Emit when the token symbol expiry get changed
    event LogChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);
    // Emit when ownership of the ticker get changed
    event LogChangeTickerOwnership(string _ticker, address _oldOwner, address _newOwner);

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;
    // Emit when changePolyRegistrationFee is called
    event LogChangePolyRegistrationFee(uint256 _oldFee, uint256 _newFee);

    constructor (address _polymathRegistry, uint256 _registrationFee) public
    RegistryUpdater(_polymathRegistry)
    {
        expiryLimit = 15 * 1 days;
        registrationFee = _registrationFee;
    }

    /**
     * @notice Register the token symbol for its particular owner
       Once the token symbol is registered to its owner then no other issuer can claim
       its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _owner Address of the owner of the token
     * @param _swarmHash Off-chain details of the issuer and token
     */
    function registerTicker(address _owner, string _symbol, string _tokenName, bytes32 _swarmHash) external whenNotPaused {
        require(_owner != address(0), "Owner should not be 0x");
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "Ticker length should always between 0 & 10");
        if(registrationFee > 0)
            require(ERC20(polyToken).transferFrom(msg.sender, address(this), registrationFee), "Failed transferFrom because of sufficent Allowance is not provided");
        string memory symbol = upper(_symbol);
        require(expiryCheck(symbol), "Ticker is already reserved");
        tokensOwnedByUser[_owner].push(stringToBytes32(symbol));
        tickerIndex[symbol] = tokensOwnedByUser[_owner].length - 1;
        registeredSymbols[symbol] = SymbolDetails(_owner, now, now.add(expiryLimit), _tokenName, _swarmHash, false);
        emit LogRegisterTicker (_owner, symbol, _tokenName, _swarmHash, now, now.add(expiryLimit));
    }

    /**
     * @notice Change the expiry time for the token symbol
     * @param _newExpiry new time period for token symbol expiry
     */
    function changeExpiryLimit(uint256 _newExpiry) external onlyOwner {
        require(_newExpiry >= 1 days, "Expiry should greater than or equal to 1 day");
        uint256 _oldExpiry = expiryLimit;
        expiryLimit = _newExpiry;
        emit LogChangeExpiryLimit(_oldExpiry, _newExpiry);
    }

    /**
     * @notice Check the validity of the symbol
     * @param _symbol token symbol
     * @param _owner address of the owner
     * @param _tokenName Name of the token
     * @return bool
     */
    function checkValidity(string _symbol, address _owner, string _tokenName) external returns(bool) {
        string memory symbol = upper(_symbol);
        require(msg.sender == securityTokenRegistry, "msg.sender should be SecurityTokenRegistry contract");
        require(registeredSymbols[symbol].status != true, "Symbol status should not equal to true");
        require(registeredSymbols[symbol].owner == _owner, "Owner of the symbol should matched with the requested issuer address");
        require(registeredSymbols[symbol].expiryDate >= now, "Ticker should not be expired");
        registeredSymbols[symbol].tokenName = _tokenName;
        registeredSymbols[symbol].status = true;
        return true;
    }
   
    /**
     * @notice Register the ticker without paying the fee 
       Once the token symbol is registered to its owner then no other issuer can claim
       Its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _swarmHash Off-chain details of the issuer and token
     * @param _registrationDate Date on which ticker get registered
     * @param _expiryDate Expiry date of the ticker
     */
    function addCustomTicker(string _symbol, string _tokenName, bytes32 _swarmHash, uint256 _registrationDate, uint256 _expiryDate) public onlyOwner {
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "Ticker length should always between 0 & 10");
        require(_expiryDate != 0 && _registrationDate != 0, "Dates should not be 0");
        require(_registrationDate < _expiryDate, "Registration date should be less than the expiry date");
        string memory symbol = upper(_symbol);
        require(expiryCheck(symbol), "Ticker is already reserved");
        tokensOwnedByUser[msg.sender].push(stringToBytes32(symbol));
        tickerIndex[symbol] = tokensOwnedByUser[msg.sender].length - 1;
        registeredSymbols[symbol] = SymbolDetails(msg.sender, now, now.add(expiryLimit), _tokenName, _swarmHash, false);
        emit LogRegisterTicker (msg.sender, symbol, _tokenName, _swarmHash, now, now.add(expiryLimit));
    }

    /**
     * @notice Check the symbol is reserved or not
     * @param _symbol Symbol of the token
     * @param _owner Owner of the token
     * @param _tokenName Name of the token
     * @param _swarmHash off-chain hash
     * @return bool
     */
     function isReserved(string _symbol, address _owner, string _tokenName, bytes32 _swarmHash) external returns(bool) {
        string memory symbol = upper(_symbol);
        require(msg.sender == securityTokenRegistry, "msg.sender should be SecurityTokenRegistry contract");
        if (registeredSymbols[symbol].owner == _owner && !expiryCheck(_symbol)) {
            registeredSymbols[symbol].status = true;
            return false;
        }
        else if (registeredSymbols[symbol].owner == address(0) || expiryCheck(symbol)) {
            registeredSymbols[symbol] = SymbolDetails(_owner, now, now.add(expiryLimit), _tokenName, _swarmHash, true);
            emit LogRegisterTicker (_owner, symbol, _tokenName, _swarmHash, now, now.add(expiryLimit));
            return false;
        } else
            return true;
     }

    /**
     * @notice To re-initialize the token symbol details if symbol validity expires
     * @param _symbol token symbol
     * @return bool
     */
    function expiryCheck(string _symbol) internal returns(bool) {
        if (registeredSymbols[_symbol].owner != address(0)) {
            if (now > registeredSymbols[_symbol].expiryDate && registeredSymbols[_symbol].status != true) {
                require(_renounceTickerOwnership(_symbol));
                registeredSymbols[_symbol] = SymbolDetails(address(0), uint256(0), uint256(0), "", bytes32(0), false);
                return true;
            }else
                return false;
        }
        return true;
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
     * @notice Renounce the ownership of the ticker
     * @param _ticker Symbol of the token
     */
    function _renounceTickerOwnership(string _ticker) internal returns(bool) {
       uint _len = tokensOwnedByUser[registeredSymbols[_ticker].owner].length;
       uint _index = tickerIndex[_ticker];
       tokensOwnedByUser[registeredSymbols[_ticker].owner][_index] = tokensOwnedByUser[registeredSymbols[_ticker].owner][_len - 1];
       tickerIndex[bytes32ToString(tokensOwnedByUser[registeredSymbols[_ticker].owner][_index])] = _index;
       _len = _len - 1;
       delete tickerIndex[_ticker];
       tokensOwnedByUser[registeredSymbols[_ticker].owner].length = _len;
       return true;    
    }

    /**
     * @notice Transfer the ownership of the ticker
     * @dev _newOwner Address whom ownership to transfer
     * @dev _ticker Symbol 
     */
    function transferTickerOwnership(address _newOwner, string _ticker) public whenNotPaused {
        string memory ticker = upper(_ticker);
        require(_newOwner != address(0), "Address should not be 0x");
        require(bytes(ticker).length > 0, "Ticker length should be greater than 0");
        require(registeredSymbols[ticker].owner == msg.sender, "Only the ticker owner can transfer the ownership");
        require(_renounceTickerOwnership(ticker), "Should successfully renounce the ownership of the ticker");
        registeredSymbols[ticker].owner = _newOwner;
        tokensOwnedByUser[_newOwner].push(stringToBytes32(ticker));
        tickerIndex[ticker] = tokensOwnedByUser[_newOwner].length - 1;
        emit LogChangeTickerOwnership(ticker, msg.sender, _newOwner);
    }

    /**
     * @notice Use to get the ticker list as per the owner
     * @param _owner Address which owns the list of tickers 
     */
    function getTickersByOwner(address _owner) public view returns(bytes32[]) {
         uint counter = 0;
         bytes32[] memory tempList = new bytes32[](tokensOwnedByUser[_owner].length);
         for (uint j = 0; j < tokensOwnedByUser[_owner].length; j++) {
             string memory _symbol = bytes32ToString(tokensOwnedByUser[_owner][j]);
             if (registeredSymbols[_symbol].expiryDate >= now || registeredSymbols[_symbol].status == true ) {
                 tempList[counter] = tokensOwnedByUser[_owner][j];
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
     * @return string
     * @return bytes32
     * @return bool
     */
    function getDetails(string _symbol) public view returns (address, uint256, uint256, string, bytes32, bool) {
        string memory symbol = upper(_symbol);
        if (registeredSymbols[symbol].status == true||registeredSymbols[symbol].expiryDate > now) {
            return
            (
                registeredSymbols[symbol].owner,
                registeredSymbols[symbol].registrationDate,
                registeredSymbols[symbol].expiryDate,
                registeredSymbols[symbol].tokenName,
                registeredSymbols[symbol].swarmHash,
                registeredSymbols[symbol].status
            );
        }else
            return (address(0), uint256(0), uint256(0), "", bytes32(0), false);
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
