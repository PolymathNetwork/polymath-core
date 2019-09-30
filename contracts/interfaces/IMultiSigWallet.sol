pragma solidity ^0.5.8;

interface IMultiSigWallet {

    /**
     * @notice It will be used to take usage fee / setup fee from the modules
     * @param _securityToken address of the securityToken
     * @param _fee Fee for the given module task
     */
    function collectModuleFee(address _securityToken, uint256 _fee) external;

    /**
     * @notice It will be used to collect the ST creation and registering ticker fee
     * @param _whitelabeler Address of the whitelabler
     * @param _fee Fee that need to deduct 
     */
    function collectSTFee(address _whitelabeler, uint256 _fee) external;

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