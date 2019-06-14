pragma solidity 0.5.8;

/**
 * @title Interface to be implemented by all STO modules
 */
interface ISTO {

    enum FundRaiseType {ETH, POLY, SC}

    // Event
    event SetFundRaiseTypes(FundRaiseType[] _fundRaiseTypes);

    /**
     * @notice Returns the total no. of tokens sold
     */
    function getTokensSold() external view returns(uint256 soldTokens);

    /**
     * @notice Returns funds raised by the STO
     */
    function getRaised(FundRaiseType _fundRaiseType) external view returns(uint256 raisedAmount);

    /**
     * @notice Pause (overridden function)
     * @dev Only securityToken owner restriction applied on the super function
     */
    function pause() external;

}
