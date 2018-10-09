pragma solidity ^0.4.24;

import "./SecurityToken.sol";
import "../interfaces/ISTFactory.sol";

/**
 * @title Proxy for deploying Security Token v1
 */
contract STFactory is ISTFactory {

    address public transferManagerFactory;

    constructor (address _transferManagerFactory) public {
        transferManagerFactory = _transferManagerFactory;
    }

    /**
     * @notice deploys the token and adds default modules like permission manager and transfer manager.
     * Future versions of the proxy can attach different modules or pass some other paramters.
     */
    function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry)
    external returns (address) {
        address newSecurityTokenAddress = new SecurityToken(
            _name,
            _symbol,
            _decimals,
            _divisible ? 1 : uint256(10)**_decimals,
            _tokenDetails,
            _polymathRegistry
        );
        SecurityToken(newSecurityTokenAddress).addModule(transferManagerFactory, "", 0, 0);
        SecurityToken(newSecurityTokenAddress).transferOwnership(_issuer);
        return newSecurityTokenAddress;
    }
}
