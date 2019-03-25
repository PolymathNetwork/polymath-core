pragma solidity ^0.5.0;

/**
 * @title Interface that every module factory contract should implement
 */
interface IModuleFactory {
    event ChangeSetupCost(uint256 _oldSetupCost, uint256 _newSetupCost);
    event ChangeCostType(bool _isOldCostInPoly, bool _isNewCostInPoly);
    event ChangeUsageCost(uint256 _oldUsageCost, uint256 _newUsageCost);
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
    function deploy(bytes calldata _data) external returns(address);

    /**
     * @notice Get the tags related to the module factory
     */
    function version() external view returns(string memory);

    /**
     * @notice Get the tags related to the module factory
     */
    function name() external view returns(bytes32);

    /**
     * @notice Returns the title associated with the module
     */
    function title() external view returns(string memory);

    /**
     * @notice Returns the description associated with the module
     */
    function description() external view returns(string memory);

    /**
     * @notice Get the setup cost of the module in USD
     */
    function usageCost() external returns(uint256);

    /**
     * @notice Get the setup cost of the module in USD
     */
    function setupCost() external returns(uint256);

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory);

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory);

    /**
     * @notice Used to change the setup fee
     * @param _newSetupCost New setup fee
     */
    function changeSetupCost(uint256 _newSetupCost) external;

    /**
     * @notice Used to change the usage fee
     * @param _newUsageCost New usage fee
     */
    function changeUsageCost(uint256 _newUsageCost) external;

    /**
     * @notice Used to change the currency of usage and setup cost
     * @param _isCostInPoly new usage cost currency. USD = false, POLY = true
     */
    function changeCostType(bool _isCostInPoly) external;

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion New version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external;

    /**
     * @notice Get the setup cost of the module in USD
     */
    function usageCostInPoly() external returns(uint256);

    /**
     * @notice Get the setup cost of the module
     */
    function setupCostInPoly() external returns (uint256);

    /**
     * @notice Used to get the lower bound
     * @return Lower bound
     */
    function lowerSTVersionBounds() external view returns(uint8[] memory);

    /**
     * @notice Used to get the upper bound
     * @return Upper bound
     */
    function upperSTVersionBounds() external view returns(uint8[] memory);

}
