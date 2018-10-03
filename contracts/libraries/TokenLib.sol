pragma solidity ^0.4.24;

import "../modules/PermissionManager/IPermissionManager.sol";

library TokenLib {

    // Struct for module data
    struct ModuleData {
        bytes32 name;
        address module;
        address moduleFactory;
        bool isArchived;
        uint8[] moduleTypes;
        uint256[] moduleIndexes;
        uint256 nameIndex;
        mapping (uint8 => uint256) moduleIndex;
    }

    // Structures to maintain checkpoints of balances for governance / dividends
    struct Checkpoint {
        uint256 checkpointId;
        uint256 value;
    }

    // Emit when Module get archived from the securityToken
    event ModuleArchived(uint8[] _types, address _module, uint256 _timestamp);
    // Emit when Module get unarchived from the securityToken
    event ModuleUnarchived(uint8[] _types, address _module, uint256 _timestamp);

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _moduleData storage data
    * @param _module address of module to archive
    */
    function archiveModule(ModuleData storage _moduleData, address _module) public {
        require(!_moduleData.isArchived, "Module archived");
        require(_moduleData.module != address(0), "Module missing");
        emit ModuleArchived(_moduleData.moduleTypes, _module, now);
        _moduleData.isArchived = true;
    }

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _moduleData storage data
    * @param _module address of module to unarchive
    */
    function unarchiveModule(ModuleData storage _moduleData, address _module) public {
        require(_moduleData.isArchived, "Module unarchived");
        emit ModuleUnarchived(_moduleData.moduleTypes, _module, now);
        _moduleData.isArchived = false;
    }

    /**
     * @notice Validate permissions with PermissionManager if it exists, If no Permission return false
     * @dev Note that IModule withPerm will allow ST owner all permissions anyway
     * @dev this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
     * @param _modules storage data
     * @param _delegate address of delegate
     * @param _module address of PermissionManager module
     * @param _perm the permissions
     * @return success
     */
    function checkPermission(address[] storage _modules, address _delegate, address _module, bytes32 _perm) public returns(bool) {
        if (_modules.length == 0) {
            return false;
        }

        for (uint8 i = 0; i < _modules.length; i++) {
            if (IPermissionManager(_modules[i]).checkPermission(_delegate, _module, _perm)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @notice Queries value at a defined checkpoint
     * @param _checkpoints is array of Checkpoint objects
     * @param _checkpointId Checkpoint ID to query
     * @param _currentValue Current value of checkpoint
     * @return uint256
     */
    function getValueAt(Checkpoint[] storage _checkpoints, uint256 _checkpointId, uint256 _currentValue) public returns(uint256) {
        //Checkpoint id 0 is when the token is first created - everyone has a zero balance
        if (_checkpointId == 0) {
          return 0;
        }
        if (_checkpoints.length == 0) {
            return _currentValue;
        }
        if (_checkpoints[0].checkpointId >= _checkpointId) {
            return _checkpoints[0].value;
        }
        if (_checkpoints[_checkpoints.length - 1].checkpointId < _checkpointId) {
            return _currentValue;
        }
        if (_checkpoints[_checkpoints.length - 1].checkpointId == _checkpointId) {
            return _checkpoints[_checkpoints.length - 1].value;
        }
        uint256 min = 0;
        uint256 max = _checkpoints.length - 1;
        while (max > min) {
            uint256 mid = (max + min) / 2;
            if (_checkpoints[mid].checkpointId == _checkpointId) {
                max = mid;
                break;
            }
            if (_checkpoints[mid].checkpointId < _checkpointId) {
                min = mid + 1;
            } else {
                max = mid;
            }
        }
        return _checkpoints[max].value;
    }

    /**
     * @notice store the changes to the checkpoint objects
     * @param _checkpoints the affected checkpoint object array
     * @param _newValue the new value that needs to be stored
     */
    function adjustCheckpoints(TokenLib.Checkpoint[] storage _checkpoints, uint256 _newValue, uint256 _currentCheckpointId) public {
        //No checkpoints set yet
        if (_currentCheckpointId == 0) {
            return;
        }
        //No previous checkpoint data - add current balance against checkpoint
        if (_checkpoints.length == 0) {
            _checkpoints.push(
                TokenLib.Checkpoint({
                    checkpointId: _currentCheckpointId,
                    value: _newValue
                })
            );
            return;
        }
        //No new checkpoints since last update
        if (_checkpoints[_checkpoints.length - 1].checkpointId == _currentCheckpointId) {
            return;
        }
        //New checkpoint, so record balance
        _checkpoints.push(
            TokenLib.Checkpoint({
                checkpointId: _currentCheckpointId,
                value: _newValue
            })
        );
    }


}
