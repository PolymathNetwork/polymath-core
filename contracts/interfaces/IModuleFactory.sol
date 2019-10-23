pragma solidity 0.5.8;

/**
 * @title Interface that every module factory contract should implement
 */
interface IModuleFactory {
    
    event ChangeSetupCost(uint256 _oldSetupCost, uint256 _newSetupCost);
    event ChangeUsageCost(uint256 _oldUsageCost, uint256 _newUsageCost);
    event UsageCostProposed(uint256 _proposedFee, uint256 _currentFee);
    event ChangeCostType(bool _isOldCostInPoly, bool _isNewCostInPoly);
    event ChangeCostTypeProposed(bool _proposedCostType, bool _currentCostType);
    event GenerateModuleFromFactory(
        address _module,
        bytes32 indexed _moduleName,
        address indexed _moduleFactory,
        address _creator,
        uint256 _setupCost,
        uint256 _setupCostInPoly
    );
    event ChangeSTVersionBound(string _boundType, uint8 _major, uint8 _minor, uint8 _patch);
    //Should create an instance of the Module, or throw
    function deploy(bytes calldata _data) external returns(address moduleAddress);

    /**
     * @notice Get factory owner
     */
    function owner() external view returns (address factoryOwner);

    /**
     * @notice Get the tags related to the module factory
     */
    function version() external view returns(string memory moduleVersion);

    /**
     * @notice Get the tags related to the module factory
     */
    function name() external view returns(bytes32 moduleName);

    /**
     * @notice Returns the title associated with the module
     */
    function title() external view returns(string memory moduleTitle);

    /**
     * @notice Returns the description associated with the module
     */
    function description() external view returns(string memory moduleDescription);

    /**
     * @notice Get the setup cost of the module in USD
     */
    function setupCost() external view returns(uint256 usdSetupCost);

    /**
     * @notice Get the usage cost of the module in USD
     */
    function usageCost() external view returns(uint256 usdUsageCost);

    /**
     * @notice Get the usage cost of the module in USD
     */
    function proposedUsageCost() external view returns(uint256 usdProposedUsageCost);

    /**
     * @notice Get the usage cost proposal time
     */
    function usageCostProposedAt() external view returns(uint256 usageCostProposedAtTime);

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory moduleTypes);

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory moduleTags);

    /**
     * @notice Used to change the setup fee
     * @param _newSetupCost New setup fee
     */
    function changeSetupCost(uint256 _newSetupCost) external;

    /**
     * @notice Used to change the usage cost
     */
    function changeUsageCost() external;

    /**
     * @notice Used to change the cost type
     */
    function changeCostType() external;

    /**
     * @notice Used to propose the usage cost
     * @param _usageCostProposed Proposed usage cost amount
     */
    function proposeUsageCost(uint256 _usageCostProposed) external;

    /**
     * @notice Used to change the currency and amount of setup cost
     * @param _setupCost new setup cost
     * @param _usageCost new usage cost
     * @param _isCostInPoly new setup cost currency. USD or POLY
     */
    function changeCostAndType(uint256 _setupCost, uint256 _usageCost, bool _isCostInPoly) external;

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion New version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external;

    /**
     * @notice Get the setup cost of the module
     */
    function setupCostInPoly() external returns (uint256 polySetupCost);

    /**
     * @notice Get the usage cost of the module
     */
    function usageCostInPoly() external returns (uint256 polyUsageCost);

    /**
     * @notice Used to get the lower bound
     * @return Lower bound
     */
    function getLowerSTVersionBounds() external view returns(uint8[] memory lowerBounds);

    /**
     * @notice Used to get the upper bound
     * @return Upper bound
     */
    function getUpperSTVersionBounds() external view returns(uint8[] memory upperBounds);

    /**
     * @notice Updates the tags of the ModuleFactory
     * @param _tagsData New list of tags
     */
    function changeTags(bytes32[] calldata _tagsData) external;

    /**
     * @notice Updates the name of the ModuleFactory
     * @param _name New name that will replace the old one.
     */
    function changeName(bytes32 _name) external;

    /**
     * @notice Updates the description of the ModuleFactory
     * @param _description New description that will replace the old one.
     */
    function changeDescription(string calldata _description) external;

    /**
     * @notice Updates the title of the ModuleFactory
     * @param _title New Title that will replace the old one.
     */
    function changeTitle(string calldata _title) external;

    /**
     * @notice Address of the polymath registry
     */
    function polymathRegistry() external returns (address polymathRegistryAddress);

}
