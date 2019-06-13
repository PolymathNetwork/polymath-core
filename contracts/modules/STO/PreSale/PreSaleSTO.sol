pragma solidity 0.5.8;

import "../STO.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./PreSaleSTOStorage.sol";

/**
 * @title STO module for private presales
 */
contract PreSaleSTO is PreSaleSTOStorage, STO {
    using SafeMath for uint256;

    event TokensAllocated(address _investor, uint256 _amount);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice Function used to initialize the different variables
     * @param _endTime Unix timestamp at which offering ends
     */
    function configure(uint256 _endTime) public onlyFactory {
        require(_endTime != 0, "endTime should not be 0");
        endTime = _endTime;
    }

    /**
     * @notice This function returns the signature of the configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return this.configure.selector;
    }

    /**
     * @notice Returns the total no. of investors
     */
    function getNumberInvestors() public view returns(uint256) {
        return investorCount;
    }

    /**
     * @notice Returns the total no. of tokens sold
     */
    function getTokensSold() external view returns(uint256) {
        return totalTokensSold;
    }

    /**
     * @notice Returns the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    /**
     * @notice Function used to allocate tokens to the investor
     * @param _investor Address of the investor
     * @param _amount No. of tokens to be transferred to the investor
     * @param _etherContributed How much ETH was contributed
     * @param _polyContributed How much POLY was contributed
     */
    function allocateTokens(
        address _investor,
        uint256 _amount,
        uint256 _etherContributed,
        uint256 _polyContributed
    )
        public
        withPerm(ADMIN)
    {
        /*solium-disable-next-line security/no-block-members*/
        require(now <= endTime, "Already passed Endtime");
        require(_amount > 0, "No. of tokens provided should be greater the zero");
        require(_canBuy(_investor), "Unauthorized");
        securityToken.issue(_investor, _amount, "");
        if (investors[_investor] == uint256(0)) {
            investorCount = investorCount.add(1);
        }
        investors[_investor] = investors[_investor].add(_amount);
        fundsRaised[uint8(FundRaiseType.ETH)] = fundsRaised[uint8(FundRaiseType.ETH)].add(_etherContributed);
        fundsRaised[uint8(FundRaiseType.POLY)] = fundsRaised[uint8(FundRaiseType.POLY)].add(_polyContributed);
        totalTokensSold = totalTokensSold.add(_amount);
        emit TokensAllocated(_investor, _amount);
    }

    /**
     * @notice Function used to allocate tokens to multiple investors
     * @param _investors Array of address of the investors
     * @param _amounts Array of no. of tokens to be transferred to the investors
     * @param _etherContributed Array of amount of ETH contributed by each investor
     * @param _polyContributed Array of amount of POLY contributed by each investor
     */
    function allocateTokensMulti(
        address[] memory _investors,
        uint256[] memory _amounts,
        uint256[] memory _etherContributed,
        uint256[] memory _polyContributed
    )
        public
        withPerm(ADMIN)
    {
        require(_investors.length == _amounts.length, "Mis-match in length of the arrays");
        require(_etherContributed.length == _polyContributed.length, "Mis-match in length of the arrays");
        require(_etherContributed.length == _investors.length, "Mis-match in length of the arrays");
        for (uint256 i = 0; i < _investors.length; i++) {
            allocateTokens(_investors[i], _amounts[i], _etherContributed[i], _polyContributed[i]);
        }
    }
}
