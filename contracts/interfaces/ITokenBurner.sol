pragma solidity ^0.4.24;

/**
 * @title Interface for the token burner contract
 */
interface ITokenBurner {

    function burn(address _burner, uint256  _value ) external returns(bool);

}
