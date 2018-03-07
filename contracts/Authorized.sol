pragma solidity ^0.4.18;

import './interfaces/IRegulatorService.sol';
import './interfaces/IAuthorized.sol';

contract Authorized is IAuthorized {
    
    IRegulatorService public regulator;
    
    /**
     * @dev Ethereum address of the admin of this contract 
     */
    address public admin;

    /**
     * @dev Mapping for authorizarion of the investors, It contains the permissions provided to the investors
            by their security token owners. It represent as authorization[tokenAddress][investor] = permission
     */
    mapping(address => mapping(address => uint8)) private authorization;

    /**
     * @dev Mapping for containing the owners of the security token.
            tokenOwnership[tokenAddress] = ownerAddress
     */
    mapping(address => address) public tokenOwnership;

    /**
     * @dev Mapping used for holding the list of co-owners of the securityToken
            co-owners have the permissions as owner but they can't add any other new co-owner
     */
    mapping(address => mapping(address => bool)) public CoOwners;

    event LogRegisterSecurityToken(address indexed _securityToken, address _owner, uint256 _timestamp);
    /// @dev log the change event of the regulator
    event LogRegulatorChanged(address _oldRegulator, address _newRegulator, uint256 _timestamp);

    /// @dev verifying the callee of function should be a admin 
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    /// @notice constructor
    function Authorized(address _regulatorService) public {
        require(_regulatorService != address(0));
        regulator = IRegulatorService(_regulatorService);
        admin = msg.sender;
    }

    /**
     * @dev It register the owner with its corresponding security token address
            now owner is liable to any changes in the permissions provided to investors
     * @param _securityToken Address of the security token 
     * @param _owner Owner of the corresponding security token.
     */
    function registerSecurity(address _securityToken, address _owner) onlyAdmin public {
        require(_securityToken != address(0));
        require(_owner != address(0));
        require(tokenOwnership[_securityToken] == address(0));
        tokenOwnership[_securityToken] = _owner;
        LogRegisterSecurityToken(_securityToken, _owner, now);
    }

    /**
     * @dev This is used to grant the permission to the investor list of a particular security token
            It is called by the owner or any approved co-owner. If permission is already being given to
            the investor then it simply overrides the previous one. So this function used for whitelisting as
            well as for blacklisting the ethereum address.
     * @param _securityToken Address of the security token
     * @param _investorList Array of the address of the investors who want to participate into the issuance.
     * @param _permissionList Array of the permissions provided to the investors.
     */

    function grantPermission(address _securityToken, address[] _investorList, uint8[] _permissionList) public {
        require(_securityToken != address(0));
        require(validPersonnel(msg.sender, _securityToken));
        require(_investorList.length == _permissionList.length);
        for (uint i = 0; i < _investorList.length; i++) {
            authorization[_securityToken][_investorList[i]] = _permissionList[i];
        }
    }

    /**
     * @dev Add or remove the co-owner of the particular security token
            It uses the bool array `_permissionList` to add or soft remove the co-owner
     * @param _securityToken Address of the security token contract
     * @param _coOwnerList Array of ethereum addresses of the co-owners
     * @param _permissionList Bool Array
     */
    function grantCoOwnerPermission(address _securityToken, address[] _coOwnerList, bool[] _permissionList) public {
        require(tokenOwnership[_securityToken] == msg.sender);
        require(_coOwnerList.length == _permissionList.length);
        for (uint8 i; i < _coOwnerList.length; i++) {
            CoOwners[_securityToken][_coOwnerList[i]] = _permissionList[i];
        }
    }

    /**
     * @dev Change the regulator contract address if any change introduce in regulation
     * @param _regulatorService Address of the `RegulatorService` contract            
     */
    function changeRegulator(address _regulatorService) onlyAdmin public {
        require(_regulatorService != address(0));
        address _oldRegulator = address(regulator);
        regulator = IRegulatorService(_regulatorService);
        LogRegulatorChanged(_oldRegulator, _regulatorService, now);
    } 

    /**
     * @dev checking the permission provided to the holder of the token
            also checks the regulation for the transfer of the token
        ------------------------- WIP ----------------------------
     * @param _securityToken Address of the security token contract
     * @param _to Ethereum address whom token would transfer
     * @param _from Ethereum address from token would transfer
     * @return bool
     */

    function validatePermission(address _securityToken, address _to, address _from) external returns(bool) {
        regulator.verify(authorization[_securityToken][_to], authorization[_securityToken][_from]);
        return true;
    }

    /**
     * @dev Check the valid owner or co-owner of the security token
     * @param _personnel Ethereum address of the owner or co-owner of the security token
     * @param _securityToken Address of the security token contract
     * @return bool
     */
    function validPersonnel(address _personnel, address _securityToken) internal view returns (bool) {
        bool check = tokenOwnership[_securityToken] == _personnel || CoOwners[_securityToken][_personnel];
        return check;
    }
}