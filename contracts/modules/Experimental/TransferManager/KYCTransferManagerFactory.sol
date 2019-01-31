pragma solidity ^0.5.0;

import "./KYCTransferManager.sol";
import "./../../ModuleFactory.sol";


contract KYCTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        version = "1.0.0";
        name = "KYCTransferManager";
        title = "KYC Transfer Manager";
        description = "Manages KYC";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }


     /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata /* _data */) external returns(address) {
        address polyToken = _takeFee();
        address kycTransferManager = address(new KYCTransferManager(msg.sender, polyToken));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(kycTransferManager, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return kycTransferManager;
    }


    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](2);
        res[0] = 2;
        res[1] = 6;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        /*solium-disable-next-line max-len*/
        return "pray it works";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](1);
        availableTags[0] = "KYC";
        return availableTags;
    }

}
