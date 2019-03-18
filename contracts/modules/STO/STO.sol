pragma solidity ^0.4.24;

import "../../Pausable.sol";
import "../Module.sol";
import "../../interfaces/IERC20.sol";
import "../../interfaces/ISTO.sol";
import "./STOStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Interface to be implemented by all STO modules
 */
contract STO is ISTO, STOStorage, Module, Pausable  {
    using SafeMath for uint256;

    enum FundRaiseType { ETH, POLY, SC }

    // Event
    event SetFundRaiseTypes(FundRaiseType[] _fundRaiseTypes);

    /**
     * @notice Returns funds raised by the STO
     */
    function getRaised(FundRaiseType _fundRaiseType) public view returns (uint256) {
        return fundsRaised[uint8(_fundRaiseType)];
    }

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

    function _setFundRaiseType(FundRaiseType[] _fundRaiseTypes) internal {
        // FundRaiseType[] parameter type ensures only valid values for _fundRaiseTypes
        require(_fundRaiseTypes.length > 0 && _fundRaiseTypes.length <= 3, "Raise type is not specified");
        fundRaiseTypes[uint8(FundRaiseType.ETH)] = false;
        fundRaiseTypes[uint8(FundRaiseType.POLY)] = false;
        fundRaiseTypes[uint8(FundRaiseType.SC)] = false;
        for (uint8 j = 0; j < _fundRaiseTypes.length; j++) {
            fundRaiseTypes[uint8(_fundRaiseTypes[j])] = true;
        }
        emit SetFundRaiseTypes(_fundRaiseTypes);
    }

}
