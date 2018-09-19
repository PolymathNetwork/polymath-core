pragma solidity ^0.4.24;

import "../../Pausable.sol";
import "../Module.sol";
import "../../interfaces/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Interface to be implemented by all STO modules
 */
contract ISTO is Module, Pausable  {
    using SafeMath for uint256;

    enum FundRaiseType { ETH, POLY, DAI }
    mapping (uint8 => bool) public fundRaiseTypes;
    mapping (uint8 => uint256) public fundsRaised;

    // Start time of the STO
    uint256 public startTime;
    // End time of the STO
    uint256 public endTime;
    // Time STO was paused
    uint256 public pausedTime;
    // Number of individual investors
    uint256 public investorCount;
    // Address where ETH & POLY funds are delivered
    address public wallet;
     // Final amount of tokens sold
    uint256 public totalTokensSold;

    // Event
    event SetFundRaiseTypes(FundRaiseType[] _fundRaiseTypes);

    /**
    * @notice Reclaim ERC20Basic compatible tokens
    * @dev We duplicate here due to the overriden owner & onlyOwner
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(msg.sender, balance));
    }

    /**
     * @notice Return ETH raised by the STO
     */
    function getRaised(FundRaiseType _fundRaiseType) public view returns (uint256) {
        return fundsRaised[uint8(_fundRaiseType)];
    }

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

    function _setFundRaiseType(FundRaiseType[] _fundRaiseTypes) internal {
        // FundRaiseType[] parameter type ensures only valid values for _fundRaiseTypes
        require(_fundRaiseTypes.length > 0, "Raise type not specified");
        fundRaiseTypes[uint8(FundRaiseType.ETH)] = false;
        fundRaiseTypes[uint8(FundRaiseType.POLY)] = false;
        fundRaiseTypes[uint8(FundRaiseType.DAI)] = false;
        for (uint8 j = 0; j < _fundRaiseTypes.length; j++) {
            fundRaiseTypes[uint8(_fundRaiseTypes[j])] = true;
        }
        emit SetFundRaiseTypes(_fundRaiseTypes);
    }

}
