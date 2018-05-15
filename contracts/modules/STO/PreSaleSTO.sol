pragma solidity ^0.4.23;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PreSaleSTO is ISTO {
    using SafeMath for uint256;

    bytes32 public constant PRE_SALE_ADMIN = "PRE_SALE_ADMIN";

    event TokensAllocated(address _investor, uint256 _amount);

    mapping (address => uint256) public investors;

    uint256 public investorCount;

    uint256 public endTime;
    uint256 public etherRaised;
    uint256 public polyRaised;

    constructor (address _securityToken, address _polyAddress) public
      IModule(_securityToken, _polyAddress)
    {
    }

    function configure(uint256 _endTime) public onlyFactory {
        require(_endTime != 0);
        endTime = _endTime;
    }

    function getInitFunction() public returns (bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    function getRaisedEther() public view returns (uint256) {
        return etherRaised;
    }

    function getRaisedPOLY() public view returns (uint256) {
        return polyRaised;
    }

    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = PRE_SALE_ADMIN;
        return allPermissions;
    }

    function allocateTokens(address _investor, uint256 _amount, uint256 _etherContributed, uint256 _polyContributed) public withPerm(PRE_SALE_ADMIN)
    {
        require(now <= endTime);
        require(_amount > 0);
        IST20(securityToken).mint(_investor, _amount);
        investors[_investor] = investors[_investor].add(_amount);
        investorCount = investorCount.add(1);
        etherRaised = etherRaised.add(_etherContributed);
        polyRaised = polyRaised.add(_polyContributed);
        emit TokensAllocated(_investor, _amount);
    }

    function allocateTokensMulti(address[] _investors, uint256[] _amounts, uint256 _etherContributed, uint256 _polyContributed) public withPerm(PRE_SALE_ADMIN)
    {
        require(_investors.length == _amounts.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            allocateTokens(_investors[i], _amounts[i], _etherContributed, _polyContributed);
        }
    }
}