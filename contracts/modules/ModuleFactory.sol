pragma solidity 0.5.8;

import "../libraries/VersionUtils.sol";
import "../libraries/Util.sol";
import "../interfaces/IModule.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/ISecurityTokenRegistry.sol";
import "../interfaces/IMultiSigWallet.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../libraries/DecimalMath.sol";

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {

    using SafeMath for uint256;

    IPolymathRegistry public polymathRegistry;

    string initialVersion;
    bytes32 public name;
    string public title;
    string public description;

    uint8[] typesData;
    bytes32[] tagsData;

    bool public isCostInPoly;
    uint256 public setupCost;
    uint256 public usageCost;
    uint256 public lastTimeUsageCostChange;
    uint256 internal constant LOCKPERIOD = 24 hours;

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
    constructor(uint256 _setupCost, uint256 _usageCost, address _polymathRegistry, bool _isCostInPoly) public {
        setupCost = _setupCost;
        usageCost = _usageCost;
        lastTimeUsageCostChange = now;
        polymathRegistry = IPolymathRegistry(_polymathRegistry);
        isCostInPoly = _isCostInPoly;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        return typesData;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        return tagsData;
    }

    /**
     * @notice Get the version related to the module factory
     */
    function version() external view returns(string memory) {
        return initialVersion;
    }

    /**
     * @notice Used to change the fee of the setup cost
     * @param _setupCost new setup cost
     */
    function changeSetupCost(uint256 _setupCost) public onlyOwner {
        emit ChangeSetupCost(setupCost, _setupCost);
        setupCost = _setupCost;
    }

    /**
     * @notice Used to change the usage cost
     * @param _usageCost new usage cost
     */
    function changeUsageCost(uint256 _usageCost) public onlyOwner {
        _changeUsageCost(_usageCost);
    }

    function _changeUsageCost(uint256 _usageCost) internal {
        require(now.sub(lastTimeUsageCostChange) > LOCKPERIOD, "Under lock period");
        lastTimeUsageCostChange = now;
        emit ChangeUsageCost(usageCost, _usageCost);
        usageCost = _usageCost;
    }

    /**
     * @notice Used to change the currency and amount of setup cost
     * @param _setupCost new setup cost
     * @param _usageCost new usage cost
     * @param _isCostInPoly new setup cost currency. USD or POLY
     */
    function changeCostAndType(uint256 _setupCost, uint256 _usageCost, bool _isCostInPoly) public onlyOwner {
        emit ChangeSetupCost(setupCost, _setupCost);
        emit ChangeCostType(isCostInPoly, _isCostInPoly);
        setupCost = _setupCost;
        if (usageCost != _usageCost) {
            _changeUsageCost(_usageCost);
        }
        isCostInPoly = _isCostInPoly;
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
            "Invalid bound type"
        );
        require(_newVersion.length == 3, "Invalid version");
        if (compatibleSTVersionRange[_boundType] != uint24(0)) {
            uint8[] memory _currentVersion = VersionUtils.unpack(compatibleSTVersionRange[_boundType]);
            if (keccak256(abi.encodePacked(_boundType)) == keccak256(abi.encodePacked("lowerBound"))) {
                require(VersionUtils.lessThanOrEqual(_newVersion, _currentVersion), "Invalid version");
            } else {
                require(VersionUtils.greaterThanOrEqual(_newVersion, _currentVersion), "Invalid version");
            }
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
    function setupCostInPoly() public returns (uint256) {
        if (isCostInPoly)
            return setupCost;
        uint256 polyRate = IOracle(polymathRegistry.getAddress(POLY_ORACLE)).getPrice();
        return DecimalMath.div(setupCost, polyRate);
    }

    /**
     * @notice Get the usage cost of the module
     */
    function usageCostInPoly() public returns (uint256) {
        if (isCostInPoly)
            return usageCost;
        uint256 polyRate = IOracle(polymathRegistry.getAddress(POLY_ORACLE)).getPrice();
        return DecimalMath.div(usageCost, polyRate);
    }

    /**
     * @notice Calculates fee in POLY
     */
    function _takeFee(address _securityToken) internal returns(uint256) {
        uint256 polySetupCost = setupCostInPoly();
        address polyToken = polymathRegistry.getAddress("PolyToken");
        ISecurityTokenRegistry securityTokenRegistry = ISecurityTokenRegistry(polymathRegistry.getAddress("SecurityTokenRegistry"));
        IMultiSigWallet feeWallet = IMultiSigWallet(polymathRegistry.getAddress("FeeWallet"));
        require(address(feeWallet) != address(0), "Invalid fee wallet address");
        if (polySetupCost > 0) {
            address whitelabler = securityTokenRegistry.getWhitelabelerBySecurityToken(_securityToken);
            if (whitelabler != address(0)) {
                require(IERC20(polyToken).transferFrom(msg.sender, address(this), polySetupCost), "Insufficient allowance for module fee");
                IERC20(polyToken).approve(address(feeWallet), polySetupCost);
                feeWallet.collectModuleFee(_securityToken, polySetupCost);
            } else {
                require(IERC20(polyToken).transferFrom(msg.sender, address(feeWallet), polySetupCost), "Insufficient allowance for module fee");
            }
            emit SetupFeeDeducted(address(feeWallet), _securityToken, polySetupCost);
        }
        return polySetupCost;
    }

    /**
     * @notice Used to initialize the module
     * @param _module Address of module
     * @param _data Data used for the intialization of the module factory variables
     */
    function _initializeModule(address _module, bytes memory _data) internal {
        uint256 polySetupCost = _takeFee(msg.sender);
        bytes4 initFunction = IModule(_module).getInitFunction();
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
