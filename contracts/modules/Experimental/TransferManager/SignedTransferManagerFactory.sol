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
        version = "1.0.0";
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
    // function deploy(bytes calldata /* _data */) external returns(address) {
    //     if (setupCost > 0)
    //         require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
    //     address signedTransferManager = new SignedTransferManager(msg.sender, address(polyToken));
    //     emit GenerateModuleFromFactory(address(signedTransferManager), getName(), address(this), msg.sender, setupCost, now);
    //     return address(signedTransferManager);
    // }

     function deploy(bytes calldata /* _data */) external returns(address) {
        address polyToken = _takeFee();
        SignedTransferManager signedTransferManager = new SignedTransferManager(msg.sender, polyToken);
        emit GenerateModuleFromFactory(address(signedTransferManager), getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return address(signedTransferManager);
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
     * @notice Get the Instructions that helped to used the module
     */
    function getInstructions() external view returns(string memory) {
        return "Allows an issuer to maintain a list of signers who can validate transfer request using signatures. A mapping is used to track valid signers which can be managed by the issuer. verifytransfer function takes in a signature and if the signature is valid, it will verify the transfer. invalidSigature function allow the signer to make a signature invalid after it is signed. Init function takes no parameters.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Signed";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
