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
     * @notice constructor
     * @dev Never called as contract is created through Proxy factory
     * @dev Needed otherwise contract is considered abstract
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    )
        public
        OZStorage(_name, _symbol, _decimals)
    {
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
            }
        }
        address[] memory holders = new address[](count);
        count = 0;
        for (i = 0; i < investors.length; i++) {
            if (balanceOfAt(investors[i], _checkpointId) > 0) {
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
     * @notice Get the balance according to the provided partitions
     * @param _owner Whom balance need to queried
     * @param _partition Partition which differentiate the tokens.
     * @return Amount of tokens as per the given partitions
     */
    function balanceOfByPartition(address _owner, bytes32 _partition) external view returns(uint256) {
        address[] memory tms = modules[TRANSFER_KEY];
        uint256 _amount = 0;
        for (uint256 i = 0; i < tms.length; i++) {
            _amount += ITransferManager(tms[i]).getTokensByPartition(_owner, _partition);
        }
        if (_amount == 0 && _partition == "UNLOCKED") {
            return balanceOf(_owner);
        }
        return _amount;
    }

    /**
     * @notice Returns the version of the SecurityToken
     */
    function getVersion() external view returns(uint8[] memory) {
        uint8[] memory version = new uint8[](3);
        version[0] = securityTokenVersion.major;
        version[1] = securityTokenVersion.minor;
        version[2] = securityTokenVersion.patch;
        return version;
    }

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
}
