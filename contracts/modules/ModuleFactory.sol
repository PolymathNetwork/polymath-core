pragma solidity ^0.5.0;

import "../libraries/VersionUtils.sol";
import "../libraries/Util.sol";
import "../interfaces/IBoot.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../interfaces/IModuleFactory.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../libraries/DecimalMath.sol";

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {

    address public polymathRegistry;

    string public version;
    bytes32 public name;
    string public title;
    string public description;

    uint8[] typesData; // Can't be modified unless using UpgradableModuleFactory
    bytes32[] tagsData;


    uint256 public usageCost; // Denominated in USD
    uint256 public setupCost; // Denominated in USD

    string constant POLY_ORACLE = "StablePolyUsdOracle";

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
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        return typesData;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        return tagsData;
    }

    /**
     * @notice Used to change the fee of the setup cost
     * @param _setupCost new setup cost in USD
     */
    function changeSetupCost(uint256 _setupCost) public onlyOwner {
        emit ChangeSetupCost(setupCost, _setupCost);
        setupCost = _setupCost;
    }

    /**
     * @notice Used to change the fee of the usage cost
     * @param _usageCost new usage cost in USD
     */
    function changeUsageCost(uint256 _usageCost) public onlyOwner {
        emit ChangeUsageCost(usageCost, _usageCost);
        usageCost = _usageCost;
    }

    /**
     * @notice Updates the title of the ModuleFactory
     * @param _title New Title that will replace the old one.
     */
    function changeTitle(string memory _title) public onlyOwner {
        require(bytes(_title).length > 0, "Invalid text");
        title = _title;
    }

    /**
     * @notice Updates the description of the ModuleFactory
     * @param _description New description that will replace the old one.
     */
    function changeDescription(string memory _description) public onlyOwner {
        require(bytes(_description).length > 0, "Invalid text");
        description = _description;
    }

    /**
     * @notice Updates the name of the ModuleFactory
     * @param _name New name that will replace the old one.
     */
    function changeName(bytes32 _name) public onlyOwner {
        require(_name != bytes32(0), "Invalid text");
        name = _name;
    }

    /**
     * @notice Updates the version of the ModuleFactory
     * @param _version New name that will replace the old one.
     */
    function changeVersion(string memory _version) public onlyOwner {
        require(bytes(_version).length > 0, "Invalid text");
        version = _version;
    }

    /**
     * @notice Updates the tags of the ModuleFactory
     * @param _tagsData New list of tags
     */
    function changeTags(bytes32[] memory _tagsData) public onlyOwner {
        require(_tagsData.length > 0, "Invalid text");
        tagsData = _tagsData;
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
    function lowerSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["lowerBound"]);
    }

    /**
     * @notice Used to get the upper bound
     * @return upper bound
     */
    function upperSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["upperBound"]);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function setupCostInPoly() public returns (uint256) {
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        return DecimalMath.div(setupCost, polyRate);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function usageCostInPoly() public returns (uint256) {
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        return DecimalMath.div(usageCost, polyRate);
    }

    /**
     * @notice Calculates fee in POLY
     */
    function _takeFee() internal returns(uint256) {
        uint256 polySetupCost = setupCostInPoly();
        address polyToken = IPolymathRegistry(polymathRegistry).getAddress("PolyToken");
        if (polySetupCost > 0) {
            require(IERC20(polyToken).transferFrom(msg.sender, owner(), polySetupCost), "Insufficient allowance for module fee");
        }
        return polySetupCost;
    }

    /**
     * @notice Used to initialize the module
     * @param _module Address of module
     * @param _data Data used for the intialization of the module factory variables
     */
    function _initializeModule(address _module, bytes memory _data) internal {
        uint256 polySetupCost = _takeFee();
        bytes4 initFunction = IBoot(_module).getInitFunction();
        if (initFunction != bytes4(0)) {
            require(Util.getSig(_data) == initFunction, "Provided data is not valid");
            /*solium-disable-next-line security/no-low-level-calls*/
            (bool success, ) = _module.call(_data);
            require(success, "Unsuccessful initialization");
        }
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(_module, name, address(this), msg.sender, setupCost, polySetupCost);
    }

}
