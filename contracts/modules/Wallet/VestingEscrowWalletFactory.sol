pragma solidity ^0.4.24;

import "./VestingEscrowWallet.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying VestingEscrowWallet
 */
contract VestingEscrowWalletFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        version = "1.0.0";
        name = "VestingEscrowWallet";
        title = "Vesting Escrow Wallet";
        description = "Allows Issuer to program an automated token vesting schedule for employees and/or affiliates so that Tokens get delivered to their wallets as contractually defined.";
    }

    /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom because of sufficent Allowance is not provided");
        address vestingEscrwoWallet = new VestingEscrowWallet(msg.sender, address(polyToken));
        emit LogGenerateModuleFromFactory(vestingEscrwoWallet, getName(), address(this), msg.sender, setupCost, now);
        return vestingEscrwoWallet;
    }

    /**
     * @notice Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 5;
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
        return "Configure and track vesting allocations";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](1);
        availableTags[0] = "Vested Wallet";
        availableTags[1] = "Escrow";
        return availableTags;
    }

}
