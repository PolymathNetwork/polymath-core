pragma solidity 0.5.8;

import "./ReclaimTokens.sol";
import "./interfaces/IFeatureRegistry.sol";

/**
 * @title Registry for managing polymath feature switches
 */
contract FeatureRegistry is IFeatureRegistry, ReclaimTokens {
    mapping(bytes32 => bool) public featureStatus;

    /**
     * @notice Get the status of a feature
     * @param _nameKey is the key for the feature status mapping
     * @return bool
     */
    function getFeatureStatus(string calldata _nameKey) external view returns(bool) {
        bytes32 key = keccak256(bytes(_nameKey));
        return featureStatus[key];
    }

    /**
     * @notice change a feature status
     * @dev feature status is set to false by default
     * @param _nameKey is the key for the feature status mapping
     * @param _newStatus is the new feature status
     */
    function setFeatureStatus(string calldata _nameKey, bool _newStatus) external onlyOwner {
        bytes32 key = keccak256(bytes(_nameKey));
        require(featureStatus[key] != _newStatus, "Status unchanged");
        emit ChangeFeatureStatus(_nameKey, _newStatus);
        featureStatus[key] = _newStatus;
    }

}
