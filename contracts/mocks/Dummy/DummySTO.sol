pragma solidity 0.5.8;

import "../../modules/STO/STO.sol";
import "../../interfaces/ISecurityToken.sol";
import "./DummySTOStorage.sol";

/**
 * @title STO module for sample implementation of a different crowdsale module
 */
contract DummySTO is DummySTOStorage, STO {

    event GenerateTokens(address _investor, uint256 _amount);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice Function used to intialize the differnet variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _cap Maximum No. of tokens for sale
     * @param _someString Any string that contails the details
     */
    function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, string memory _someString) public onlyFactory {
        startTime = _startTime;
        endTime = _endTime;
        cap = _cap;
        someString = _someString;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return this.configure.selector;
    }

    /**
     * @notice Function used to generate the tokens
     * @param _investor Address of the investor
     * @param _amount Amount of ETH or Poly invested by the investor
     */
    function generateTokens(address _investor, uint256 _amount) public withPerm(ADMIN) {
        require(!paused, "Should not be paused");
        require(_amount > 0, "Amount should be greater than 0");
        require(_canBuy(_investor), "Unauthorized");
        securityToken.issue(_investor, _amount, "");
        if (investors[_investor] == 0) {
            investorCount = investorCount + 1;
        }
        //TODO: Add SafeMath maybe
        investors[_investor] = investors[_investor] + _amount;
        emit GenerateTokens(_investor, _amount);
    }

    /**
     * @notice Returns the total no. of investors
     */
    function getNumberInvestors() public view returns(uint256) {
        return investorCount;
    }

    /**
     * @notice Returns the total no. of investors
     */
    function getTokensSold() external view returns(uint256) {
        return 0;
    }

    /**
     * @notice Returns the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    function () external payable {
        //Payable fallback function to allow us to test leaking ETH
    }

}
