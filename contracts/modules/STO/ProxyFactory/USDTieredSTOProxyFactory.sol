pragma solidity ^0.4.24;

import "../USDTieredSTO.sol";

contract USDTieredSTOProxyFactory {

    /**
     * @notice deploys the STO. 
     */
    function deploySTO(address _securityToken, address _polyAddress) external returns (address) {
        address newSecurityTokenAddress = new USDTieredSTO(_securityToken, _polyAddress);
        return newSecurityTokenAddress;
    }

    /**
     * @notice Use to get the init function signature
     * @param _contractAddress Address of the STO contract
     * @return bytes4
     */
    function getInitFunction(address _contractAddress) external returns (bytes4) {
        return USDTieredSTO(_contractAddress).getInitFunction();
    }

    /**
     * @notice Use to intialize the state variables of the STO contract
     * @param _contractAddress Address of the STO contract
     * @param _data Data that use to intialize the values
     */
    function initialize(address _contractAddress, bytes _data) external returns (bool) {
        return USDTieredSTO(_contractAddress).call(_data);
    }

}