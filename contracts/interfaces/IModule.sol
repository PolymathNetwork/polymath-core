pragma solidity ^0.4.24;

/**
 * @title Interface that any module contract should implement
 */
interface IModule {

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns (bytes4);

    /**
     * @notice Return the permissions flag that are associated with a module
     */
    function getPermissions() external view returns(bytes32[]);

    /**
     * @notice used to withdraw the fee by the factory owner
     */
    function takeFee(uint256 _amount) external returns(bool);

}
