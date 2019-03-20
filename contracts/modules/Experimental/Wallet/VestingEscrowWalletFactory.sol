pragma solidity ^0.5.0;

import "./VestingEscrowWalletProxy.sol";
import "../../../interfaces/IBoot.sol";
import "../../UpgradableModuleFactory.sol";
import "../../../libraries/Util.sol";

/**
 * @title Factory for deploying VestingEscrowWallet module
 */
contract VestingEscrowWalletFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry) public
    UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "VestingEscrowWallet";
        title = "Vesting Escrow Wallet";
        description = "Manage vesting schedules to employees / affiliates";
        typesData.push(7);
        tagsData.push("Vesting");
        tagsData.push("Escrow");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address vestingEscrowWallet = address(new VestingEscrowWalletProxy(logicContracts[latestUpgrade].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(vestingEscrowWallet, _data);
        return vestingEscrowWallet;
    }

}
