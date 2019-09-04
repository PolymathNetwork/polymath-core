pragma solidity 0.5.8;

interface IGTM {
    
    /**
    * @notice Add or remove KYC info of an investor.
    * @param _investor is the address to whitelist
    * @param _canSendAfter is the moment when the sale lockup period ends and the investor can freely sell or transfer their tokens
    * @param _canReceiveAfter is the moment when the purchase lockup period ends and the investor can freely purchase or receive tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    */
    function modifyKYCDataByModules(
        address _investor,
        uint64 _canSendAfter,
        uint64 _canReceiveAfter,
        uint64 _expiryTime
    )
    external;

    /**
     * @notice Use to know whether the given address is whitelisted or not
     * @param _holder Address that need to check
     * @return bool
     */
    function isAddressWhitelisted(address _holder) external view returns (bool);

}