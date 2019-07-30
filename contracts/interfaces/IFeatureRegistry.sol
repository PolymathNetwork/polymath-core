pragma solidity 0.5.8;

/**
 * @title Interface for managing polymath feature switches
 */
interface IFeatureRegistry {

    event ChangeFeatureStatus(string _nameKey, bool _newStatus);

    /**
     * @notice change a feature status
     * @dev feature status is set to false by default
     * @param _nameKey is the key for the feature status mapping
     * @param _newStatus is the new feature status
     */
    function setFeatureStatus(string calldata _nameKey, bool _newStatus) external;

    /**
     * @notice Get the status of a feature
     * @param _nameKey is the key for the feature status mapping
     * @return bool
     */
    function getFeatureStatus(string calldata _nameKey) external view returns(bool hasFeature);

}
