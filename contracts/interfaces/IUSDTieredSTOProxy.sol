pragma solidity ^0.5.0;

/**
 * @title Interface for security token proxy deployment
 */
interface IUSDTieredSTOProxy {
    /**
     * @notice Deploys the STO.
     * @param _securityToken Contract address of the securityToken
     * @param _factoryAddress Contract address of the factory
     * @return address Address of the deployed STO
     */
    function deploySTO(address _securityToken, address _factoryAddress) external returns(address);

    /**
     * @notice Used to get the init function signature
     * @param _contractAddress Address of the STO contract
     * @return bytes4
     */
    function getInitFunction(address _contractAddress) external returns(bytes4);

}
