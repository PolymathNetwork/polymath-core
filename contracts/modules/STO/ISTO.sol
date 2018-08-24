pragma solidity ^0.4.24;

import "../../Pausable.sol";
import "../../interfaces/IModule.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Interface to be implemented by all STO modules
 */
contract ISTO is IModule, Pausable {
    using SafeMath for uint256;

    enum FundRaiseType { ETH, POLY }
    mapping (uint8 => bool) public fundRaiseType;

    // Start time of the STO
    uint256 public startTime;
    // End time of the STO
    uint256 public endTime;
    // Time STO was paused
    uint256 public pausedTime;

    /**
     * @notice use to verify the investment, whether the investor provide the allowance to the STO or not.
     * @param _beneficiary Ethereum address of the beneficiary, who wants to buy the st-20
     * @param _fundsAmount Amount invested by the beneficiary
     */
    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) public view returns(bool) {
        return polyToken.allowance(_beneficiary, address(this)) >= _fundsAmount;
    }

    /**
     * @notice Return ETH raised by the STO
     */
    function getRaisedEther() public view returns (uint256);

    /**
     * @notice Return POLY raised by the STO
     */
    function getRaisedPOLY() public view returns (uint256);

    /**
     * @notice Return the total no. of investors
     */
    function getNumberInvestors() public view returns (uint256);

    /**
     * @notice Return the total no. of tokens sold
     */
    function getTokensSold() public view returns (uint256);

    /**
     * @notice pause (overridden function)
     */
    function pause() public onlyOwner {
        require(now < endTime);
        super._pause();
    }

    /**
     * @notice unpause (overridden function)
     */
    function unpause() public onlyOwner {
        super._unpause();
    }

    /**
    * @notice Reclaim ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        ERC20Basic token = ERC20Basic(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(msg.sender, balance));
    }

}
