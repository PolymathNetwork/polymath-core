pragma solidity ^0.5.8;

import "./MultiSigWallet.sol";
import "../interfaces/ISecurityTokenRegistry.sol";
import "../interfaces/IPolymathRegistry.sol";
import "../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract CustomMultiSigWallet is MultiSigWallet {

    using SafeMath for uint256;

    IPolymathRegistry polymathRegistry;
    IERC20 polyToken;
    ISecurityTokenRegistry securityTokenRegistry;
    uint256 public rebatePercentage;

    struct Rebate {
        uint256 totalRebateClaimed;
        uint256 totalFeeCollected;
        uint256 feeCollected;
    }

    mapping(address => Rebate) public rebates;

    event ChangeRebatePercentage(uint256 _oldRebatePercentage, uint256 _newRebatePercentage);
    event WithdrawRebate(address indexed _whitelabler, uint256 _rebateAmount);

    constructor (address[] memory _owners, uint _required, address _polymathRegistry)
    MultiSigWallet(_owners, _required)
    public
    {
        require(_polymathRegistry != address(0), "Invalid address");
        polymathRegistry = IPolymathRegistry(_polymathRegistry);
        polyToken = IERC20(polymathRegistry.getAddress("polyToken"));
        securityTokenRegistry = ISecurityTokenRegistry(polymathRegistry.getAddress("securityTokenRegistry"));
    }

    /**
     * @notice It will be used to take usage fee from the modules
     * @param _securityToken address of the securityToken
     * @param _usageCost Fee for the given module task
     */
    function takeUsageFee(address _securityToken, uint256 _usageCost) external {
        require(securityTokenRegistry.isSecurityToken(_securityToken), "Invalid securityToken");
        polyToken.transferFrom(msg.sender, address(this), _usageCost);
        address whitelablers = ISecurityToken(_securityToken).owner(); // Here we will get the whitelabeller from the STR
        rebates[whitelablers].feeCollected = rebates[whitelablers].feeCollected.add(_usageCost);
    }

    /**
     * @notice Use to withdraw the rebate by the whitelabelers
     * @dev only valid whitelabelers can execute this function
     */
    function withdrawRebate() external {
        uint256 rebateCollected = getRebateAmount(msg.sender);
        rebates[msg.sender].totalFeeCollected = rebates[msg.sender].totalFeeCollected.add(rebates[msg.sender].feeCollected);
        rebates[msg.sender].feeCollected = uint256(0);
        rebates[msg.sender].totalRebateClaimed = rebates[msg.sender].totalRebateClaimed.add(rebateCollected);
        polyToken.transfer(msg.sender, rebateCollected);
        emit WithdrawRebate(msg.sender, rebateCollected);
    }

    /**
     * @notice Get the rebate amount for the given whitelabeler
     */
    function getRebateAmount(address _whitelabeler) public view returns(uint256 rebate) {
        rebate = (rebates[_whitelabeler].feeCollected.mul(rebatePercentage)).div(10 ** 18);
    }

    /**
     * @notice Use to change the rebate percentage
     * @dev needs consensus by the signers to execute the transaction
     * @param _rebatePercentage New rebate percentage
     */
    function changeRebatePercentage(uint256 _rebatePercentage) public onlyWallet {
        require(_rebatePercentage <= 100 * 10 ** 16, "Invalid rebate percentage");
        emit ChangeRebatePercentage(rebatePercentage, _rebatePercentage);
        rebatePercentage = _rebatePercentage;
    }
    
}