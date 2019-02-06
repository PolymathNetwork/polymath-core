pragma solidity ^0.5.0;

/**
 * @title Interface that every module factory contract should implement
 */
interface IModuleFactory {
    event ChangeSetupCost(uint256 _oldSetupCost, uint256 _newSetupCost);
    event ChangeUsageCost(uint256 _oldUsageCost, uint256 _newUsageCost);
    event GenerateModuleFromFactory(
        address _module,
        bytes32 indexed _moduleName,
        address indexed _moduleFactory,
        address _creator,
        uint256 _setupCost,
        uint256 _setupCostInPoly,
        uint256 _timestamp
    );
    event ChangeSTVersionBound(string _boundType, uint8 _major, uint8 _minor, uint8 _patch);

    //Should create an instance of the Module, or throw
    function deploy(bytes calldata _data) external returns(address);

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory);

    /**
     * @notice Get the name of the Module
     */
    function getName() external view returns(bytes32);

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory);

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory);

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
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion New version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external;

    /**
     * @notice Get the setup cost of the module in USD
     */
    function getSetupCost() external view returns(uint256);

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCostInPoly() external view returns (uint256);

    /**
     * @notice Used to get the lower bound
     * @return Lower bound
     */
    function getLowerSTVersionBounds() external view returns(uint8[] memory);

    /**
     * @notice Used to get the upper bound
     * @return Upper bound
     */
    function getUpperSTVersionBounds() external view returns(uint8[] memory);

}
