pragma solidity ^0.4.24;

//import "./interfaces/IERCiota.sol";
import "./interfaces/ISecurityToken.sol";

contract IdentityStorage /*is IERCiota*/ {
	mapping (bytes32 => uint256) public uintData;
    mapping (bytes32 => bytes32) public bytes32Data; //Optional
    mapping (bytes32 => address) public addressData;
    mapping (bytes32 => string) public stringData; //Optional
    mapping (bytes32 => bytes) public bytesData;
    mapping (bytes32 => bool) public boolData;
    mapping (bytes32 => uint256[]) public uintArrayData;
    mapping (bytes32 => bytes32[]) public bytes32ArrayData;
    mapping (bytes32 => address[]) public addressArrayData;
    mapping (bytes32 => bool[]) public boolArrayData;

    mapping (address => uint256) public identityId;
    mapping (uint256 => address[]) public identityAddresses;
    uint256 public totalIdentities;
    ISecurityToken[] public associatedTokens;

    uint8 constant DATA_KEY = 10;

    modifier canSetIdentity() {
        // bool canSet;
        // for(uint256 i; i < associatedTokens.length(); i++) {
        //     if(associatedTokens[i].isModule(msg.sender, DATA_KEY)) {
        //         canSet = true;
        //         break;
        //     }
        // }
        // require(canSet);
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

    modifier canSetData() {
        // bool canSet;
        // for(uint256 i; i < associatedTokens.length(); i++) {
        //     if(associatedTokens[i].isModule(msg.sender, DATA_KEY)) {
        //         canSet = true;
        //         break;
        //     }
        // }
        // require(canSet);
        _;
    }

	function setIdentity(address _investor, uint256 _identity) public canSetIdentity {
	    require(_investor != address(0));
	    require(identityId[_investor] == 0);
	    if(_identity == 0) {
	    	identityId[_investor] = totalIdentities;
	    	identityAddresses[totalIdentities].push(_investor);
	    	totalIdentities++;
	    } else {
	    	require(identityId[_investor] == 0 && _identity < totalIdentities);
	    	identityId[_investor] = _identity;
	    	identityAddresses[_identity].push(_investor);
	    }
	}

	function setData(bytes32 _key, bool _data) public canSetData {
        require(_key != bytes32(0), "Missing key");
        boolData[_key] = _data;
    }

    function addAuthorizedToken(address _securityToken) public onlySecurityToken {
        associatedTokens.push(ISecurityToken(_securityToken));
    }
}