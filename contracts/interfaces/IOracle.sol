pragma solidity ^0.5.0;

interface IOracle {
    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address);

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32);

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32);

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external view returns(uint256);

}
