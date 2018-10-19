pragma solidity ^0.4.24;

import "./../ModuleFactory.sol";
import "./SingleTradeVolumeRestrictionTM.sol";
import "../../libraries/Util.sol";
/**
 * @title Factory for deploying SingleTradeVolumeRestrictionManager
 */
contract SingleTradeVolumeRestrictionTMFactory is ModuleFactory {


    /**
    * @notice Constructor
    * @param _polyAddress Address of the polytoken
    * @param _setupCost Setup cost of the module
    * @param _usageCost Usage cost of the module
    * @param _subscriptionCost Subscription cost of the module
    */
    constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "SingleTradeVolumeRestrictionTM";
        title = "Single Trade Volume Restriction Manager";
        description = "Imposes volume restriction on a single trade";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
    * @notice used to launch the Module with the help of factory
    * @return address Contract address of the Module
    */
    function deploy(bytes _data) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        SingleTradeVolumeRestrictionTM singleTradeVolumeRestrictionManager = new SingleTradeVolumeRestrictionTM(msg.sender, address(polyToken));

        require(Util.getSig(_data) == singleTradeVolumeRestrictionManager.getInitFunction(), "Provided data is not valid");
        require(address(singleTradeVolumeRestrictionManager).call(_data), "Unsuccessful call");
        emit GenerateModuleFromFactory(address(singleTradeVolumeRestrictionManager), getName(), address(this), msg.sender, setupCost, now);
        return address(singleTradeVolumeRestrictionManager);
    }

    /**
    * @notice Get the types of the Module factory
    * @return uint8[]
    */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
    * @notice Get the name of the Module
    * @return bytes32
    */
    function getName() public view returns(bytes32) {
        return name;
    }

    /**
    * @notice Get the description of the Module
    * @return string
    */
    function getDescription() external view returns(string) {
        return description;
    }

    /**
    * @notice Get the title of the Module
    * @return string
    */
    function getTitle() external view returns(string) {
        return title;
    }

    /**
    * @notice Get the Instructions that help to use the module
    * @return string
    */
    function getInstructions() external view returns(string) {
        return "Allows an issuer to impose volume restriction on a single trade. Init function takes two parameters. First parameter is a bool indicating if restriction is in percentage. The second parameter is the value in percentage or amount of tokens";
    }

    /**
    * @notice Get the version of the Module
    * @return string
    */
    function getVersion() external view returns(string) {
        return version;
    }

    /**
    * @notice Get the setup cost of the module
    * return uint256
    */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }
    /**
    * @notice Get the tags related to the module factory
    * @return bytes32[]
    */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](3);
        availableTags[0] = "Single Trade";
        availableTags[1] = "Transfer";
        availableTags[2] = "Volume";
        return availableTags;
    }

}
