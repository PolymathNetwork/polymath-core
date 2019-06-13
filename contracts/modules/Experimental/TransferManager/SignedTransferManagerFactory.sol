pragma solidity 0.5.8;

import "./SignedTransferManager.sol";
import "../../ModuleFactory.sol";

/**
 * @title Factory for deploying SignedTransferManager module
 */
contract SignedTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     */
    constructor(
        uint256 _setupCost,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public ModuleFactory(_setupCost, _polymathRegistry, _isCostInPoly)
    {
        initialVersion = "3.0.0";
        name = "SignedTransferManager";
        title = "Signed Transfer Manager";
        description = "Manage transfers using a signature";
        typesData.push(2);
        typesData.push(6);
        tagsData.push("Signed");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }


     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
     function deploy(bytes calldata _data) external returns(address) {
        address signedTransferManager = address(new SignedTransferManager(msg.sender, polymathRegistry.getAddress("PolyToken")));
        _initializeModule(signedTransferManager, _data);
        return signedTransferManager;
    }

}
