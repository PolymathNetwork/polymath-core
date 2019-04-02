pragma solidity ^0.5.0;

import "./OZStorage.sol";
import "./SecurityTokenStorage.sol";
import "../libraries/TokenLib.sol";
import "../interfaces/IDataStore.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../modules/PermissionManager/IPermissionManager.sol";

contract STGetter is OZStorage, SecurityTokenStorage {

    using SafeMath for uint256;

     /**
     * @notice Used to return the details of a document with a known name (`bytes32`).
     * @param _name Name of the document
     * @return string The URI associated with the document.
     * @return bytes32 The hash (of the contents) of the document.
     * @return uint256 the timestamp at which the document was last modified.
     */
    function getDocument(bytes32 _name) external view returns (string memory, bytes32, uint256) {
        return (
            _documents[_name].uri,
            _documents[_name].docHash,
            _documents[_name].lastModified
        );
    }

    /**
     * @notice Used to retrieve a full list of documents attached to the smart contract.
     * @return bytes32 List of all documents names present in the contract.
     */
    function getAllDocuments() external view returns (bytes32[] memory) {
        return _docNames;
    }

    /**
     * @notice Gets list of times that checkpoints were created
     * @return List of checkpoint times
     */
    function getCheckpointTimes() external view returns(uint256[] memory) {
        return checkpointTimes;
    }

    /**
     * @notice Returns the count of address that were added as (potential) investors
     * @return Investor count
     */
    function getInvestorCount() external view returns(uint256) {
        IDataStore dataStoreInstance = IDataStore(dataStore);
        return dataStoreInstance.getAddressArrayLength(INVESTORSKEY);
    }

    /**
     * @notice returns an array of investors
     * NB - this length may differ from investorCount as it contains all investors that ever held tokens
     * @return list of addresses
     */
    function getInvestors() public view returns(address[] memory investors) {
        IDataStore dataStoreInstance = IDataStore(dataStore);
        investors = dataStoreInstance.getAddressArray(INVESTORSKEY);
    }

    /**
     * @notice returns an array of investors with non zero balance at a given checkpoint
     * @param _checkpointId Checkpoint id at which investor list is to be populated
     * @return list of investors
     */
    function getInvestorsAt(uint256 _checkpointId) external view returns(address[] memory) {
        uint256 count;
        uint256 i;
        IDataStore dataStoreInstance = IDataStore(dataStore);
        address[] memory investors = dataStoreInstance.getAddressArray(INVESTORSKEY);
        for (i = 0; i < investors.length; i++) {
            if (balanceOfAt(investors[i], _checkpointId) > 0) {
                count++;
            } else {
                investors[i] = address(0);
            }
        }
        address[] memory holders = new address[](count);
        count = 0;
        for (i = 0; i < investors.length; i++) {
            if (investors[i] != address(0)) {
                holders[count] = investors[i];
                count++;
            }
        }
        return holders;
    }

    /**
     * @notice returns an array of investors with non zero balance at a given checkpoint
     * @param _checkpointId Checkpoint id at which investor list is to be populated
     * @param _start Position of investor to start iteration from
     * @param _end Position of investor to stop iteration at
     * @return list of investors
     */
    function getInvestorsSubsetAt(uint256 _checkpointId, uint256 _start, uint256 _end) external view returns(address[] memory) {
        uint256 count;
        uint256 i;
        IDataStore dataStoreInstance = IDataStore(dataStore);
        address[] memory investors = dataStoreInstance.getAddressArrayElements(INVESTORSKEY, _start, _end);
        for (i = 0; i < investors.length; i++) {
            if (balanceOfAt(investors[i], _checkpointId) > 0) {
                count++;
            } else {
                investors[i] = address(0);
            }
        }
        address[] memory holders = new address[](count);
        count = 0;
        for (i = 0; i < investors.length; i++) {
            if (investors[i] != address(0)) {
                holders[count] = investors[i];
                count++;
            }
        }
        return holders;
    }

    /**
     * @notice Returns the data associated to a module
     * @param _module address of the module
     * @return bytes32 name
     * @return address module address
     * @return address module factory address
     * @return bool module archived
     * @return uint8 array of module types
     * @return bytes32 module label
     */
    function getModule(address _module) external view returns(bytes32, address, address, bool, uint8[] memory, bytes32) {
        return (
            modulesToData[_module].name,
            modulesToData[_module].module,
            modulesToData[_module].moduleFactory,
            modulesToData[_module].isArchived,
            modulesToData[_module].moduleTypes,
            modulesToData[_module].label
        );
    }

    /**
     * @notice Returns a list of modules that match the provided name
     * @param _name name of the module
     * @return address[] list of modules with this name
     */
    function getModulesByName(bytes32 _name) external view returns(address[] memory) {
        return names[_name];
    }

    /**
     * @notice Returns a list of modules that match the provided module type
     * @param _type type of the module
     * @return address[] list of modules with this type
     */
    function getModulesByType(uint8 _type) external view returns(address[] memory) {
        return modules[_type];
    }

    /**
     * @notice use to return the global treasury wallet
     */
    function getTreasuryWallet() external view returns(address) {
        return IDataStore(dataStore).getAddress(TREASURY);
    }

    /**
     * @notice Queries balances as of a defined checkpoint
     * @param _investor Investor to query balance for
     * @param _checkpointId Checkpoint ID to query as of
     */
    function balanceOfAt(address _investor, uint256 _checkpointId) public view returns(uint256) {
        require(_checkpointId <= currentCheckpointId);
        return TokenLib.getValueAt(checkpointBalances[_investor], _checkpointId, balanceOf(_investor));
    }

    /**
     * @notice Queries totalSupply as of a defined checkpoint
     * @param _checkpointId Checkpoint ID to query
     * @return uint256
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns(uint256) {
        require(_checkpointId <= currentCheckpointId);
        return checkpointTotalSupply[_checkpointId];
    }

    /**
     * @notice generates subset of investors
     * NB - can be used in batches if investor list is large. start and end both are included in array.
     * @param _start Position of investor to start iteration from
     * @param _end Position of investor to stop iteration at
     * @return list of investors
     */
    function iterateInvestors(uint256 _start, uint256 _end) external view returns(address[] memory) {
        IDataStore dataStoreInstance = IDataStore(dataStore);
        return dataStoreInstance.getAddressArrayElements(INVESTORSKEY, _start, _end);
    }

    /**
     * @notice Validate permissions with PermissionManager if it exists, If no Permission return false
     * @dev Note that IModule withPerm will allow ST owner all permissions anyway
     * @dev this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
     * @param _delegate address of delegate
     * @param _module address of PermissionManager module
     * @param _perm the permissions
     * @return success
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool) {
        for (uint256 i = 0; i < modules[PERMISSION_KEY].length; i++) {
            if (!modulesToData[modules[PERMISSION_KEY][i]].isArchived) {
                if (IPermissionManager(modules[PERMISSION_KEY][i]).checkPermission(_delegate, _module, _perm)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @notice Determines whether `_operator` is an operator for all partitions of `_tokenHolder`
     * @param _operator The operator to check
     * @param _tokenHolder The token holder to check
     * @return Whether the `_operator` is an operator for all partitions of `_tokenHolder`
     */
    function isOperator(address _operator, address _tokenHolder) public view returns (bool) {
        return approvals[_tokenHolder][_operator];
    }

    /**
     * @notice Determines whether `_operator` is an operator for a specified partition of `_tokenHolder`
     * @param _partition The partition to check
     * @param _operator The operator to check
     * @param _tokenHolder The token holder to check
     * @return Whether the `_operator` is an operator for a specified partition of `_tokenHolder`
     */
    function isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder) public view returns (bool) {
        return partitionApprovals[_tokenHolder][_partition][_operator];
    }

    /**
     * @notice Return all partitions
     * @param _tokenHolder Whom balance need to queried
     * @return List of partitions
     */
    function partitionsOf(address _tokenHolder) external view returns (bytes32[] memory) {
        address[] memory tms = modules[TRANSFER_KEY];
        /* uint256 count; */
        bytes32[] memory partitions;
        bytes32[] memory tmPartitions;
        // First determine the total number of non-distinct partitions
        for (uint256 i = 0; i < tms.length; i++) {
            tmPartitions = ITransferManager(tms[i]).getPartitions(_tokenHolder);
            for (uint256 j = 0 ; j < tmPartitions.length; j++) {
                partitions = _appendPartition(partitions, tmPartitions[j]);
            }
        }
        partitions = _appendPartition(partitions, "DEFAULT");
        /* bytes32[] memory partitions = new bytes32[](count + 1);
        count = 0;
        for (uint256 i = 0; i < tms.length; i++) {
            tmPartitions = ITransferManager(tms[i]).getPartitions(_tokenHolder);
            for (uint256 j = 0; j < tmPartitions.length; j++) {
                partitions[count + j] = tmPartitions[j];
            }
            count += tmPartitions.length;
        }
        partitions[count] = "DEFAULT";
        uint256[] memory index = new uint256[](count);
        count = 0;
        for (uint256 i = 0; i < partitions.length; i++) {
            for (uint256 j = 0; j < partitions.length; j++) {
                if (partitions[i] == partitions[j]) {
                    index[i] = j;
                }
            }
        }
        // Create distinct list
        bytes32[] memory result */
        return partitions;
    }

    function _appendPartition(bytes32[] memory partitions, bytes32 partition) internal pure returns (bytes32[] memory) {
        bool duplicate = false;
        for (uint256 i = 0; i < partitions.length; i++) {
            if (partition == partitions[i]) {
                duplicate = true;
                break;
            }
        }
        if (duplicate) {
            bytes32[] memory result = new bytes32[](1 + partitions.length);
            for (uint256 i = 0; i < partitions.length; i++) {
                result[i] = partitions[i];
            }
            result[partitions.length] = partition;
            return result;
        }
        return partitions;
    }

    /**
     * @notice Returns the version of the SecurityToken
     */
    function getVersion() external view returns(uint8[] memory) {
        uint8[] memory _version = new uint8[](3);
        _version[0] = securityTokenVersion.major;
        _version[1] = securityTokenVersion.minor;
        _version[2] = securityTokenVersion.patch;
        return _version;
    }

}
