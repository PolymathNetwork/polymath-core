pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for verifing transations with a signed message
 */
contract SignedTransferManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 constant public ADMIN = "ADMIN";

    //Keeps track of if the signature has been used or invalidated
    mapping (bytes => bool) public invalidSignatures;

    //keep tracks of the address that allows to sign messages
    mapping (address => bool) public signers;


    event AddManualApproval(
        address _from,
        address _to,
        uint256 _allowance,
        uint256 _expiryTime,
        address _addedBy
    );


    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    function updateSigners(address[] _signers, bool[] _signersStats) public withPerm(ADMIN) {
        require(_signers.length == _signersStats.length, "input array length does not match");
        for(i=0; i<_signers.length; i++){
            signers[address[i]] = _signersStats[i]; 
        }
    }

    /**
    * @notice default implementation of verifyTransfer used by SecurityToken
    * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
    * If the transfer request comes from a token holder, it checks that:
    * a) Both are on the whitelist
    * b) Seller's sale lockup period is over
    * c) Buyer's purchase lockup is over
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data , bool _isTransfer, uint8 _v, bytes32 _r, bytes32 _s) public returns(Result) {
        if (!paused) {
            
            require(invalidSignatures[_data] != true, "Invalide signature - signature is either used or deemed as invalid");

            address memory signer = ecrecover(_data, _v, _r, _s);
            require(signers[signer] == true, "Invalid signature - signer not authroized."); 

            bytes32 hash = keccak256(abi.encodePacked(this, _from, _to, _amount));
            _checkSig(hash, _v, _r, _s);
            
            if(_isTransfer == true){
                 invalidSignatures[_data] = true;
                 return Result.VALID;
            }
            return Result.VALID;
        }
        return Result.NA;
    }

    function invalideSignature(bytes _data) public {
        require(signers[msg.sender] == true, "Only signer is allowed to invalide signature.");
        require(invalidSignatures[_data] != true, "This signature is already invalid.");
        invalidSignatures[_data] != true;
    }

    /**
     * @notice used to verify the signature
     */
    function _checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view {
        //Check that the signature is valid
        //sig should be signing - _investor, _fromTime, _toTime & _expiryTime and be signed by the issuer address
        address signer = ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)), _v, _r, _s);
        require(signer == Ownable(securityToken).owner() || signer == signingAddress, "Incorrect signer");
    }

   
    /**
     * @notice Return the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = TRANSFER_APPROVAL;
        return allPermissions;
    }
}
