pragma solidity ^0.4.24;

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
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _logicContract) public
    ModuleFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
        require(_logicContract != address(0), "Invalid address");
        version = "1.0.0";
        name = "VestingEscrowWallet";
        title = "Vesting Escrow Wallet";
        description = "Manage vesting schedules to employees / affiliates";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(2), uint8(9), uint8(9));
        logicContract = _logicContract;
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if (setupCost > 0) {
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Failed transferFrom due to insufficent Allowance provided");
        }
        VestingEscrowWalletProxy vestingEscrowWallet = new VestingEscrowWalletProxy(msg.sender, address(polyToken), logicContract);
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IBoot(vestingEscrowWallet).getInitFunction(), "Invalid data");
        /*solium-disable-next-line security/no-low-level-calls*/
        require(address(vestingEscrowWallet).call(_data), "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(vestingEscrowWallet), getName(), address(this), msg.sender, setupCost, now);
        return address(vestingEscrowWallet);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 6;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        /*solium-disable-next-line max-len*/
        return "Issuer can deposit tokens to the contract and create the vesting schedule for the given address (Affiliate/Employee). These address can withdraw tokens according to there vesting schedule.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Vested";
        availableTags[1] = "Escrow Wallet";
        return availableTags;
    }
}
