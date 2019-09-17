pragma solidity 0.5.8;

interface ITreasuryModule {

    /**
     * @notice use to return the treasury wallet
     */
    function getTreasuryWallet() external view returns(address);

}