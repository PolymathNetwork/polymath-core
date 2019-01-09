pragma solidity ^0.5.0;

/**
 * @title Interface that every module contract should implement
 */
interface IModule {
    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns(bytes4);

    /**
     * @notice Return the permission flags that are associated with a module
     */
    function getPermissions() external view returns(bytes32[] memory);

    /**
     * @notice Used to withdraw the fee by the factory owner
     */
    function takeFee(uint256 _amount) external returns(bool);

}
