pragma solidity ^0.5.0;

contract OZStorage {

    mapping (address => uint256) internal _balances;

    mapping (address => mapping (address => uint256)) internal _allowed;

    uint256 internal _totalSupply;

    string internal _name;
    string internal _symbol;
    uint8 internal _decimals;

    address internal _owner;

    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 internal _guardCounter;

    function totalSupply() internal view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _investor) internal view returns(uint256) {
        return _balances[_investor];
    }

}
