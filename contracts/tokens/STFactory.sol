pragma solidity ^0.5.0;

import "./SecurityTokenProxy.sol";
import "../proxy/OwnedUpgradeabilityProxy.sol";
import "../interfaces/ISTFactory.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/IOwnable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../datastore/DataStoreFactory.sol";

/**
 * @title Proxy for deploying SecurityToken instances
 */
contract STFactory is ISTFactory, Ownable {

    address public polymathRegistry;
    address public transferManagerFactory;
    DataStoreFactory public dataStoreFactory;
    // Mapping from Security Token address to token version
    mapping (address => uint256) tokenVersion;
    // Mapping from Security Token address to registry
    // We do this so that we can use the registry to check module compatibility on upgrades
    // And as a secondary benefit that a token was deployed initially through this factory
    mapping (address => address) tokenToRegistry;

    struct LogicContract {
        string version;
        address logicContract;
        bytes initializationData; // Called when first creating token
        bytes upgradeData; // Called when upgrading token from previous version
    }

    mapping (uint256 => LogicContract) logicContracts;

    uint256 public latestUpgrade;

    event LogicContractSet(string _version, address _logicContract, bytes _upgradeData);

    constructor(address _polymathRegistry, address _transferManagerFactory, address _dataStoreFactory, string memory _version, address _logicContract, bytes memory _initializationData) public {
        require(_logicContract != address(0), "Invalid Address");
        require(_transferManagerFactory != address(0), "Invalid Address");
        require(_dataStoreFactory != address(0), "Invalid Address");
        require(_polymathRegistry != address(0), "Invalid Address");
        transferManagerFactory = _transferManagerFactory;
        dataStoreFactory = DataStoreFactory(_dataStoreFactory);
        logicContracts[latestUpgrade].logicContract = _logicContract;
        logicContracts[latestUpgrade].initializationData = _initializationData;
        logicContracts[latestUpgrade].version = _version;
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
        // Creates proxy contract and sets some initial storage
        SecurityTokenProxy proxy = new SecurityTokenProxy(
            _name,
            _symbol,
            _decimals,
            _divisible ? 1 : uint256(10) ** _decimals,
            _tokenDetails,
            _polymathRegistry
        );
        // Sets logic contract
        proxy.upgradeTo(logicContracts[latestUpgrade].version, logicContracts[latestUpgrade].logicContract);
        // Initialises security token contract - needed for functions that can only be called by the
        // owner of the contract, or are specific to this particular logic contract (e.g. setting version)
        (bool success, ) = address(proxy).call(logicContracts[latestUpgrade].initializationData);
        require(success, "Unsuccessful initialization");
        tokenToRegistry[address(proxy)] = _polymathRegistry;
        return address(proxy);
    }

    /**
     * @notice Used to set a new token logic contract
     * @param _version Version of upgraded module
     * @param _logicContract Address of deployed module logic contract referenced from proxy
     * @param _upgradeData Data to be passed in call to upgradeToAndCall when a token upgrades its module
     */
    function setLogicContract(string calldata _version, address _logicContract, bytes calldata _upgradeData) external onlyOwner {
        require(keccak256(abi.encodePacked(_version)) != keccak256(abi.encodePacked(logicContracts[latestUpgrade].version)), "Same version");
        require(_logicContract != logicContracts[latestUpgrade].logicContract, "Same version");
        require(_logicContract != address(0), "Invalid address");
        latestUpgrade++;
        logicContracts[latestUpgrade].version = _version;
        logicContracts[latestUpgrade].logicContract = _logicContract;
        logicContracts[latestUpgrade].upgradeData = _upgradeData;
        emit LogicContractSet(_version, _logicContract, _upgradeData);
    }

    /**
     * @notice Used to upgrade a token
     */
    function upgradeToken() external {
        // Check the token was created by this factory
        require(tokenToRegistry[msg.sender] != address(0), "Invalid token");
        uint256 newVersion = tokenVersion[msg.sender] + 1;
        require(newVersion <= latestUpgrade, "Incorrect version");
        OwnedUpgradeabilityProxy(address(uint160(msg.sender))).upgradeToAndCall(logicContracts[newVersion].version, logicContracts[newVersion].logicContract, logicContracts[newVersion].upgradeData);
        tokenVersion[msg.sender] = newVersion;
        // Check that all modules remain valid
        IModuleRegistry moduleRegistry = IModuleRegistry(IPolymathRegistry(polymathRegistry).getAddress("ModuleRegistry"));
        for (uint8 i = 1; i < 10; i++) {
            address[] memory modules = ISecurityToken(msg.sender).getModulesByType(i);
            for (uint256 j = 0; j < modules.length; j++) {
                require(moduleRegistry.isCompatibleModule(msg.sender, modules[j]), "Incompatible Modules");
            }
        }

    }
}
