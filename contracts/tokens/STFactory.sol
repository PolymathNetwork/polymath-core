pragma solidity 0.5.8;

import "./SecurityTokenProxy.sol";
import "../proxy/OwnedUpgradeabilityProxy.sol";
import "../interfaces/ISTFactory.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../interfaces/IOwnable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../datastore/DataStoreFactory.sol";

/**
 * @title Proxy for deploying SecurityToken instances
 */
contract STFactory is ISTFactory, Ownable {

    address public transferManagerFactory;
    DataStoreFactory public dataStoreFactory;
    IPolymathRegistry public polymathRegistry;

    // Mapping from Security Token address to token upgrade version.
    // A mapping to 0 means a token has not yet been deployed
    mapping (address => uint256) tokenUpgrade;

    struct LogicContract {
        string version;
        address logicContract;
        bytes initializationData; // Called when first creating token
        bytes upgradeData; // Called when upgrading token from previous version
    }

    mapping (uint256 => LogicContract) logicContracts;

    uint256 public latestUpgrade;

    event LogicContractSet(string _version, uint256 _upgrade, address _logicContract, bytes _initializationData, bytes _upgradeData);
    event TokenUpgraded(
        address indexed _securityToken,
        uint256 indexed _version
    );
    event DefaultTransferManagerUpdated(address indexed _oldTransferManagerFactory, address indexed _newTransferManagerFactory);
    event DefaultDataStoreUpdated(address indexed _oldDataStoreFactory, address indexed _newDataStoreFactory);

    constructor(
        address _polymathRegistry,
        address _transferManagerFactory,
        address _dataStoreFactory,
        string memory _version,
        address _logicContract,
        bytes memory _initializationData
    )
        public
    {
        require(_logicContract != address(0), "Invalid Address");
        require(_transferManagerFactory != address(0), "Invalid Address");
        require(_dataStoreFactory != address(0), "Invalid Address");
        require(_polymathRegistry != address(0), "Invalid Address");
        require(_initializationData.length > 4, "Invalid Initialization");
        transferManagerFactory = _transferManagerFactory;
        dataStoreFactory = DataStoreFactory(_dataStoreFactory);
        polymathRegistry = IPolymathRegistry(_polymathRegistry);

        // Start at 1 so that we can distinguish deployed tokens in tokenUpgrade
        latestUpgrade = 1;
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
        address _treasuryWallet
    )
        external
        returns(address)
    {
        address securityToken = _deploy(
            _name,
            _symbol,
            _decimals,
            _tokenDetails,
            _divisible
        );
        //NB When dataStore is generated, the security token address is automatically set via the constructor in DataStoreProxy.
        if (address(dataStoreFactory) != address(0)) {
            ISecurityToken(securityToken).changeDataStore(dataStoreFactory.generateDataStore(securityToken));
        }
        ISecurityToken(securityToken).changeTreasuryWallet(_treasuryWallet);
        if (transferManagerFactory != address(0)) {
            ISecurityToken(securityToken).addModule(transferManagerFactory, "", 0, 0, false);
        }
        IOwnable(securityToken).transferOwnership(_issuer);
        return securityToken;
    }

    function _deploy(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        string memory _tokenDetails,
        bool _divisible
    ) internal returns(address) {
        // Creates proxy contract and sets some initial storage
        SecurityTokenProxy proxy = new SecurityTokenProxy(
            _name,
            _symbol,
            _decimals,
            _divisible ? 1 : uint256(10) ** _decimals,
            _tokenDetails,
            address(polymathRegistry)
        );
        // Sets logic contract
        proxy.upgradeTo(logicContracts[latestUpgrade].version, logicContracts[latestUpgrade].logicContract);
        // Initialises security token contract - needed for functions that can only be called by the
        // owner of the contract, or are specific to this particular logic contract (e.g. setting version)
        (bool success, ) = address(proxy).call(logicContracts[latestUpgrade].initializationData);
        require(success, "Unsuccessful initialization");
        tokenUpgrade[address(proxy)] = latestUpgrade;
        return address(proxy);
    }

    /**
     * @notice Used to set a new token logic contract
     * @param _version Version of upgraded module
     * @param _logicContract Address of deployed module logic contract referenced from proxy
     * @param _initializationData Initialization data that used to intialize value in the securityToken
     * @param _upgradeData Data to be passed in call to upgradeToAndCall when a token upgrades its module
     */
    function setLogicContract(string calldata _version, address _logicContract, bytes calldata _initializationData, bytes calldata _upgradeData) external onlyOwner {
        require(keccak256(abi.encodePacked(_version)) != keccak256(abi.encodePacked(logicContracts[latestUpgrade].version)), "Same version");
        require(_logicContract != logicContracts[latestUpgrade].logicContract, "Same version");
        require(_logicContract != address(0), "Invalid address");
        require(_initializationData.length > 4, "Invalid Initialization");
        require(_upgradeData.length > 4, "Invalid Upgrade");
        latestUpgrade++;
        _modifyLogicContract(latestUpgrade, _version, _logicContract, _initializationData, _upgradeData);
    }

    /**
     * @notice Used to update an existing token logic contract
     * @param _upgrade logic contract to upgrade
     * @param _version Version of upgraded module
     * @param _logicContract Address of deployed module logic contract referenced from proxy
     * @param _upgradeData Data to be passed in call to upgradeToAndCall when a token upgrades its module
     */
    function updateLogicContract(uint256 _upgrade, string calldata _version, address _logicContract, bytes calldata _initializationData, bytes calldata _upgradeData) external onlyOwner {
        require(_upgrade <= latestUpgrade, "Invalid upgrade");
        require(_upgrade > 0, "Invalid upgrade");
        // version & contract must differ from previous version, otherwise upgrade proxy will fail
        if (_upgrade > 1) {
          require(keccak256(abi.encodePacked(_version)) != keccak256(abi.encodePacked(logicContracts[_upgrade - 1].version)), "Same version");
          require(_logicContract != logicContracts[_upgrade - 1].logicContract, "Same version");
        }
        require(_logicContract != address(0), "Invalid address");
        require(_initializationData.length > 4, "Invalid Initialization");
        require(_upgradeData.length > 4, "Invalid Upgrade");
        _modifyLogicContract(_upgrade, _version, _logicContract, _initializationData, _upgradeData);
    }

    function _modifyLogicContract(uint256 _upgrade, string memory _version, address _logicContract, bytes memory _initializationData, bytes memory _upgradeData) internal {
        logicContracts[_upgrade].version = _version;
        logicContracts[_upgrade].logicContract = _logicContract;
        logicContracts[_upgrade].upgradeData = _upgradeData;
        logicContracts[_upgrade].initializationData = _initializationData;
        emit LogicContractSet(_version, _upgrade, _logicContract, _initializationData, _upgradeData);
    }
    /**
     * @notice Used to upgrade a token
     * @param _maxModuleType maximum module type enumeration
     */
    function upgradeToken(uint8 _maxModuleType) external {
        // Check the token was created by this factory
        require(tokenUpgrade[msg.sender] != 0, "Invalid token");
        uint256 newVersion = tokenUpgrade[msg.sender] + 1;
        require(newVersion <= latestUpgrade, "Incorrect version");
        OwnedUpgradeabilityProxy(address(uint160(msg.sender))).upgradeToAndCall(logicContracts[newVersion].version, logicContracts[newVersion].logicContract, logicContracts[newVersion].upgradeData);
        tokenUpgrade[msg.sender] = newVersion;
        // Check that all modules remain valid
        IModuleRegistry moduleRegistry = IModuleRegistry(polymathRegistry.getAddress("ModuleRegistry"));
        address moduleFactory;
        bool isArchived;
        for (uint8 i = 1; i < _maxModuleType; i++) {
            address[] memory modules = ISecurityToken(msg.sender).getModulesByType(i);
            for (uint256 j = 0; j < modules.length; j++) {
                (,, moduleFactory, isArchived,,) = ISecurityToken(msg.sender).getModule(modules[j]);
                if (!isArchived) {
                    require(moduleRegistry.isCompatibleModule(moduleFactory, msg.sender), "Incompatible Modules");
                }
            }
        }
        emit TokenUpgraded(msg.sender, newVersion);
    }

    /**
     * @notice Used to set a new default transfer manager
     * @dev Setting this to address(0) means don't deploy a default TM
     * @param _transferManagerFactory Address of new default transfer manager factory
     */
    function updateDefaultTransferManager(address _transferManagerFactory) external onlyOwner {
        // NB - setting this to address(0) means don't deploy a default TM
        emit DefaultTransferManagerUpdated(transferManagerFactory, _transferManagerFactory);
        transferManagerFactory = _transferManagerFactory;
    }

    /**
     * @notice Used to set a new default data store
     * @dev Setting this to address(0) means don't deploy a default data store
     * @param _dataStoreFactory Address of new default data store factory
     */
    function updateDefaultDataStore(address _dataStoreFactory) external onlyOwner {
        // NB - setting this to address(0) means don't deploy a default TM
        emit DefaultDataStoreUpdated(address(dataStoreFactory), address(_dataStoreFactory));
        dataStoreFactory = DataStoreFactory(_dataStoreFactory);
    }

}
