pragma solidity ^0.4.24;

import "../../interfaces/IModuleFactory.sol";
import "./SingleTradeVolumeRestrictionManager.sol";
contract SingleTradeVolumeRestrictionFactory is IModuleFactory {

  /**
   * @notice Constructor
   * @param _polyAddress Address of the polytoken
   * @param _setupCost Setup cost of the module
   * @param _usageCost Usage cost of the module
   * @param _subscriptionCost Subscription cost of the module
   */
  constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
  IModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
  {

  }

  /**
   * @notice used to launch the Module with the help of factory
   * @return address Contract address of the Module
   */
  function deploy(bytes _data) external returns(address) {
      if (setupCost > 0)
          require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
      SingleTradeVolumeRestrictionManager singleTradeVolumeRestrictionManager = new SingleTradeVolumeRestrictionManager(msg.sender, address(polyToken));
      require(getSig(_data) == singleTradeVolumeRestrictionManager.getInitFunction(), "Provided data is not valid");
      require(address(singleTradeVolumeRestrictionManager).call(_data), "Un-successfull call");
      emit LogGenerateModuleFromFactory(address(singleTradeVolumeRestrictionManager), getName(), address(this), msg.sender, now);
      return address(singleTradeVolumeRestrictionManager);
  }

  /**
   * @notice Type of the Module factory
   */
  function getType() public view returns(uint8) {
      return 2;
  }

  /**
   * @notice Get the name of the Module
   */
  function getName() public view returns(bytes32) {
      return "SingleTradeVolumeRestriction";
  }

  /**
   * @notice Get the description of the Module
   */
  function getDescription() public view returns(string) {
      return "Imposes volume restriction on a single trade";
  }

  /**
   * @notice Get the title of the Module
   */
  function getTitle() public  view returns(string) {
      return "Single Trade Volume Restriction";
  }

  /**
   * @notice Get the Instructions that help to use the module
   */
  function getInstructions() public view returns(string) {
      return "Allows an issuer to impose volume restriction on a single trade";
  }

  /**
   * @notice Get the tags related to the module factory
   */
  function getTags() public view returns(bytes32[]) {
      bytes32[] memory availableTags = new bytes32[](3);
      availableTags[0] = "Single Trade";
      availableTags[1] = "Transfer";
      availableTags[2] = "Volume";
      return availableTags;
  }

}
