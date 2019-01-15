pragma solidity ^0.5.0;

import "../../TransferManager/TransferManager.sol";
import "../../../datastore/DataStore.sol";
import "../../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract KYCTransferManager is TransferManager {

    using SafeMath for uint256;
    
    bytes32 public constant KYC_STATUS = "KYC_STATUS"; //We will standardize what key to use for what.

    bytes32 public constant KYC_PROVIDER = "KYC_PROVIDER";

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

    function verifyTransfer(address /*_from*/, address _to, uint256 /*_amount*/, bytes memory /* _data */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            bytes32 key = _getKYCKey(_to);
            DataStore dataStore = DataStore(ISecurityToken(securityToken).dataStore());
            if (dataStore.getBool(key))
                return Result.VALID;
        }
        return Result.NA;
    }

    function modifyKYC(
        address _investor,
        bool _kycStatus
    )
        public
        withPerm(KYC_PROVIDER)
    {
        _modifyKYC(_investor, _kycStatus);
    }

    function _modifyKYC(
        address _investor,
        bool _kycStatus
    )
        internal
    {
        bytes32 key = _getKYCKey(_investor);
        DataStore dataStore = DataStore(ISecurityToken(securityToken).dataStore());
        dataStore.setData(key, _kycStatus);
    }

    /**
     * @notice Return the permissions flag that are associated with general trnasfer manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = KYC_PROVIDER;
        return allPermissions;
    }

    function _getKYCKey(address _identity) internal pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(KYC_STATUS, _identity)));
    }

}
