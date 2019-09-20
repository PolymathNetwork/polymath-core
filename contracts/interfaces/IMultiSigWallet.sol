pragma solidity ^0.5.8;

interface IMultiSigWallet {

    /**
     * @notice It will be used to take usage fee from the modules
     * @param _securityToken address of the securityToken
     * @param _usageCost Fee for the given module task
     */
    function takeUsageFee(address _securityToken, uint256 _usageCost) external;

    /**
     * @notice Use to withdraw the rebate by the whitelabelers
     * @dev only valid whitelabelers can execute this function
     */
    function withdrawRebate() external;

    /**
     * @notice Get the rebate amount for the given whitelabeler
     */
    function getRebateAmount(address _whitelabeler) external view returns(uint256 rebate);

    /**
     * @notice Use to change the rebate percentage
     * @dev needs consensus by the signers to execute the transaction
     * @param _rebatePercentage New rebate percentage
     */
    function changeRebatePercentage(uint256 _rebatePercentage) external;
    
}