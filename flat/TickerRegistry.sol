pragma solidity ^0.4.18;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

interface ITickerRegistry {
     /**
      * @dev Check the validity of the symbol
      * @param _symbol token symbol
      * @param _owner address of the owner
      */
     function checkValidity(string _symbol, address _owner) public;

     /**
      * @dev Returns the owner and timestamp for a given symbol
      * @param _symbol symbol
      */
     function getDetails(string _symbol) public view returns (address, uint256, string, bool);


}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

/*
  Allows issuers to reserve their token symbols ahead
  of actually generating their security token.
  SecurityTokenRegistry would reference this contract and ensure that any token symbols
  registered here can only be created by their owner.
*/




/**
 * @title TickerRegistry
 * @dev Contract use to register the security token symbols
 */
contract TickerRegistry is ITickerRegistry, Ownable {

    using SafeMath for uint256;
    // constant variable to check the validity to use the symbol
    // For now it's value is 90 days;
    uint256 public expiryLimit = 90 * 1 days;

    // Ethereum address of the admin (Control some functions of the contract)
    address public admin;

    // SecuirtyToken Registry contract address
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
    event LogRegisterTicker(address indexed _owner, string _symbol, uint256 _timestamp);
    // Emit when the token symbol expiry get changed
    event LogChangeExpiryLimit(uint256 _oldExpiry, uint256 _newExpiry);


    function TickerRegistry() public {
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
        require(bytes(_contact).length > 0);
        require(expiryCheck(_symbol));
        registeredSymbols[_symbol] = SymbolDetails(msg.sender, now, _contact, false);
        LogRegisterTicker(msg.sender, _symbol, now);
    }

     /**
      * @dev Change the expiry time for the token symbol
      * @param _newExpiry new time period for token symbol expiry
      */
     function changeExpiryLimit(uint256 _newExpiry) public {
         require(msg.sender == admin);
         uint256 _oldExpiry = expiryLimit;
         expiryLimit = _newExpiry;
         LogChangeExpiryLimit(_oldExpiry, _newExpiry);
   }

    /**
     * @dev To re-intialize the token symbol details if symbol validity expires
     * @param _symbol token symbol
     */
    function expiryCheck(string _symbol) internal returns(bool) {
        if (registeredSymbols[_symbol].owner != address(0)) {
            if (now > registeredSymbols[_symbol].timestamp.add(expiryLimit) && registeredSymbols[_symbol].status != true) {
                registeredSymbols[_symbol] = SymbolDetails(address(0), uint256(0), "", false);
                return true;
            }
            else
                return false;
        }
        return true;
    }

    /**
     * @dev set the address of the Security Token registry
     * @param _STRegistry contract address of the STR
     * @return bool
     */
    function setTokenRegistry(address _STRegistry) public onlyOwner returns(bool) {
        require(_STRegistry != address(0) && STRAddress == address(0));
        STRAddress = _STRegistry;
        return true;
    }

    /**
     * @dev Check the validity of the symbol
     * @param _symbol token symbol
     * @param _owner address of the owner
     */
    function checkValidity(string _symbol, address _owner) public {
        require(msg.sender == STRAddress);
        require(registeredSymbols[_symbol].status != true);
        require(registeredSymbols[_symbol].owner == _owner);
        require(registeredSymbols[_symbol].timestamp.add(expiryLimit) >= now);
        registeredSymbols[_symbol].status = true;
    }

     /**
     * @dev Returns the owner and timestamp for a given symbol
     * @param _symbol symbol
     */
    function getDetails(string _symbol) public view returns (address, uint256, string, bool) {
        if (registeredSymbols[_symbol].status == true || registeredSymbols[_symbol].timestamp.add(expiryLimit) > now ) {
            return
            (
                registeredSymbols[_symbol].owner,
                registeredSymbols[_symbol].timestamp,
                registeredSymbols[_symbol].contact,
                registeredSymbols[_symbol].status
            );
        }
        else
            return (address(0), uint256(0), "", false);
    }
}