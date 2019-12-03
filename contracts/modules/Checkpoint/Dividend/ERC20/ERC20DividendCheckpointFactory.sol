pragma solidity 0.5.8;

import "./ERC20DividendCheckpointProxy.sol";
import "../../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying ERC20DividendCheckpoint module
 */
contract ERC20DividendCheckpointFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the key action
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
        name = "ERC20DividendCheckpoint";
        title = "ERC20 Dividend Checkpoint";
        description = "Create ERC20 dividends for token holders at a specific checkpoint";
        typesData.push(4);
        typesData.push(9); // Auto whitelist treasury wallet
        tagsData.push("ERC20");
        tagsData.push("Dividend");
        tagsData.push("Checkpoint");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address erc20DividendCheckpoint = address(new ERC20DividendCheckpointProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(erc20DividendCheckpoint, _data);
        return erc20DividendCheckpoint;
    }

}
