pragma solidity ^0.5.0;

import "../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

/**
 * @title Transfer Manager module for verifing transations with a signed message
 */
contract SignedTransferManager is TransferManager {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    bytes32 constant public ADMIN = "ADMIN";

    //Keeps track of if the signature has been used or invalidated
    //mapping(bytes => bool) invalidSignatures;
    bytes32 constant public INVALID_SIG = "INVALIDSIG";

    //keep tracks of the address that allows to sign messages
    //mapping(address => bool) public signers;
    bytes32 constant public SIGNER = "SIGNER";

    // Emit when signer stats was changed
    event SignersUpdated(address[] _signers, bool[] _signersStats);

    // Emit when a signature has been deemed invalid
    event SignatureUsed(bytes _data);


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
    function getInitFunction() external pure returns (bytes4) {
        return bytes4(0);
    }

    /**
    * @notice function to check if a signature is still valid
    * @param _data signature
    */
    function checkSignatureValidity(bytes calldata _data) external view returns(bool) {
        address targetAddress;
        uint256 nonce;
        uint256 expiry;
        bytes memory signature;
        (targetAddress, nonce, expiry, signature) = abi.decode(_data, (address, uint256, uint256, bytes));
        if (targetAddress != address(this) || expiry < now || signature.length == 0 || _checkSignatureIsInvalid(signature))
            return false;
        return true;
    }

    function checkSigner(address _signer) external view returns(bool) {
        return _checkSigner(_signer);
    }

    /**
    * @notice function to remove or add signer(s) onto the signer mapping
    * @param _signers address array of signers
    * @param _signersStats bool array of signers stats
    */
    function updateSigners(address[] calldata _signers, bool[] calldata _signersStats) external withPerm(ADMIN) {
        require(_signers.length == _signersStats.length, "Array length mismatch");
        IDataStore dataStore = IDataStore(ISecurityToken(securityToken).dataStore());
        for(uint256 i=0; i<_signers.length; i++) {
            require(_signers[i] != address(0), "Invalid address");
            dataStore.setBool(keccak256(abi.encodePacked(SIGNER, _signers[i])), _signersStats[i]);
        }
        emit SignersUpdated(_signers, _signersStats);
    }

    /**
    * @notice allow verify transfer with signature
    * @param _from address transfer from
    * @param _to address transfer to
    * @param _amount transfer amount
    * @param _data signature
    * @param _isTransfer bool value of isTransfer
    * Sig needs to be valid (not used or deemed as invalid)
    * Signer needs to be in the signers mapping
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes memory _data , bool _isTransfer) public returns(Result) {
        if (!paused) {

            require (_isTransfer == false || msg.sender == securityToken, "Sender is not ST");

            if (_data.length == 0)
                return Result.NA;

            address targetAddress;
            uint256 nonce;
            uint256 expiry;
            bytes memory signature;
            (targetAddress, nonce, expiry, signature) = abi.decode(_data, (address, uint256, uint256, bytes));

            if (address(this) != targetAddress || signature.length == 0 || _checkSignatureIsInvalid(signature) || expiry < now)
                return Result.NA;

            bytes32 hash = keccak256(abi.encodePacked(targetAddress, nonce, expiry, _from, _to, _amount));
            address signer = hash.toEthSignedMessageHash().recover(signature);

            if (!_checkSigner(signer)) {
                return Result.NA;
            } else if(_isTransfer) {
                _invalidateSignature(signature);
            }
            return Result.VALID;
        }
        return Result.NA;
    }

    /**
    * @notice allow signers to deem a signature invalid
    * @param _from address transfer from
    * @param _to address transfer to
    * @param _amount transfer amount
    * @param _data signature
    * Sig needs to be valid (not used or deemed as invalid)
    * Signer needs to be in the signers mapping
    */
    function invalidateSignature(address _from, address _to, uint256 _amount, bytes calldata _data) external {
        require(_checkSigner(msg.sender), "Unauthorized Signer");

        address targetAddress;
        uint256 nonce;
        uint256 expiry;
        bytes memory signature;
        (targetAddress, nonce, expiry, signature) = abi.decode(_data, (address, uint256, uint256, bytes));

        require(!_checkSignatureIsInvalid(signature), "Signature already invalid");
        require(targetAddress == address(this), "Signature not for this module");

        bytes32 hash = keccak256(abi.encodePacked(targetAddress, nonce, expiry, _from, _to, _amount));
        require(hash.toEthSignedMessageHash().recover(signature) == msg.sender, "Incorrect Signer");

        _invalidateSignature(signature);
    }

    /**
     * @notice Return the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    function _checkSignatureIsInvalid(bytes memory _data) internal view returns(bool) {
        IDataStore dataStore = IDataStore(ISecurityToken(securityToken).dataStore());
        return dataStore.getBool(keccak256(abi.encodePacked(INVALID_SIG, _data)));
    }

    function _checkSigner(address _signer) internal view returns(bool) {
        IDataStore dataStore = IDataStore(ISecurityToken(securityToken).dataStore());
        return dataStore.getBool(keccak256(abi.encodePacked(SIGNER, _signer)));
    }

    function _invalidateSignature(bytes memory _data) internal {
        IDataStore dataStore = IDataStore(ISecurityToken(securityToken).dataStore());
        dataStore.setBool(keccak256(abi.encodePacked(INVALID_SIG, _data)), true);
        emit SignatureUsed(_data);
    }
}
