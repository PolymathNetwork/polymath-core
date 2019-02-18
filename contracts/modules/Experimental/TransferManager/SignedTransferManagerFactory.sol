pragma solidity ^0.5.0;

import "./SignedTransferManager.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying SignedTransferManager module
 */
contract SignedTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        initialVersion = "3.0.0";
        name = "SignedTransferManager";
        title = "Signed Transfer Manager";
        description = "Manage transfers using a signature";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }


     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
     function deploy(bytes calldata _data) external returns(address) {
        address signedTransferManager = address(new SignedTransferManager(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(signedTransferManager, _data);
        return signedTransferManager;
    }


    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](2);
        res[0] = 2;
        res[1] = 6;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Signed";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
