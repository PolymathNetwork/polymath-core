pragma solidity 0.5.8;

import "../../TransferManager/TransferManager.sol";
import "../../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract KYCTransferManager is TransferManager {

    using SafeMath for uint256;

    bytes32 public constant KYC_NUMBER = "KYC_NUMBER"; //We will standardize what key to use for what.

    bytes32 public constant KYC_ARRAY = "KYC_ARRAY";

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

    function executeTransfer(address _from, address _to, uint256 _amount, bytes calldata _data)
        external
        returns (Result)
    {
        (Result success,)= verifyTransfer(_from, _to, _amount, _data);
        return success;
    }

    function verifyTransfer(address /*_from*/, address _to, uint256 /*_amount*/, bytes memory /* _data */) public view returns(Result, bytes32) {
        if (!paused && checkKYC(_to)) {
            return (Result.VALID, bytes32(uint256(address(this)) << 96));
        }
        return (Result.NA, bytes32(0));
    }

    function modifyKYC( address _investor, bool _kycStatus) public withPerm(ADMIN) {
        _modifyKYC(_investor, _kycStatus);
    }

    function _modifyKYC(address _investor, bool _kycStatus) internal {
        IDataStore dataStore = getDataStore();
        bytes32 key = _getKYCKey(_investor);
        uint256 kycNumber = dataStore.getUint256(key); //index in address array + 1
        uint256 kycTotal = dataStore.getAddressArrayLength(KYC_ARRAY);
        if(_kycStatus) {
            require(kycNumber == 0, "KYC exists");
            dataStore.setUint256(key, kycTotal + 1);
            dataStore.insertAddress(KYC_ARRAY, _investor);
        } else {
            require(kycNumber != 0, "KYC does not exist");
            address lastAddress = dataStore.getAddressArrayElement(KYC_ARRAY, kycTotal - 1);
            dataStore.deleteAddress(KYC_ARRAY, kycNumber - 1);

            //Corrects the index of last element as delete fucntions move last element to index.
            dataStore.setUint256(_getKYCKey(lastAddress), kycNumber);
        }
        //Alternatively, we can just emit an event and not maintain the KYC array on chain.
        //I am maintaining the array to showcase how it can be done in cases where it might be needed.
    }

    function getKYCAddresses() public view returns(address[] memory) {
        IDataStore dataStore = getDataStore();
        return dataStore.getAddressArray(KYC_ARRAY);
    }

    function checkKYC(address _investor) public view returns (bool kyc) {
        bytes32 key = _getKYCKey(_investor);
        IDataStore dataStore = getDataStore();
        if (dataStore.getUint256(key) > 0)
            kyc = true;
    }

    function _getKYCKey(address _identity) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(KYC_NUMBER, _identity)));
    }

    /**
     * @notice Return the permissions flag that are associated with this module
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
