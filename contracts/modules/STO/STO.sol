pragma solidity ^0.5.0;

import "../../Pausable.sol";
import "../Module.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./STOStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/ISTO.sol";

/**
 * @title Base abstract contract to be extended by all STO modules
 */
contract STO is ISTO, STOStorage, Module, Pausable {
    using SafeMath for uint256;

    enum FundRaiseType {ETH, POLY, SC}

    // Event
    event SetFundRaiseTypes(FundRaiseType[] _fundRaiseTypes);

    /**
    * @notice Reclaims ERC20Basic compatible tokens
    * @dev We duplicate here due to the overriden owner & onlyOwner
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0), "Invalid address");
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(msg.sender, balance), "Transfer failed");
    }

    /**
     * @notice Returns funds raised by the STO
     */
    function getRaised(FundRaiseType _fundRaiseType) public view returns(uint256) {
        return fundsRaised[uint8(_fundRaiseType)];
    }

    /**
     * @notice Returns the total no. of tokens sold
     */
    function getTokensSold() external view returns (uint256);

    /**
     * @notice Pause (overridden function)
     */
    function pause() public onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        require(now < endTime, "STO has been finalized");
        super._pause();
    }

    /**
     * @notice Unpause (overridden function)
     */
    function unpause() public onlyOwner {
        super._unpause();
    }

    function _setFundRaiseType(FundRaiseType[] memory _fundRaiseTypes) internal {
        // FundRaiseType[] parameter type ensures only valid values for _fundRaiseTypes
        require(_fundRaiseTypes.length > 0, "Raise type is not specified");
        fundRaiseTypes[uint8(FundRaiseType.ETH)] = false;
        fundRaiseTypes[uint8(FundRaiseType.POLY)] = false;
        fundRaiseTypes[uint8(FundRaiseType.SC)] = false;
        for (uint8 j = 0; j < _fundRaiseTypes.length; j++) {
            fundRaiseTypes[uint8(_fundRaiseTypes[j])] = true;
        }
        emit SetFundRaiseTypes(_fundRaiseTypes);
    }

}
