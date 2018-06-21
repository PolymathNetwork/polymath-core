pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interfaces/ITickerRegistry.sol";
import "./Registry.sol";
import "./helpers/Util.sol";

/**
 * @title Registry contract for issuers to reserve their security token symbols
 * @notice Allows issuers to reserve their token symbols ahead of actually generating their security token.
 * @dev SecurityTokenRegistry would reference this contract and ensure that a token symbol exists here and only its owner can deploy the token with that symbol.
 */
contract TickerRegistry is ITickerRegistry, Util, Registry {

    using SafeMath for uint256;
    // constant variable to check the validity to use the symbol
    // For now it's value is 15 days;
    uint256 public expiryLimit = 15 * 1 days;

    // Details of the symbol that get registered with the polymath platform
    struct SymbolDetails {
        address owner;
        uint256 timestamp;
        string tokenName;
        bytes32 swarmHash;
        bool status;
    }

    // Storage of symbols correspond to their details.
    mapping(string => SymbolDetails) registeredSymbols;

    // Emit after the symbol registration
    event LogRegisterTicker(address indexed _owner, string _symbol, string _name, bytes32 _swarmHash, uint256 indexed _timestamp);
    // Emit when the token symbol expiry get changed
    event LogChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;
    // Emit when changePolyRegisterationFee is called
    event LogChangePolyRegisterationFee(uint256 _oldFee, uint256 _newFee);

    constructor (address _polyToken, uint256 _registrationFee) public {
        changeAddress("PolyToken", _polyToken);
        registrationFee = _registrationFee;
    }

    /**
     * @notice Register the token symbol for its particular owner
     * @notice Once the token symbol is registered to its owner then no other issuer can claim
     * @notice its ownership. If the symbol expires and its issuer hasn't used it, then someone else can take it.
     * @param _symbol token symbol
     * @param _tokenName Name of the token
     * @param _owner Address of the owner of the token
     * @param _swarmHash Off-chain details of the issuer and token
     */
    function registerTicker(address _owner, string _symbol, string _tokenName, bytes32 _swarmHash) public whenNotPaused {
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "Ticker length should always between 0 & 10");
        if(registrationFee > 0)
            require(ERC20(getAddress("PolyToken")).transferFrom(msg.sender, this, registrationFee), "Failed transferFrom because of sufficent Allowance is not provided");
        string memory symbol = upper(_symbol);
        require(expiryCheck(symbol), "Ticker is already reserved");
        registeredSymbols[symbol] = SymbolDetails(_owner, now, _tokenName, _swarmHash, false);
        emit LogRegisterTicker (_owner, symbol, _tokenName, _swarmHash, now);
    }

    /**
     * @notice Change the expiry time for the token symbol
     * @param _newExpiry new time period for token symbol expiry
     */
    function changeExpiryLimit(uint256 _newExpiry) public onlyOwner {
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
    function checkValidity(string _symbol, address _owner, string _tokenName) public returns(bool) {
        string memory symbol = upper(_symbol);
        require(msg.sender == getAddress("SecurityTokenRegistry"), "msg.sender should be SecurityTokenRegistry contract");
        require(registeredSymbols[symbol].status != true, "Symbol status should not equal to true");
        require(registeredSymbols[symbol].owner == _owner, "Owner of the symbol should matched with the requested issuer address");
        require(registeredSymbols[symbol].timestamp.add(expiryLimit) >= now, "Ticker should not be expired");
        registeredSymbols[symbol].tokenName = _tokenName;
        registeredSymbols[symbol].status = true;
        return true;
    }

    /**
     * @notice Check the symbol is reserved or not
     * @param _symbol Symbol of the token
     * @param _owner Owner of the token
     * @param _tokenName Name of the token
     * @param _swarmHash off-chain hash
     * @return bool
     */
     function isReserved(string _symbol, address _owner, string _tokenName, bytes32 _swarmHash) public returns(bool) {
        string memory symbol = upper(_symbol);
        require(msg.sender == getAddress("SecurityTokenRegistry"), "msg.sender should be SecurityTokenRegistry contract");
        if (registeredSymbols[symbol].owner == _owner && !expiryCheck(_symbol)) {
            registeredSymbols[symbol].status = true;
            return false;
        }
        else if (registeredSymbols[symbol].owner == address(0) || expiryCheck(symbol)) {
            registeredSymbols[symbol] = SymbolDetails(_owner, now, _tokenName, _swarmHash, true);
            emit LogRegisterTicker (_owner, symbol, _tokenName, _swarmHash, now);
            return false;
        } else
            return true;
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
    function getDetails(string _symbol) public view returns (address, uint256, string, bytes32, bool) {
        string memory symbol = upper(_symbol);
        if (registeredSymbols[symbol].status == true||registeredSymbols[symbol].timestamp.add(expiryLimit) > now) {
            return
            (
                registeredSymbols[symbol].owner,
                registeredSymbols[symbol].timestamp,
                registeredSymbols[symbol].tokenName,
                registeredSymbols[symbol].swarmHash,
                registeredSymbols[symbol].status
            );
        }else
            return (address(0), uint256(0), "", bytes32(0), false);
    }

    /**
     * @notice To re-initialize the token symbol details if symbol validity expires
     * @param _symbol token symbol
     * @return bool
     */
    function expiryCheck(string _symbol) internal returns(bool) {
        if (registeredSymbols[_symbol].owner != address(0)) {
            if (now > registeredSymbols[_symbol].timestamp.add(expiryLimit) && registeredSymbols[_symbol].status != true) {
                registeredSymbols[_symbol] = SymbolDetails(address(0), uint256(0), "", bytes32(0), false);
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
    function changePolyRegisterationFee(uint256 _registrationFee) public onlyOwner {
        require(registrationFee != _registrationFee);
        emit LogChangePolyRegisterationFee(registrationFee, _registrationFee);
        registrationFee = _registrationFee;
    }
}
