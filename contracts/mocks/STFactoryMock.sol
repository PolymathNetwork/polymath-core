pragma solidity ^0.5.0;

import "./SecurityTokenMock.sol";
import "../interfaces/ISTFactory.sol";

/**
 * @title Proxy for deploying SecurityToken instances
 */
contract STFactoryMock is ISTFactory {
    address public stDelegate;

    constructor(address _transferManagerFactory, address _dataStoreFactory, address _stDelegate) public {
        stDelegate = _stDelegate;
    }

    /**
     * @notice deploys the token and adds default modules like the GeneralTransferManager.
     * Future versions of the proxy can attach different modules or pass different parameters.
     */
    function deployToken(
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals,
        string calldata _tokenDetails,
        address _issuer,
        bool _divisible,
        address /* _treasuryWallet */,
        address _polymathRegistry
    )
        external
        returns(address)
    {
        SecurityTokenMock newSecurityToken = new SecurityTokenMock(
            _polymathRegistry,
            stDelegate
        );
        newSecurityToken.transferOwnership(_issuer);
        return address(newSecurityToken);
    }
}
