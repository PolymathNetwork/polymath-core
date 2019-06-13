pragma solidity 0.5.8;

import "../Module.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../../storage/modules/STO/STOStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/ISTO.sol";

/**
 * @title Base abstract contract to be extended by all STO modules
 */
contract STO is ISTO, STOStorage, Module {
    using SafeMath for uint256;

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
     * @dev Only securityToken owner restriction applied on the super function
     */
    function pause() public {
        /*solium-disable-next-line security/no-block-members*/
        require(now < endTime, "STO has been finalized");
        super.pause();
    }

    function _setFundRaiseType(FundRaiseType[] memory _fundRaiseTypes) internal {
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

    function _canBuy(address _investor) internal view returns(bool) {
        IDataStore dataStore = getDataStore();
        uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
        return(flags & (uint256(1) << 1) == 0);
    }

    function _getKey(bytes32 _key1, address _key2) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }
}
