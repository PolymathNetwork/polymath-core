pragma solidity ^0.4.18;

/*
  Allows issuers to reserve their token symbols ahead
  of actually generating their security token.
  SecurityTokenRegistrar would reference this contract and ensure that any token symbols
  registered here can only be created by their owner.
*/

import './SafeMath.sol';

/**
 * @title TickerRegistrar
 * @dev Contract use to register the security token symbols
 */
contract TickerRegistrar {

    using SafeMath for uint256;
    // constant variable to check the validity to use the symbol
    // For now it's value is 90 days;
    uint256 public constant EXPIRY_LIMIT = 90 * 1 days;  

    // Ethereum address of the admin (Control some functions of the contract)
    address public admin;

    // SecuirtyToken Registrar contract address
    address public STRAddress;

    // Details of the symbol that get registered with the polymath platform
    struct SymbolDetails {
        address owner;
        uint256 timestamp;
        string contact;
        bool status;
    }

    // Storage of symbols correspond to their details.
    mapping(string => SymbolDetails) registeredSymbols;

    // Emit after the symbol registration
    event LogRegisterTicker(address _owner, string indexed _symbol, uint256 _timestamp);
    // Emit when the token symbol expired and now it not more reserved for its owner
    // Cont.:: After this emission of the event the token symbol will be available to sale
    event LogExpiredSymbol(string indexed _symbol, uint256 _timestamp);

    function TickerRegistrar() public {
        admin = msg.sender;
    }

    /**
     * @dev Register the token symbol for its particular owner
            Once symbol get register to its owner then no other issuer can claim
            its ownership, until unless the symbol get expired and its issuer doesn't used it
            for its issuance.
     * @param _symbol token symbol
     * @param _contact token contract details e.g. email
     */
    function registerTicker(string _symbol, string _contact) public {
        require(registeredSymbols[_symbol].owner == address(0));
        require(bytes(_contact).length > 0);
        registeredSymbols[_symbol] = SymbolDetails(msg.sender, now, _contact, false);
        LogRegisterTicker(msg.sender, _symbol, now);
    }

    /**
     * @dev To re-intialize the token symbol details
     * @param _symbol token symbol
     */
    function expiredSymbol(string _symbol) public {
        require(msg.sender == admin);
        require(now > registeredSymbols[_symbol].timestamp.add(EXPIRY_LIMIT));
        require(registeredSymbols[_symbol].status != true);
        registeredSymbols[_symbol] = SymbolDetails(address(0),uint256(0),"",false);
        LogExpiredSymbol(_symbol, now);
    }

    /**
     * @dev set the address of the Security Token registrar
     * @param _STRegistrar contract address of the STR
     * @return bool
     */
    function setTokenRegistrar(address _STRegistrar) public returns(bool) {
        require(msg.sender == admin);
        require(_STRegistrar != address(0) && STRAddress == address(0));
        STRAddress = _STRegistrar;
        return true;
    }

    /**
     * @dev Check the validity of the symbol
     * @param _symbol token symbol
     * @param _owner address of the owner
     */
    function checkValidity(string _symbol, address _owner) public {
        require(msg.sender == STRAddress);
        require(registeredSymbols[_symbol].owner == _owner);
        require(registeredSymbols[_symbol].timestamp.add(EXPIRY_LIMIT) >= now);
        registeredSymbols[_symbol].status = true;
    }

     /**
     * @dev Returns the owner and timestamp for a given symbol
     * @param _symbol symbol
     */
    function getDetails(string _symbol) public view returns (address, uint256, string, bool) {
        return
        (
            registeredSymbols[_symbol].owner,
            registeredSymbols[_symbol].timestamp,
            registeredSymbols[_symbol].contact,
            registeredSymbols[_symbol].status
        );
    }
}