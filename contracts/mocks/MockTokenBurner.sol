pragma solidity ^0.4.24;

import "../interfaces/ISecurityToken.sol";
import "../interfaces/ITokenBurner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockTokenBurner is ITokenBurner {

    address public securityToken;

    constructor (address _securityToken) public {
        securityToken = _securityToken;
    }

    function burn(address /* _burner */, uint256 /* _value */) public view returns(bool) {
        require(msg.sender == securityToken);
        // Add the schematics for the burner( token holder) that backing the burning of the securities
        return true;
    }

}
