pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title STO module for private presales
 */
contract PreSaleSTO is ISTO {
    using SafeMath for uint256;

    bytes32 public constant PRE_SALE_ADMIN = "PRE_SALE_ADMIN";

    event TokensAllocated(address _investor, uint256 _amount);

    mapping (address => uint256) public investors;

    uint256 public investorCount;

    uint256 public etherRaised;
    uint256 public polyRaised;

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress) public
      IModule(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice Function used to intialize the differnet variables
     * @param _endTime Unix timestamp at which offering get ended
     */
    function configure(uint256 _endTime) public onlyFactory {
        require(_endTime != 0);
        endTime = _endTime;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public returns (bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
     * @notice Return ETH raised by the STO
     */
    function getRaisedEther() public view returns (uint256) {
        return etherRaised;
    }

    /**
     * @notice Return POLY raised by the STO
     */
    function getRaisedPOLY() public view returns (uint256) {
        return polyRaised;
    }

    /**
     * @notice Return the total no. of investors
     */
    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = PRE_SALE_ADMIN;
        return allPermissions;
    }

    /**
     * @notice Function used to allocate tokens to the investor
     * @param _investor Address of the investor
     * @param _amount No. of tokens need to transfered to the investor
     * @param _etherContributed How much amount of ETH get contributed
     * @param _polyContributed How much amount of POLY get contributed
     */
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

    /**
     * @notice Function used to allocate tokens to the multiple investor
     * @param _investors Array of address of the investors
     * @param _amounts Array of no. of tokens need to transfered to the investors
     * @param _etherContributed Total amount of ETH get contributed
     * @param _polyContributed Total amount of POLY get contributed
     */
    function allocateTokensMulti(address[] _investors, uint256[] _amounts, uint256 _etherContributed, uint256 _polyContributed) public withPerm(PRE_SALE_ADMIN)
    {
        require(_investors.length == _amounts.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            allocateTokens(_investors[i], _amounts[i], _etherContributed, _polyContributed);
        }
    }
}
