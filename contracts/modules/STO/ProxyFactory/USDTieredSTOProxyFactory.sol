pragma solidity ^0.4.24;

import "../USDTieredSTO.sol";
import "../../../interfaces/IUSDTieredSTOProxy.sol";

contract USDTieredSTOProxyFactory is IUSDTieredSTOProxy {

    constructor() public {

    }

    /**
     * @notice deploys the STO.
     * @param _securityToken Contract address of the securityToken
     * @param _polyAddress Contract address of the PolyToken.
     * @param _factoryAddress Contract address of the factory
     * @return address Address of the deployed STO
     */
    function deploySTO(address _securityToken, address _polyAddress, address _factoryAddress) external returns (address) {
        address newSecurityTokenAddress = new USDTieredSTO(_securityToken, _polyAddress, _factoryAddress);
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
    
}
