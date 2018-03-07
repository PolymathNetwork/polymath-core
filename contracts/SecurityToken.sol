pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import './interfaces/IAuthorized.sol';

contract SecurityToken is StandardToken, DetailedERC20 {

    /// Securities are not divisible
    uint8 public constant _ST_DECIMAL = 0; 
    
    // Owner of the ST
    address public owner;                                                   

    IAuthorized Auth;

    function SecurityToken(address _owner, uint256 _totalSupply, string _name, string _symbol, address _authorizedAddress) public
     DetailedERC20(_name, _symbol, _ST_DECIMAL) 
    {
        require(_owner != address(0));
        require(_totalSupply > 0);
        owner = _owner;
        totalSupply_ = _totalSupply;
        Auth = IAuthorized(_authorizedAddress);
        allocateSecurities();
    }

    /**
     * @dev Allocate all the pre-mint supply of securities token to owner
     */
    function allocateSecurities() internal {
        balances[owner] = totalSupply_;
        Transfer(address(0), owner, totalSupply_);
    }

    /**
     * @dev Overladed version of the transfer function
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        if (Auth.validatePermission(this, _to, msg.sender) == true)
            return super.transfer(_to, _value);
        else
            return false;
    }

    /**
     * @dev Overladed version of the transferFrom function
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        if (Auth.validatePermission(this, _to, _from) == true)
            return super.transferFrom(_from, _to, _value);
        else
            return false;
    }

}