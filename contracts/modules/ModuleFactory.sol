pragma solidity ^0.5.0;

import "../RegistryUpdater.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/IOracle.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../libraries/VersionUtils.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../libraries/DecimalMath.sol";

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {
    // Fee to create underlying module in USD
    uint256 public setupCost;
    uint256 public usageCost;
    address public polymathRegistry;
    string public description;
    string public version;
    bytes32 public name;
    string public title;

    string constant POLY_ORACLE = "PolyUsdOracle";

    // @notice Allow only two variables to be stored
    // 1. lowerBound
    // 2. upperBound
    // @dev (0.0.0 will act as the wildcard)
    // @dev uint24 consists packed value of uint8 _major, uint8 _minor, uint8 _patch
    mapping(string => uint24) compatibleSTVersionRange;

    /**
     * @notice Constructor
     */
    constructor(uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public {
        setupCost = _setupCost;
        usageCost = _usageCost;
        polymathRegistry = _polymathRegistry;
    }

    /**
     * @notice Used to change the fee of the setup cost
     * @param _newSetupCost new setup cost in USD
     */
    function changeSetupCost(uint256 _newSetupCost) public onlyOwner {
        emit ChangeSetupCost(setupCost, _newSetupCost);
        setupCost = _newSetupCost;
    }

    /**
     * @notice Used to change the fee of the usage cost
     * @param _newUsageCost new usage cost in USD
     */
    function changeUsageCost(uint256 _newUsageCost) public onlyOwner {
        emit ChangeUsageCost(usageCost, _newUsageCost);
        usageCost = _newUsageCost;
    }

    /**
     * @notice Updates the title of the ModuleFactory
     * @param _newTitle New Title that will replace the old one.
     */
    function changeTitle(string memory _newTitle) public onlyOwner {
        require(bytes(_newTitle).length > 0, "Invalid title");
        title = _newTitle;
    }

    /**
     * @notice Updates the description of the ModuleFactory
     * @param _newDesc New description that will replace the old one.
     */
    function changeDescription(string memory _newDesc) public onlyOwner {
        require(bytes(_newDesc).length > 0, "Invalid description");
        description = _newDesc;
    }

    /**
     * @notice Updates the name of the ModuleFactory
     * @param _newName New name that will replace the old one.
     */
    function changeName(bytes32 _newName) public onlyOwner {
        require(_newName != bytes32(0), "Invalid name");
        name = _newName;
    }

    /**
     * @notice Updates the version of the ModuleFactory
     * @param _newVersion New name that will replace the old one.
     */
    function changeVersion(string memory _newVersion) public onlyOwner {
        require(bytes(_newVersion).length > 0, "Invalid version");
        version = _newVersion;
    }

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion new version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external onlyOwner {
        require(
            keccak256(abi.encodePacked(_boundType)) == keccak256(abi.encodePacked("lowerBound")) || keccak256(
                abi.encodePacked(_boundType)
            ) == keccak256(abi.encodePacked("upperBound")),
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
    function getLowerSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["lowerBound"]);
    }

    /**
     * @notice Used to get the upper bound
     * @return upper bound
     */
    function getUpperSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["upperBound"]);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() public view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCostInPoly() public view returns (uint256) {
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        return DecimalMath.div(setupCost, polyRate);
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return name;
    }


    /**
     * @notice Calculates fee in POLY
     */
    function _takeFee() internal returns(address) {
        uint256 setupCostInPoly = getSetupCostInPoly();
        address polyToken = IPolymathRegistry(polymathRegistry).getAddress("PolyToken");
        if (setupCostInPoly > 0) {
            require(IERC20(polyToken).transferFrom(msg.sender, owner(), setupCostInPoly), "Insufficient allowance for module fee");
        }
        return polyToken;
    }

}
