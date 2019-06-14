pragma solidity 0.5.8;

import "../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

/**
 * @title Transfer Manager module for verifing transations with a signed message
 */
contract SignedTransferManager is TransferManager {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    //Keeps track of if the signature has been used or invalidated
    //mapping(bytes => bool) invalidSignatures;
    bytes32 constant public INVALID_SIG = "INVALIDSIG";

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
        uint256 validFrom;
        uint256 expiry;
        bytes memory signature;
        (targetAddress, nonce, validFrom, expiry, signature) = abi.decode(_data, (address, uint256, uint256, uint256, bytes));
        if (targetAddress != address(this) || expiry < now || validFrom > now || signature.length == 0 || _checkSignatureIsInvalid(signature))
            return false;
        return true;
    }

    function checkSigner(address _signer) external view returns(bool) {
        return _checkSigner(_signer);
    }

    /**
    * @notice allow verify transfer with signature
    * @param _from address transfer from
    * @param _to address transfer to
    * @param _amount transfer amount
    * @param _data signature
    * Sig needs to be valid (not used or deemed as invalid)
    * Signer needs to be in the signers mapping
    */
    function executeTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external onlySecurityToken returns(Result) {
        (Result success, ) = verifyTransfer(_from, _to, _amount, _data);
        if (success == Result.VALID && _data.length > 32) {
            bytes memory signature;
            (,,,,signature) = abi.decode(_data, (address, uint256, uint256, uint256, bytes));
            _invalidateSignature(signature);
        }
        return success;
    }

    /**
    * @notice allow verify transfer with signature
    * @param _from address transfer from
    * @param _to address transfer to
    * @param _amount transfer amount
    * @param _data signature
    * Sig needs to be valid (not used or deemed as invalid)
    * Signer needs to be in the signers mapping
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes memory _data) public view returns(Result, bytes32) {
        if (!paused) {

            if (_data.length <= 32)
                return (Result.NA, bytes32(0));

            address targetAddress;
            uint256 nonce;
            uint256 validFrom;
            uint256 expiry;
            bytes memory signature;
            (targetAddress, nonce, validFrom, expiry, signature) = abi.decode(_data, (address, uint256, uint256, uint256, bytes));

            if (address(this) != targetAddress || signature.length == 0 || _checkSignatureIsInvalid(signature) || expiry < now || validFrom > now)
                return (Result.NA, bytes32(0));

            bytes32 hash = keccak256(abi.encodePacked(targetAddress, nonce, validFrom, expiry, _from, _to, _amount));
            address signer = hash.toEthSignedMessageHash().recover(signature);

            if (!_checkSigner(signer))
                return (Result.NA, bytes32(0));
            return (Result.VALID, bytes32(uint256(address(this)) << 96));
        }
        return (Result.NA, bytes32(0));
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
        uint256 validFrom;
        uint256 expiry;
        bytes memory signature;
        (targetAddress, nonce, validFrom, expiry, signature) = abi.decode(_data, (address, uint256, uint256, uint256, bytes));

        require(!_checkSignatureIsInvalid(signature), "Signature already invalid");
        require(targetAddress == address(this), "Signature not for this module");

        bytes32 hash = keccak256(abi.encodePacked(targetAddress, nonce, validFrom, expiry, _from, _to, _amount));
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
        IDataStore dataStore = getDataStore();
        return dataStore.getBool(keccak256(abi.encodePacked(INVALID_SIG, _data)));
    }

    function _checkSigner(address _signer) internal view returns(bool) {
        return _checkPerm(OPERATOR, _signer);
    }

    function _invalidateSignature(bytes memory _data) internal {
        IDataStore dataStore = getDataStore();
        dataStore.setBool(keccak256(abi.encodePacked(INVALID_SIG, _data)), true);
        emit SignatureUsed(_data);
    }
}
