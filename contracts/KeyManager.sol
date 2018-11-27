pragma solidity ^0.4.24;

import "./interfaces/ISecurityToken.sol";

contract KeyManager {
    mapping (address => uint256) internal identityId;
    mapping (uint256 => address[]) public identityAddresses;
    uint256 public totalIdentities;
    ISecurityToken[] public associatedTokens;

    uint8 constant DATA_KEY = 10;

    modifier canSetIdentity() {
        // We can change it to anything like onlyModule(Data_key) or owner 
        // or delegateWithPermission("IDENTITY") or a combination of those 
        bool canSet;
        for(uint256 i; i < associatedTokens.length; i++) {
            if(associatedTokens[i].isModule(msg.sender, DATA_KEY)) {
                canSet = true;
                break;
            }
        }
        require(canSet);
        _;
    }

    modifier onlySecurityToken() {
        bool canSet;
        if (associatedTokens.length > 0) {
            for(uint256 i; i < associatedTokens.length; i++) {
                if(msg.sender == address(associatedTokens[i])) {
                    canSet = true;
                    break;
                }
            }
            require(canSet);
        }
        _;
    }

    function generateIdentityId(address _investor) public {
        setIdentity(_investor, 0);
    }

    /// @dev to generate new Identity ID, input _identity as 0
    function setIdentity(address _investor, uint256 _identity) public canSetIdentity {
        require(_investor != address(0), "Invalid investor address");
        require(identityId[_investor] == 0, "Investor already part of an Identity");
        if(_identity == 0) {
            totalIdentities++;
            identityId[_investor] = totalIdentities;
            identityAddresses[totalIdentities].push(_investor);
        } else {
            require(identityId[_investor] == 0 && _identity <= totalIdentities);
            identityId[_investor] = _identity;
            identityAddresses[_identity].push(_investor);
        }
    }

    function addAuthorizedToken(address _securityToken) public onlySecurityToken {
        associatedTokens.push(ISecurityToken(_securityToken));
    }

    function getIdentityId(address _investor) public view returns(uint256) {
        return identityId[_investor];
    }
}