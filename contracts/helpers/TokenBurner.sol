pragma solidity ^0.4.23;

import "../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TokenBurner {

    address public securityToken;

    constructor (address _securityToken) public {
        securityToken = _securityToken;
    }

    function burn(address /* _burner */, uint256 /* _value */) public returns(bool) {
        require(msg.sender == securityToken);
        // Add the schematics for the burner( token holder) that backing the burning of the securities
        return true;
    }


}
