pragma solidity ^0.4.24;

import "../../interfaces/IUSDTieredSTOProxy.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract USDTieredSTOFactory is ModuleFactory {

    address public USDTieredSTOProxyAddress;

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "USDTieredSTO";
        title = "USD Tiered STO";
        description = "USD Tiered STO";
        compatibleSTVersionRange[bytes32("lowerBound")] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange[bytes32("upperBound")] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Sufficent Allowance is not provided");
        //Check valid bytes - can only call module init function
        address usdTieredSTO = IUSDTieredSTOProxy(USDTieredSTOProxyAddress).deploySTO(msg.sender, address(polyToken));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IUSDTieredSTOProxy(USDTieredSTOProxyAddress).getInitFunction(usdTieredSTO), "Invalid data");
        require(IUSDTieredSTOProxy(USDTieredSTOProxyAddress).initialize(usdTieredSTO, _data), "Unsuccessfull call");
        emit GenerateModuleFromFactory(address(usdTieredSTO), getName(), address(this), msg.sender, setupCost, now);
        return address(usdTieredSTO);
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 3;
    }

    /**
     * @notice Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return name;
    }

    /**
     * @notice Get the description of the Module
     */
    function getDescription() public view returns(string) {
        return description;
    }

    /**
     * @notice Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return title;
    }

    /**
     * @notice Get the version of the Module
     */
    function getVersion() external view returns(string) {
        return version;
    }

    /**
     * @notice Get the setup cost of the module
     */
    function getSetupCost() external view returns (uint256) {
        return setupCost;
    }

    /**
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Initialises a USD tiered STO.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "USD";
        availableTags[1] = "Tiered";
        availableTags[2] = "POLY";
        availableTags[3] = "ETH";
        return availableTags;
    }

    /**
     * @notice Function use to set the proxy address 
     * @param _proxyAddress Address of the proxy factory contract
     */
    function setProxyFactoryAddress(address _proxyAddress) public onlyOwner {
        require(_proxyAddress != address(0));
        USDTieredSTOProxyAddress = _proxyAddress;
    }

}
