pragma solidity ^0.4.24;

/**
 * @title Interface for security token proxy deployment
 */
interface ISTFactory {

    /**
     * @notice deploys the token and adds default modules like permission manager and transfer manager.
     * Future versions of the proxy can attach different modules or pass some other paramters.
     */
    function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry)
        external returns (address);
}
