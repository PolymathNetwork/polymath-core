pragma solidity ^0.5.0;

import "./ModuleStorage.sol";
import "../interfaces/IModule.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/IDataStore.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/ICheckPermission.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Interface that any module contract should implement
 * @notice Contract is abstract
 */
contract Module is IModule, ModuleStorage {
    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor (address _securityToken, address _polyAddress) public
    ModuleStorage(_securityToken, _polyAddress)
    {
    }

    //Allows owner, factory or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == Ownable(securityToken).owner();
        bool isFactory = msg.sender == factory;
        require(
            isOwner || isFactory || ICheckPermission(securityToken).checkPermission(msg.sender, address(this), _perm),
            "Permission check failed"
        );
        _;
    }

    function _onlySecurityTokenOwner() internal view {
        require(msg.sender == Ownable(securityToken).owner(), "Sender is not owner");
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Sender is not factory");
        _;
    }

    modifier onlyFactoryOwner() {
        require(msg.sender == Ownable(factory).owner(), "Sender is not factory owner");
        _;
    }

    modifier onlyFactoryOrOwner() {
        require((msg.sender == Ownable(securityToken).owner()) || (msg.sender == factory), "Sender is not factory or owner");
        _;
    }

    /**
     * @notice used to withdraw the fee by the factory owner
     */
    function takeUsageFee() public withPerm(FEE_ADMIN) returns(bool) {
        require(polyToken.transferFrom(securityToken, Ownable(factory).owner(), IModuleFactory(factory).usageCostInPoly()), "Unable to take fee");
        return true;
    }

    function getDataStore() public view returns(address) {
        return ISecurityToken(securityToken).dataStore();
    }
}
