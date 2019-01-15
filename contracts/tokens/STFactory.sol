pragma solidity ^0.5.0;

import "./SecurityToken.sol";
import "../interfaces/ISTFactory.sol";
import "../datastore/DataStoreFactory.sol";

/**
 * @title Proxy for deploying SecurityToken instances
 */
contract STFactory is ISTFactory {
    address public transferManagerFactory;
    DataStoreFactory public dataStoreFactory;

    constructor(address _transferManagerFactory, address _dataStoreFactory) public {
        transferManagerFactory = _transferManagerFactory;
        dataStoreFactory = DataStoreFactory(_dataStoreFactory);
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
        address _polymathRegistry
    ) 
        external 
        returns(address) 
    {
        SecurityToken newSecurityToken = new SecurityToken(
            _name,
            _symbol,
            _decimals,
            _divisible ? 1 : uint256(10) ** _decimals,
            _tokenDetails,
            _polymathRegistry
        );
        newSecurityToken.addModule(transferManagerFactory, "", 0, 0);
        newSecurityToken.setDataStore(dataStoreFactory.generateDataStore(address(newSecurityToken)));
        newSecurityToken.transferOwnership(_issuer);
        return address(newSecurityToken);
    }
}
