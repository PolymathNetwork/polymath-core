pragma solidity ^0.4.23;

import "./IStaking.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract SimpleStaking is IStaking {
    
    using SafeMath for uint256;

    bytes32 public constant WHITELIST = "WHITELIST";

    mapping(address => bool) public allowedModule;
    mapping(address => mapping(address => Securitiesholders)) public holdingsData;
    mapping(address => StakingMetrics) public staking;

    struct StakingMetrics {
        uint256 startDate;
        uint256 endDate;
        uint256 totalstake;
    }

    struct Securitiesholders {
        uint256 balance;
        bool isWithDarawal;
        uint256 timestamp;
    }

    event LogWhitelistModule(bytes32 _moduleName, address _moduleAddress, uint256 _timestamp);
    event LogIntiateStaking(uint256 _startDate, uint256 _endDate, address _initiator, uint256 _timestamp);
    event LogParticipate(address _holder, uint256 _stakingbalance, address _moduleAddress);

    /// @notice Constructor
    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
    {
    }

    function intiateStaking(uint256 _startDate, uint256 _endDate) public {
        require(_startDate >= now && _endDate > _startDate);
        require(allowedModule[msg.sender] == true);
        require(staking[msg.sender].endDate != 0 && now > staking[msg.sender].endDate);
        staking[msg.sender] = StakingMetrics(_startDate, _endDate, 0);
        emit LogIntiateStaking(_startDate, _endDate, msg.sender, now);
    }

    function whitelistModule(uint8 _moduleType, bytes32 _moduleName) public withPerm(WHITELIST) {
        address moduleAddress;
        bool locked;
        (,moduleAddress,locked)= ISecurityToken(securityToken).getModuleByName(_moduleType, _moduleName);
        require(moduleAddress != address(0) && locked == true);
        allowedModule[moduleAddress] = true;
        emit LogWhitelistModule(_moduleName, moduleAddress, now);
    }

    function participate(address _moduleAddress) public {
        require(staking[_moduleAddress].endDate >= now && now >= staking[_moduleAddress].startDate);
        uint256 balance = ERC20(securityToken).balanceOf(msg.sender);
        require(ERC20(securityToken).transferFrom(msg.sender, address(this), balance));
        holdingsData[_moduleAddress][msg.sender] = Securitiesholders(balance, false, now);
        staking[_moduleAddress].totalstake = (staking[_moduleAddress].totalstake).add(balance);
        emit LogParticipate(msg.sender, balance, _moduleAddress);
    }

    function provideAllowance() public returns(bool) {
        require(allowedModule[msg.sender] == true);
        require(ERC20(securityToken).approve(msg.sender, staking[msg.sender].totalstake));
        return true;
    }

    function updateStatus(address _holder) public returns(bool) {
        require(allowedModule[msg.sender] == true);
        holdingsData[msg.sender][_holder].isWithDarawal = true;
        return true;
    }
    
    function getHolderByModule(address _moduleAddress, address _holderAddress) public returns(uint256, bool, uint256) {
        return (
            holdingsData[_moduleAddress][_holderAddress].balance,
            holdingsData[_moduleAddress][_holderAddress].isWithDarawal,
            holdingsData[_moduleAddress][_holderAddress].timestamp
        );
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    /**
    * @dev Use to get the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = WHITELIST;
        return allPermissions;
    }

}