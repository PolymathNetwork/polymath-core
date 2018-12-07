pragma solidity ^0.4.24;

import "../RegistryUpdater.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IModuleFactory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../libraries/VersionUtils.sol";

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {

    IERC20 public polyToken;
    uint256 public usageCost;
    uint256 public monthlySubscriptionCost;

    uint256 public setupCost;
    string public description;
    string public version;
    bytes32 public name;
    string public title;

    // @notice Allow only two variables to be stored
    // 1. lowerBound 
    // 2. upperBound
    // @dev (0.0.0 will act as the wildcard) 
    // @dev uint24 consists packed value of uint8 _major, uint8 _minor, uint8 _patch
    mapping(string => uint24) compatibleSTVersionRange;

    event ChangeFactorySetupFee(uint256 _oldSetupCost, uint256 _newSetupCost, address _moduleFactory);
    event ChangeFactoryUsageFee(uint256 _oldUsageCost, uint256 _newUsageCost, address _moduleFactory);
    event ChangeFactorySubscriptionFee(uint256 _oldSubscriptionCost, uint256 _newMonthlySubscriptionCost, address _moduleFactory);
    event GenerateModuleFromFactory(
        address _module,
        bytes32 indexed _moduleName,
        address indexed _moduleFactory,
        address _creator,
        uint256 _timestamp
    );
    event ChangeSTVersionBound(string _boundType, uint8 _major, uint8 _minor, uint8 _patch);

    /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public {
        setupCost = _setupCost;
        usageCost = _usageCost;
        monthlySubscriptionCost = _subscriptionCost;
    }

    /**
     * @notice Used to change the fee of the setup cost
     * @param _newSetupCost new setup cost
     */
    function changeFactorySetupFee(uint256 _newSetupCost) public onlyOwner {
        emit ChangeFactorySetupFee(setupCost, _newSetupCost, address(this));
        setupCost = _newSetupCost;
    }

    /**
     * @notice Used to change the fee of the usage cost
     * @param _newUsageCost new usage cost
     */
    function changeFactoryUsageFee(uint256 _newUsageCost) public onlyOwner {
        emit ChangeFactoryUsageFee(usageCost, _newUsageCost, address(this));
        usageCost = _newUsageCost;
    }

    /**
     * @notice Used to change the fee of the subscription cost
     * @param _newSubscriptionCost new subscription cost
     */
    function changeFactorySubscriptionFee(uint256 _newSubscriptionCost) public onlyOwner {
        emit ChangeFactorySubscriptionFee(monthlySubscriptionCost, _newSubscriptionCost, address(this));
        monthlySubscriptionCost = _newSubscriptionCost;

    }

    /**
     * @notice Updates the title of the ModuleFactory
     * @param _newTitle New Title that will replace the old one.
     */
    function changeTitle(string _newTitle) public onlyOwner {
        require(bytes(_newTitle).length > 0, "Invalid title");
        title = _newTitle;
    }

    /**
     * @notice Updates the description of the ModuleFactory
     * @param _newDesc New description that will replace the old one.
     */
    function changeDescription(string _newDesc) public onlyOwner {
        require(bytes(_newDesc).length > 0, "Invalid description");
        description = _newDesc;
    }

    /**
     * @notice Updates the name of the ModuleFactory
     * @param _newName New name that will replace the old one.
     */
    function changeName(bytes32 _newName) public onlyOwner {
        require(_newName != bytes32(0),"Invalid name");
        name = _newName;
    }

    /**
     * @notice Updates the version of the ModuleFactory
     * @param _newVersion New name that will replace the old one.
     */
    function changeVersion(string _newVersion) public onlyOwner {
        require(bytes(_newVersion).length > 0, "Invalid version");
        version = _newVersion;
    }

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion new version array
     */
    function changeSTVersionBounds(string _boundType, uint8[] _newVersion) external onlyOwner {
        require(
            keccak256(abi.encodePacked(_boundType)) == keccak256(abi.encodePacked("lowerBound")) ||
            keccak256(abi.encodePacked(_boundType)) == keccak256(abi.encodePacked("upperBound")),
            "Must be a valid bound type"
        );
        require(_newVersion.length == 3);
        if (compatibleSTVersionRange[_boundType] != uint24(0)) { 
            uint8[] memory _currentVersion = VersionUtils.unpack(compatibleSTVersionRange[_boundType]);
            require(VersionUtils.isValidVersion(_currentVersion, _newVersion), "Failed because of in-valid version");
        }
        compatibleSTVersionRange[_boundType] = VersionUtils.pack(_newVersion[0], _newVersion[1], _newVersion[2]);
        emit ChangeSTVersionBound(_boundType, _newVersion[0], _newVersion[1], _newVersion[2]);
    }

    /**
     * @notice Used to get the lower bound
     * @return lower bound
     */
    function getLowerSTVersionBounds() external view returns(uint8[]) {
        return VersionUtils.unpack(compatibleSTVersionRange["lowerBound"]);
    }

    /**
     * @notice Used to get the upper bound
     * @return upper bound
     */
    function getUpperSTVersionBounds() external view returns(uint8[]) {
        return VersionUtils.unpack(compatibleSTVersionRange["upperBound"]);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

   /**
    * @notice Get the name of the Module
    */
    function getName() public view returns(bytes32) {
        return name;
    }

    function updateFromRegistry(address _securityToken) internal {
        polyToken = IERC20(RegistryUpdater(_securityToken).polyToken());
    }

}
