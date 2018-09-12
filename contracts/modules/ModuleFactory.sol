pragma solidity ^0.4.24;

import "../interfaces/IERC20.sol";
import "../interfaces/IModuleFactory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {

    IERC20 public polyToken;
    uint256 public setupCost;
    uint256 public usageCost;
    uint256 public monthlySubscriptionCost;
    string public description;
    string public version;
    bytes32 public name;
    string public title;

    event LogChangeFactorySetupFee(uint256 _oldSetupCost, uint256 _newSetupCost, address _moduleFactory);
    event LogChangeFactoryUsageFee(uint256 _oldUsageCost, uint256 _newUsageCost, address _moduleFactory);
    event LogChangeFactorySubscriptionFee(uint256 _oldSubscriptionCost, uint256 _newMonthlySubscriptionCost, address _moduleFactory);
    event LogGenerateModuleFromFactory(address _module, bytes32 indexed _moduleName, address indexed _moduleFactory, address _creator, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public {
      polyToken = IERC20(_polyAddress);
      setupCost = _setupCost;
      usageCost = _usageCost;
      monthlySubscriptionCost = _subscriptionCost;
    }

    //Pull function sig from _data
    function _getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < len; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (len - 1 - i))));
        }
    }

    /**
     * @notice used to change the fee of the setup cost
     * @param _newSetupCost new setup cost
     */
    function changeFactorySetupFee(uint256 _newSetupCost) public onlyOwner {
        emit LogChangeFactorySetupFee(setupCost, _newSetupCost, address(this));
        setupCost = _newSetupCost;
    }

    /**
     * @notice used to change the fee of the usage cost
     * @param _newUsageCost new usage cost
     */
    function changeFactoryUsageFee(uint256 _newUsageCost) public onlyOwner {
        emit LogChangeFactoryUsageFee(usageCost, _newUsageCost, address(this));
        usageCost = _newUsageCost;
    }

    /**
     * @notice used to change the fee of the subscription cost
     * @param _newSubscriptionCost new subscription cost
     */
    function changeFactorySubscriptionFee(uint256 _newSubscriptionCost) public onlyOwner {
        emit LogChangeFactorySubscriptionFee(monthlySubscriptionCost, _newSubscriptionCost, address(this));
        monthlySubscriptionCost = _newSubscriptionCost;

    }

    /**
     * @notice Update the title of the ModuleFactory
     * @param _newTitle New Title that will replace the old one.
     */
    function changeTitle(string _newTitle) public onlyOwner {
        require(bytes(_newTitle).length > 0);
        title = _newTitle;
    }

    /**
     * @notice Update the description of the ModuleFactory
     * @param _newDesc New description that will replace the old one.
     */
    function changeDescription(string _newDesc) public onlyOwner {
        require(bytes(_newDesc).length > 0);
        description = _newDesc;
    }

    /**
     * @notice Update the name of the ModuleFactory
     * @param _newName New name that will replace the old one.
     */
    function changeName(bytes32 _newName) public onlyOwner {
        require(_newName != bytes32(0));
        name = _newName;
    }

    /**
     * @notice Update the version of the ModuleFactory
     * @param _newVersion New name that will replace the old one.
     */
    function changeVersion(string _newVersion) public onlyOwner {
        require(bytes(_newVersion).length > 0 );
        version = _newVersion;
    }

}
