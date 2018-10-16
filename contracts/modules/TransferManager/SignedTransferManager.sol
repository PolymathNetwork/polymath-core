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
    mapping(bytes => bool) invalidSignatures;

    //keep tracks of the address that allows to sign messages
    mapping(address => bool) public signers;


    // Emit when signer stats was changed
    event UpdateSigners(address[] _signers, bool[] _signersStats);
    // Emit when there is change in the flag variable called allowAllTransfers
    event InvalidSignature(bytes _data);


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

    function checkSignatureIsInvalid(bytes _data) public view returns(bool){
        return invalidSignatures[_data];
    }

    function updateSigners(address[] _signers, bool[] _signersStats) public withPerm(ADMIN) {
        require(_signers.length == _signersStats.length, "input array length does not match");
        for(uint8 i=0; i<_signers.length; i++){
            signers[_signers[i]] = _signersStats[i]; 
        }
        emit UpdateSigners(_signers, _signersStats);
    }

    /**
    * @notice default implementation of verifyTransfer used by SecurityToken
    * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
    * If the transfer request comes from a token holder, it checks that:
    * a) Both are on the whitelist
    * b) Seller's sale lockup period is over
    * c) Buyer's purchase lockup is over
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data , bool _isTransfer) public returns(Result) {
        if (!paused) {
            
            require(invalidSignatures[_data] != true, "Invalid signature - signature is either used or deemed as invalid");

            bytes32 hash = keccak256(abi.encodePacked(this, _from, _to, _amount));
            address signer = _recoverSignerAdd(hash, _data);
            require(signers[signer] == true, "Invalid signature - signer is not on the list");
            
            if(_isTransfer == true){
                 invalidSignatures[_data] = true;
            }

            return Result.VALID;
        }
        return Result.NA;
    }

    function invalidSignature(address _from, address _to, uint256 _amount, bytes _data, bytes32 _hash) public view returns(address) {
        require(signers[msg.sender] == true, "Only signer is allowed to invalid signature.");
        require(invalidSignatures[_data] != true, "This signature is invalid.");

        // bytes32 _hash = keccak256(abi.encodePacked(this, _from, _to, _amount));

        address signer = _recoverSignerAdd(_hash,_data);
        return signer;
        // require(signer == msg.sender, "Incorrect Signer for this signature");

        // invalidSignatures[_data] = true;
        // emit InvalidSignature(_data);
    }

    /**
     * @notice used to verify the signature
     */
    function _recoverSignerAdd(bytes32 _hash, bytes _data) internal view returns(address) {
        
        //Check that the signature is valid
        require(_data.length == 65, "Date input length is invalid");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_data, 32))
            s := mload(add(_data, 64))
            v := and(mload(add(_data, 65)), 255)
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return 0;
        }

        return ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)), v, r, s);
    }

   
    /**
     * @notice Return the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
