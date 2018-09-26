pragma solidity ^0.4.24;

import "./ReclaimTokens.sol";
import "./interfaces/IFeatureRegistry.sol";

/**
 * @title Registry for managing polymath feature switches
 */
contract FeatureRegistry is IFeatureRegistry, ReclaimTokens {

    mapping (bytes32 => bool) public featureStatus;

    event LogChangeFeatureStatus(string _nameKey, bool _newStatus);

    /**
     * @notice Get the status of a feature
     * @param _nameKey is the key for the feature status mapping
     * @return bool
     */
    function getFeatureStatus(string _nameKey) external view returns(bool) {
        bytes32 key = keccak256(bytes(_nameKey));
        return featureStatus[key];
    }

    /**
     * @notice change a feature status
     * @dev feature status is set to false by default
     * @param _nameKey is the key for the feature status mapping
     * @param _newStatus is the new feature status
     */
    function setFeatureStatus(string _nameKey, bool _newStatus) public onlyOwner {
        bytes32 key = keccak256(bytes(_nameKey));
        require(featureStatus[key] != _newStatus, "Status unchanged");
        emit LogChangeFeatureStatus(_nameKey, _newStatus);
        featureStatus[key] = _newStatus;
    }

}
