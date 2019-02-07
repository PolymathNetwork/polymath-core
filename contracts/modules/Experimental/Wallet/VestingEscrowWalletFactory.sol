pragma solidity ^0.5.0;

import "../../../proxy/VestingEscrowWalletProxy.sol";
import "../../../interfaces/IBoot.sol";
import "../../ModuleFactory.sol";
import "../../../libraries/Util.sol";

/**
 * @title Factory for deploying VestingEscrowWallet module
 */
contract VestingEscrowWalletFactory is ModuleFactory {

    address public logicContract;
    /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        require(_logicContract != address(0), "Invalid address");
        version = "1.0.0";
        name = "VestingEscrowWallet";
        title = "Vesting Escrow Wallet";
        description = "Manage vesting schedules to employees / affiliates";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyToken = _takeFee();
        address vestingEscrowWallet = address(new VestingEscrowWalletProxy(msg.sender, address(polyToken), logicContract));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IBoot(vestingEscrowWallet).getInitFunction(), "Invalid data");
        bool success;
        /*solium-disable-next-line security/no-low-level-calls*/
        (success, ) = vestingEscrowWallet.call(_data);
        require(success, "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(vestingEscrowWallet, getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return vestingEscrowWallet;
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory)  {
        uint8[] memory res = new uint8[](1);
        res[0] = 6;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string memory) {
        /*solium-disable-next-line max-len*/
        return "Issuer can deposit tokens to the contract and create the vesting schedule for the given address (Affiliate/Employee). These address can withdraw tokens according to there vesting schedule.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Vested";
        availableTags[1] = "Escrow Wallet";
        return availableTags;
    }
}
