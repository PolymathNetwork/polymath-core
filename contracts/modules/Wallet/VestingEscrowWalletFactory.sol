pragma solidity 0.5.8;

import "./VestingEscrowWalletProxy.sol";
import "../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying VestingEscrowWallet module
 */
contract VestingEscrowWalletFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.1.0", _setupCost, _usageCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "VestingEscrowWallet";
        title = "Vesting Escrow Wallet";
        description = "Manage vesting schedules to employees / affiliates";
        typesData.push(7);
        typesData.push(8); // Extra type which will allow module to hold and send securityTokens without being added in KYC data
        typesData.push(9); // Auto whitelist treasury wallet
        tagsData.push("Vesting");
        tagsData.push("Escrow");
        tagsData.push("Transfer Restriction");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address vestingEscrowWallet = address(new VestingEscrowWalletProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(vestingEscrowWallet, _data);
        return vestingEscrowWallet;
    }

}
