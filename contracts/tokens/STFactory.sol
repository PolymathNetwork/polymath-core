pragma solidity ^0.5.0;

import "./SecurityTokenProxy.sol";
import "../proxy/OwnedUpgradeabilityProxy.sol";
import "../interfaces/ISTFactory.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/IOwnable.sol";
import "../datastore/DataStoreFactory.sol";

/**
 * @title Proxy for deploying SecurityToken instances
 */
contract STFactory is ISTFactory {
    address public transferManagerFactory;
    address public getterDelegate;
    address public implementation;
    string public version;
    DataStoreFactory public dataStoreFactory;

    constructor(address _transferManagerFactory, address _dataStoreFactory, address _getterDelegate, string memory _version, address _implementation) public {
        require(_implementation != address(0), "Invalid Address");
        require(_getterDelegate != address(0), "Invalid Address");
        transferManagerFactory = _transferManagerFactory;
        dataStoreFactory = DataStoreFactory(_dataStoreFactory);
        getterDelegate = _getterDelegate;
        implementation = _implementation;
        version = _version;
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
        address _treasuryWallet,
        address _polymathRegistry
    )
        external
        returns(address)
    {
        address securityToken = _deploy(
            _name,
            _symbol,
            _decimals,
            _tokenDetails,
            _divisible,
            _polymathRegistry
        );
        //NB When dataStore is generated, the security token address is automatically set via the constructor in DataStoreProxy.
        ISecurityToken(securityToken).changeDataStore(dataStoreFactory.generateDataStore(securityToken));
        ISecurityToken(securityToken).changeTreasuryWallet(_treasuryWallet);
        ISecurityToken(securityToken).addModule(transferManagerFactory, "", 0, 0);
        IOwnable(securityToken).transferOwnership(_issuer);
        return securityToken;
    }

    function _deploy(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _tokenDetails,
        bool _divisible,
        address _polymathRegistry
    ) internal returns(address) {
        SecurityTokenProxy proxy = new SecurityTokenProxy(
            _name,
            _symbol,
            _decimals,
            _divisible ? 1 : uint256(10) ** _decimals,
            _tokenDetails,
            _polymathRegistry,
            getterDelegate
        );
        proxy.upgradeTo(version, implementation);
        ISecurityToken(address(proxy)).initialize();
        return address(proxy);
    }
}
