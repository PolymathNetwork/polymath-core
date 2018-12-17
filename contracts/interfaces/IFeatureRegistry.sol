pragma solidity ^0.5.0;

/**
 * @title Interface for managing polymath feature switches
 */
interface IFeatureRegistry {
    /**
     * @notice Get the status of a feature
     * @param _nameKey is the key for the feature status mapping
     * @return bool
     */
    function getFeatureStatus(string calldata _nameKey) external view returns(bool);

}
