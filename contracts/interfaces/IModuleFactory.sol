pragma solidity ^0.4.24;

/**
 * @title Interface that any module factory contract should implement
 */
interface IModuleFactory {

    event LogChangeFactorySetupFee(uint256 _oldSetupCost, uint256 _newSetupCost, address _moduleFactory);
    event LogChangeFactoryUsageFee(uint256 _oldUsageCost, uint256 _newUsageCost, address _moduleFactory);
    event LogChangeFactorySubscriptionFee(uint256 _oldSubscriptionCost, uint256 _newMonthlySubscriptionCost, address _moduleFactory);
    event LogGenerateModuleFromFactory(
        address _module,
        bytes32 indexed _moduleName,
        address indexed _moduleFactory,
        address _creator,
        uint256 _setupCost,
        uint256 _timestamp
    );

    //Should create an instance of the Module, or throw
    function deploy(bytes _data) external returns(address);

    /**
     * @notice Type of the Module factory
     */
    function getType() external view returns(uint8);

    /**
     * @notice Get the name of the Module
     */
    function getName() external view returns(bytes32);

    /**
     * @notice Get the description of the Module
     */
    function getDescription() external view returns(string);

    /**
     * @notice Get the title of the Module
     */
    function getTitle() external view returns(string);

    /**
     * @notice Get the version of the Module
     */
    function getVersion() public view returns(string);

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() external view returns (string);

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns (bytes32[]);

    /**
     * @notice used to change the fee of the setup cost
     * @param _newSetupCost new setup cost
     */
    function changeFactorySetupFee(uint256 _newSetupCost) external;

    /**
     * @notice used to change the fee of the usage cost
     * @param _newUsageCost new usage cost
     */
    function changeFactoryUsageFee(uint256 _newUsageCost) external;

    /**
     * @notice used to change the fee of the subscription cost
     * @param _newSubscriptionCost new subscription cost
     */
    function changeFactorySubscriptionFee(uint256 _newSubscriptionCost) external;

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256);

}
