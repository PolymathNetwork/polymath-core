pragma solidity ^0.4.24;

import "../interfaces/ISecurityToken.sol";

contract MockCallback {
	ISecurityToken internal securityToken;

	event Callback(address investor, bytes data);

	constructor(ISecurityToken _securityToken) {
		require(address(_securityToken) != address(0), "Invalid Security Token");
		securityToken = _securityToken;
	}

	function emitCallback(address _investor, bytes _data) {
		emit Callback(_investor, _data);
	}

	function iterateInvestors(uint256 _start, uint256 _end, bytes _data) {
		securityToken.iterateInvestors(_start, _end, _data, this.emitCallback);
	}
}