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
    mapping(address => uint256) feeCollected;

    constructor (address[] memory _owners, uint _required, address _polymathRegistry)
    MultiSigWallet(_owners, _required)
    public
    {
        require(_polymathRegistry != address(0), "Invalid address");
        polymathRegistry = IPolymathRegistry(_polymathRegistry);
        polyToken = IERC20(polymathRegistry.getAddress("polyToken"));
        securityTokenRegistry = ISecurityTokenRegistry(polymathRegistry.getAddress("securityTokenRegistry"));
    }

    function withdrawFee(address _securityToken, uint256 _usageCost) external {
        require(securityTokenRegistry.isSecurityToken(_securityToken), "Invalid securityToken");
        polyToken.transferFrom(msg.sender, address(this), _usageCost);
        address whitelablers = ISecurityToken(_securityToken).owner();
        feeCollected[whitelablers] = feeCollected[whitelablers].add(_usageCost);
    }

    function getRebate() external {
        uint256 fee = feeCollected[msg.sender];
        uint256 rebateCollected = (fee.mul(rebatePercentage)).div(10 ** 18);
        feeCollected[msg.sender] = uint256(0);
        polyToken.transfer(msg.sender, rebateCollected);
    }

    // function changeRebatePercentage(uint256 _rebatePercentage) external returns (type name) {
        
    // }
    
}