pragma solidity ^0.5.0;

// File: contracts/interfaces/IBoot.sol

interface IBoot {
    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() external pure returns(bytes4);

}

// File: contracts/interfaces/IModuleFactory.sol

/**
 * @title Interface that every module factory contract should implement
 */
interface IModuleFactory {
    event ChangeSetupCost(uint256 _oldSetupCost, uint256 _newSetupCost);
    event ChangeUsageCost(uint256 _oldUsageCost, uint256 _newUsageCost);
    event GenerateModuleFromFactory(
        address _module,
        bytes32 indexed _moduleName,
        address indexed _moduleFactory,
        address _creator,
        uint256 _setupCost,
        uint256 _setupCostInPoly
    );
    event ChangeSTVersionBound(string _boundType, uint8 _major, uint8 _minor, uint8 _patch);

    //Should create an instance of the Module, or throw
    function deploy(bytes calldata _data) external returns(address);

    /**
     * @notice Get the tags related to the module factory
     */
    function version() external view returns(string memory);

    /**
     * @notice Get the tags related to the module factory
     */
    function name() external view returns(bytes32);

    /**
     * @notice Returns the title associated with the module
     */
    function title() external view returns(string memory);

    /**
     * @notice Returns the description associated with the module
     */
    function description() external view returns(string memory);

    /**
     * @notice Get the setup cost of the module in USD
     */
    function usageCost() external returns(uint256);

    /**
     * @notice Get the setup cost of the module in USD
     */
    function setupCost() external returns(uint256);

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory);

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory);

    /**
     * @notice Used to change the setup fee
     * @param _newSetupCost New setup fee
     */
    function changeSetupCost(uint256 _newSetupCost) external;

    /**
     * @notice Used to change the usage fee
     * @param _newUsageCost New usage fee
     */
    function changeUsageCost(uint256 _newUsageCost) external;

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion New version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external;

    /**
     * @notice Get the setup cost of the module in USD
     */
    function usageCostInPoly() external returns(uint256);

    /**
     * @notice Get the setup cost of the module
     */
    function setupCostInPoly() external returns (uint256);

    /**
     * @notice Used to get the lower bound
     * @return Lower bound
     */
    function lowerSTVersionBounds() external view returns(uint8[] memory);

    /**
     * @notice Used to get the upper bound
     * @return Upper bound
     */
    function upperSTVersionBounds() external view returns(uint8[] memory);

}

// File: contracts/interfaces/IOracle.sol

interface IOracle {
    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address);

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32);

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32);

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external returns(uint256);

}

// File: contracts/interfaces/IPolymathRegistry.sol

interface IPolymathRegistry {
    /**
     * @notice Returns the contract address
     * @param _nameKey is the key for the contract address mapping
     * @return address
     */
    function getAddress(string calldata _nameKey) external view returns(address);

}

// File: contracts/libraries/Util.sol

/**
 * @title Utility contract for reusable code
 */
library Util {
    /**
    * @notice Changes a string to upper case
    * @param _base String to change
    */
    function upper(string memory _base) internal pure returns(string memory) {
        bytes memory _baseBytes = bytes(_base);
        for (uint i = 0; i < _baseBytes.length; i++) {
            bytes1 b1 = _baseBytes[i];
            if (b1 >= 0x61 && b1 <= 0x7A) {
                b1 = bytes1(uint8(b1) - 32);
            }
            _baseBytes[i] = b1;
        }
        return string(_baseBytes);
    }

    /**
     * @notice Changes the string into bytes32
     * @param _source String that need to convert into bytes32
     */
    /// Notice - Maximum Length for _source will be 32 chars otherwise returned bytes32 value will have lossy value.
    function stringToBytes32(string memory _source) internal pure returns(bytes32) {
        return bytesToBytes32(bytes(_source), 0);
    }

    /**
     * @notice Changes bytes into bytes32
     * @param _b Bytes that need to convert into bytes32
     * @param _offset Offset from which to begin conversion
     */
    /// Notice - Maximum length for _source will be 32 chars otherwise returned bytes32 value will have lossy value.
    function bytesToBytes32(bytes memory _b, uint _offset) internal pure returns(bytes32) {
        bytes32 result;

        for (uint i = 0; i < _b.length; i++) {
            result |= bytes32(_b[_offset + i] & 0xFF) >> (i * 8);
        }
        return result;
    }

    /**
     * @notice Changes the bytes32 into string
     * @param _source that need to convert into string
     */
    function bytes32ToString(bytes32 _source) internal pure returns(string memory) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        uint j = 0;
        for (j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(_source) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    /**
     * @notice Gets function signature from _data
     * @param _data Passed data
     * @return bytes4 sig
     */
    function getSig(bytes memory _data) internal pure returns(bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint256 i = 0; i < len; i++) {
          sig |= bytes4(_data[i] & 0xFF) >> (i * 8);
        }
        return sig;
    }
}

// File: contracts/libraries/VersionUtils.sol

/**
 * @title Helper library use to compare or validate the semantic versions
 */

library VersionUtils {
    /**
     * @notice This function is used to validate the version submitted
     * @param _current Array holds the present version of ST
     * @param _new Array holds the latest version of the ST
     * @return bool
     */
    function isValidVersion(uint8[] memory _current, uint8[] memory _new) internal pure returns(bool) {
        bool[] memory _temp = new bool[](_current.length);
        uint8 counter = 0;
        uint8 i = 0;
        for (i = 0; i < _current.length; i++) {
            if (_current[i] < _new[i]) _temp[i] = true;
            else _temp[i] = false;
        }

        for (i = 0; i < _current.length; i++) {
            if (i == 0) {
                if (_current[i] <= _new[i]) if (_temp[0]) {
                    counter = counter + 3;
                    break;
                } else counter++;
                else return false;
            } else {
                if (_temp[i - 1]) counter++;
                else if (_current[i] <= _new[i]) counter++;
                else return false;
            }
        }
        if (counter == _current.length) return true;
    }

    /**
     * @notice Used to compare the lower bound with the latest version
     * @param _version1 Array holds the lower bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareLowerBound(uint8[] memory _version1, uint8[] memory _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length, "Input length mismatch");
        uint counter = 0;
        for (uint8 j = 0; j < _version1.length; j++) {
            if (_version1[j] == 0) counter++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                if (_version2[i] > _version1[i]) return true;
                else if (_version2[i] < _version1[i]) return false;
                else counter++;
            }
            if (counter == _version1.length - 1) return true;
            else return false;
        } else return true;
    }

    /**
     * @notice Used to compare the upper bound with the latest version
     * @param _version1 Array holds the upper bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareUpperBound(uint8[] memory _version1, uint8[] memory _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length, "Input length mismatch");
        uint counter = 0;
        for (uint8 j = 0; j < _version1.length; j++) {
            if (_version1[j] == 0) counter++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                if (_version1[i] > _version2[i]) return true;
                else if (_version1[i] < _version2[i]) return false;
                else counter++;
            }
            if (counter == _version1.length - 1) return true;
            else return false;
        } else return true;
    }

    /**
     * @notice Used to pack the uint8[] array data into uint24 value
     * @param _major Major version
     * @param _minor Minor version
     * @param _patch Patch version
     */
    function pack(uint8 _major, uint8 _minor, uint8 _patch) internal pure returns(uint24) {
        return (uint24(_major) << 16) | (uint24(_minor) << 8) | uint24(_patch);
    }

    /**
     * @notice Used to convert packed data into uint8 array
     * @param _packedVersion Packed data
     */
    function unpack(uint24 _packedVersion) internal pure returns(uint8[] memory) {
        uint8[] memory _unpackVersion = new uint8[](3);
        _unpackVersion[0] = uint8(_packedVersion >> 16);
        _unpackVersion[1] = uint8(_packedVersion >> 8);
        _unpackVersion[2] = uint8(_packedVersion);
        return _unpackVersion;
    }


    /**
     * @notice Used to packed the KYC data
     */
    function packKYC(uint64 _a, uint64 _b, uint64 _c, uint8 _d, uint8 _e, uint8 _f) internal pure returns(uint256) {
        return (uint256(_a) << 152) | (uint256(_b) << 88) | (uint256(_c) << 24) | (uint256(_d) << 16) | (uint256(_e) << 8) | uint256(_f);
    }

    /**
     * @notice Used to convert packed data into KYC data
     * @param _packedVersion Packed data
     */
    function unpackKYC(uint256 _packedVersion) internal pure returns(uint64 fromTime, uint64 toTime, uint64 expiryTime, uint8 canBuy, uint8 added, uint8 accredited) {
        fromTime = uint64(_packedVersion >> 152);
        toTime = uint64(_packedVersion >> 88);
        expiryTime = uint64(_packedVersion >> 24);
        canBuy = uint8(_packedVersion >> 16);
        added = uint8(_packedVersion >> 8);
        accredited = uint8(_packedVersion);
    }

}

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

/**
 * @title SafeMath
 * @dev Unsigned math operations with safety checks that revert on error
 */
library SafeMath {
    /**
    * @dev Multiplies two unsigned integers, reverts on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
    * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
    * @dev Adds two unsigned integers, reverts on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
    * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/modules/ModuleFactory.sol

/**
 * @title Interface that any module factory contract should implement
 * @notice Contract is abstract
 */
contract ModuleFactory is IModuleFactory, Ownable {

    address public polymathRegistry;

    string public version;
    bytes32 public name;
    string public title;
    string public description;

    uint8[] typesData; // Can't be modified unless using UpgradableModuleFactory
    bytes32[] tagsData;


    uint256 public usageCost; // Denominated in USD
    uint256 public setupCost; // Denominated in USD

    string constant POLY_ORACLE = "StablePolyUsdOracle";

    // @notice Allow only two variables to be stored
    // 1. lowerBound
    // 2. upperBound
    // @dev (0.0.0 will act as the wildcard)
    // @dev uint24 consists packed value of uint8 _major, uint8 _minor, uint8 _patch
    mapping(string => uint24) compatibleSTVersionRange;

    /**
     * @notice Constructor
     */
    constructor(uint256 _setupCost, uint256 _usageCost, address _polymathRegistry) public {
        setupCost = _setupCost;
        usageCost = _usageCost;
        polymathRegistry = _polymathRegistry;
    }

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        return typesData;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        return tagsData;
    }

    /**
     * @notice Used to change the fee of the setup cost
     * @param _setupCost new setup cost in USD
     */
    function changeSetupCost(uint256 _setupCost) public onlyOwner {
        emit ChangeSetupCost(setupCost, _setupCost);
        setupCost = _setupCost;
    }

    /**
     * @notice Used to change the fee of the usage cost
     * @param _usageCost new usage cost in USD
     */
    function changeUsageCost(uint256 _usageCost) public onlyOwner {
        emit ChangeUsageCost(usageCost, _usageCost);
        usageCost = _usageCost;
    }

    /**
     * @notice Updates the title of the ModuleFactory
     * @param _title New Title that will replace the old one.
     */
    function changeTitle(string memory _title) public onlyOwner {
        require(bytes(_title).length > 0, "Invalid text");
        title = _title;
    }

    /**
     * @notice Updates the description of the ModuleFactory
     * @param _description New description that will replace the old one.
     */
    function changeDescription(string memory _description) public onlyOwner {
        require(bytes(_description).length > 0, "Invalid text");
        description = _description;
    }

    /**
     * @notice Updates the name of the ModuleFactory
     * @param _name New name that will replace the old one.
     */
    function changeName(bytes32 _name) public onlyOwner {
        require(_name != bytes32(0), "Invalid text");
        name = _name;
    }

    /**
     * @notice Updates the version of the ModuleFactory
     * @param _version New name that will replace the old one.
     */
    function changeVersion(string memory _version) public onlyOwner {
        require(bytes(_version).length > 0, "Invalid text");
        version = _version;
    }

    /**
     * @notice Updates the tags of the ModuleFactory
     * @param _tagsData New list of tags
     */
    function changeTags(bytes32[] memory _tagsData) public onlyOwner {
        require(_tagsData.length > 0, "Invalid text");
        tagsData = _tagsData;
    }

    /**
     * @notice Function use to change the lower and upper bound of the compatible version st
     * @param _boundType Type of bound
     * @param _newVersion new version array
     */
    function changeSTVersionBounds(string calldata _boundType, uint8[] calldata _newVersion) external onlyOwner {
        require(
            keccak256(abi.encodePacked(_boundType)) == keccak256(abi.encodePacked("lowerBound")) || keccak256(
                abi.encodePacked(_boundType)
            ) == keccak256(abi.encodePacked("upperBound")),
            "Must be a valid bound type"
        );
        require(_newVersion.length == 3);
        if (compatibleSTVersionRange[_boundType] != uint24(0)) {
            uint8[] memory _currentVersion = VersionUtils.unpack(compatibleSTVersionRange[_boundType]);
            require(VersionUtils.isValidVersion(_currentVersion, _newVersion), "Failed because of in-valid version");
        }
        compatibleSTVersionRange[_boundType] = VersionUtils.pack(_newVersion[0], _newVersion[1], _newVersion[2]);
        emit ChangeSTVersionBound(_boundType, _newVersion[0], _newVersion[1], _newVersion[2]);
    }

    /**
     * @notice Used to get the lower bound
     * @return lower bound
     */
    function lowerSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["lowerBound"]);
    }

    /**
     * @notice Used to get the upper bound
     * @return upper bound
     */
    function upperSTVersionBounds() external view returns(uint8[] memory) {
        return VersionUtils.unpack(compatibleSTVersionRange["upperBound"]);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function setupCostInPoly() public returns (uint256) {
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        return SafeMath.div(setupCost, polyRate);
    }

    /**
     * @notice Get the setup cost of the module
     */
    function usageCostInPoly() public returns (uint256) {
        uint256 polyRate = IOracle(IPolymathRegistry(polymathRegistry).getAddress(POLY_ORACLE)).getPrice();
        return SafeMath.div(usageCost, polyRate);
    }

    /**
     * @notice Calculates fee in POLY
     */
    function _takeFee() internal returns(uint256) {
        uint256 polySetupCost = setupCostInPoly();
        address polyToken = IPolymathRegistry(polymathRegistry).getAddress("PolyToken");
        if (polySetupCost > 0) {
            require(IERC20(polyToken).transferFrom(msg.sender, owner(), polySetupCost), "Insufficient allowance for module fee");
        }
        return polySetupCost;
    }

    /**
     * @notice Used to initialize the module
     * @param _module Address of module
     * @param _data Data used for the intialization of the module factory variables
     */
    function _initializeModule(address _module, bytes memory _data) internal {
        uint256 polySetupCost = _takeFee();
        bytes4 initFunction = IBoot(_module).getInitFunction();
        if (initFunction != bytes4(0)) {
            require(Util.getSig(_data) == initFunction, "Provided data is not valid");
            /*solium-disable-next-line security/no-low-level-calls*/
            (bool success, ) = _module.call(_data);
            require(success, "Unsuccessful initialization");
        }
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(_module, name, address(this), msg.sender, setupCost, polySetupCost);
    }

}

// File: contracts/Pausable.sol

/**
 * @title Utility contract to allow pausing and unpausing of certain functions
 */
contract Pausable {
    event Pause(address account);
    event Unpause(address account);

    bool public paused = false;

    /**
    * @notice Modifier to make a function callable only when the contract is not paused.
    */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is paused.
    */
    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    /**
    * @notice Called by the owner to pause, triggers stopped state
    */
    function _pause() internal whenNotPaused {
        paused = true;
        /*solium-disable-next-line security/no-block-members*/
        emit Pause(msg.sender);
    }

    /**
    * @notice Called by the owner to unpause, returns to normal state
    */
    function _unpause() internal whenPaused {
        paused = false;
        /*solium-disable-next-line security/no-block-members*/
        emit Unpause(msg.sender);
    }

}

// File: contracts/interfaces/ITransferManager.sol

/**
 * @title Interface to be implemented by all Transfer Manager modules
 */
interface ITransferManager {
    enum Result {INVALID, NA, VALID, FORCE_VALID}

    /**
     * @notice Determines if the transfer between these two accounts can happen
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data, bool _isTransfer) external returns(Result);
}

// File: contracts/interfaces/ICheckPermission.sol

interface ICheckPermission {
    /**
     * @notice Validate permissions with PermissionManager if it exists, If no Permission return false
     * @dev Note that IModule withPerm will allow ST owner all permissions anyway
     * @dev this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
     * @param _delegate address of delegate
     * @param _module address of PermissionManager module
     * @param _perm the permissions
     * @return success
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool);
}

// File: contracts/interfaces/IDataStore.sol

interface IDataStore {
    /**
     * @dev Changes security token atatched to this data store
     * @param _securityToken address of the security token
     */
    function setSecurityToken(address _securityToken) external;

    /**
     * @dev Stores a uint256 data against a key
     * @param _key Unique key to identify the data
     * @param _data Data to be stored against the key
     */
    function setUint256(bytes32 _key, uint256 _data) external;

    function setBytes32(bytes32 _key, bytes32 _data) external;

    function setAddress(bytes32 _key, address _data) external;

    function setString(bytes32 _key, string calldata _data) external;

    function setBytes(bytes32 _key, bytes calldata _data) external;

    function setBool(bytes32 _key, bool _data) external;

    /**
     * @dev Stores a uint256 array against a key
     * @param _key Unique key to identify the array
     * @param _data Array to be stored against the key
     */
    function setUint256Array(bytes32 _key, uint256[] calldata _data) external;

    function setBytes32Array(bytes32 _key, bytes32[] calldata _data) external ;

    function setAddressArray(bytes32 _key, address[] calldata _data) external;

    function setBoolArray(bytes32 _key, bool[] calldata _data) external;

    /**
     * @dev Inserts a uint256 element to the array identified by the key
     * @param _key Unique key to identify the array
     * @param _data Element to push into the array
     */
    function insertUint256(bytes32 _key, uint256 _data) external;

    function insertBytes32(bytes32 _key, bytes32 _data) external;

    function insertAddress(bytes32 _key, address _data) external;

    function insertBool(bytes32 _key, bool _data) external;

    /**
     * @dev Deletes an element from the array identified by the key.
     * When an element is deleted from an Array, last element of that array is moved to the index of deleted element.
     * @param _key Unique key to identify the array
     * @param _index Index of the element to delete
     */
    function deleteUint256(bytes32 _key, uint256 _index) external;

    function deleteBytes32(bytes32 _key, uint256 _index) external;

    function deleteAddress(bytes32 _key, uint256 _index) external;

    function deleteBool(bytes32 _key, uint256 _index) external;

    /**
     * @dev Stores multiple uint256 data against respective keys
     * @param _keys Array of keys to identify the data
     * @param _data Array of data to be stored against the respective keys
     */
    function setUint256Multi(bytes32[] calldata _keys, uint256[] calldata _data) external;

    function setBytes32Multi(bytes32[] calldata _keys, bytes32[] calldata _data) external;

    function setAddressMulti(bytes32[] calldata _keys, address[] calldata _data) external;

    function setBoolMulti(bytes32[] calldata _keys, bool[] calldata _data) external;

    /**
     * @dev Inserts multiple uint256 elements to the array identified by the respective keys
     * @param _keys Array of keys to identify the data
     * @param _data Array of data to be inserted in arrays of the respective keys
     */
    function insertUint256Multi(bytes32[] calldata _keys, uint256[] calldata _data) external;

    function insertBytes32Multi(bytes32[] calldata _keys, bytes32[] calldata _data) external;

    function insertAddressMulti(bytes32[] calldata _keys, address[] calldata _data) external;

    function insertBoolMulti(bytes32[] calldata _keys, bool[] calldata _data) external;

    function getUint256(bytes32 _key) external view returns(uint256);

    function getBytes32(bytes32 _key) external view returns(bytes32);

    function getAddress(bytes32 _key) external view returns(address);

    function getString(bytes32 _key) external view returns(string memory);

    function getBytes(bytes32 _key) external view returns(bytes memory);

    function getBool(bytes32 _key) external view returns(bool);

    function getUint256Array(bytes32 _key) external view returns(uint256[] memory);

    function getBytes32Array(bytes32 _key) external view returns(bytes32[] memory);

    function getAddressArray(bytes32 _key) external view returns(address[] memory);

    function getBoolArray(bytes32 _key) external view returns(bool[] memory);

    function getUint256ArrayLength(bytes32 _key) external view returns(uint256);

    function getBytes32ArrayLength(bytes32 _key) external view returns(uint256);

    function getAddressArrayLength(bytes32 _key) external view returns(uint256);

    function getBoolArrayLength(bytes32 _key) external view returns(uint256);

    function getUint256ArrayElement(bytes32 _key, uint256 _index) external view returns(uint256);

    function getBytes32ArrayElement(bytes32 _key, uint256 _index) external view returns(bytes32);

    function getAddressArrayElement(bytes32 _key, uint256 _index) external view returns(address);

    function getBoolArrayElement(bytes32 _key, uint256 _index) external view returns(bool);
}

// File: contracts/interfaces/IModule.sol

/**
 * @title Interface that every module contract should implement
 */
interface IModule {
    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns(bytes4);

    /**
     * @notice Return the permission flags that are associated with a module
     */
    function getPermissions() external view returns(bytes32[] memory);

    /**
     * @notice Used to withdraw the fee by the factory owner
     */
    function takeUsageFee() external returns(bool);

}

// File: contracts/interfaces/ISecurityToken.sol

/**
 * @title Interface for all security tokens
 */
interface ISecurityToken {
    // Standard ERC20 interface
    function decimals() external view returns(uint8);
    function totalSupply() external view returns(uint256);
    function balanceOf(address _owner) external view returns(uint256);
    function allowance(address _owner, address _spender) external view returns(uint256);
    function transfer(address _to, uint256 _value) external returns(bool);
    function transferFrom(address _from, address _to, uint256 _value) external returns(bool);
    function approve(address _spender, uint256 _value) external returns(bool);
    function decreaseApproval(address _spender, uint _subtractedValue) external returns(bool);
    function increaseApproval(address _spender, uint _addedValue) external returns(bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @notice Validates a transfer with a TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @param _from Sender of transfer
     * @param _to Receiver of transfer
     * @param _value Value of transfer
     * @return bool
     */
    function verifyTransfer(address _from, address _to, uint256 _value, bytes calldata _data) external returns(bool success);

    /**
     * @notice Checks if an address is a module of certain type
     * @param _module Address to check
     * @param _type type to check against
     */
    function isModule(address _module, uint8 _type) external view returns(bool);

    /**
     * @notice Mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investor Address the tokens will be minted to
     * @param _value is the amount of tokens that will be minted to the investor
     * @return success
     */
    function mint(address _investor, uint256 _value) external returns(bool success);

    /**
     * @notice Mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investor Address the tokens will be minted to
     * @param _value is The amount of tokens that will be minted to the investor
     * @param _data Data to indicate validation
     */
    function mintWithData(address _investor, uint256 _value, bytes calldata _data) external returns(bool success);

    /**
     * @notice Used to burn the securityToken on behalf of someone else
     * @param _from Address for whom to burn tokens
     * @param _value No. of tokens to be burned
     * @param _data Data to indicate validation
     */
    function burnFromWithData(address _from, uint256 _value, bytes calldata _data) external;

    /**
     * @notice Used to burn the securityToken
     * @param _value No. of tokens to be burned
     * @param _data Data to indicate validation
     */
    function burnWithData(uint256 _value, bytes calldata _data) external;

    event Minted(address indexed _to, uint256 _value);
    event Burnt(address indexed _burner, uint256 _value);

    /**
     * @notice Validate permissions with PermissionManager if it exists, If no Permission return false
     * @dev Note that IModule withPerm will allow ST owner all permissions anyway
     * @dev this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
     * @param _delegate address of delegate
     * @param _module address of PermissionManager module
     * @param _perm the permissions
     * @return success
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool);

    /**
     * @notice Returns module list for a module type
     * @param _module Address of the module
     * @return bytes32 Name
     * @return address Module address
     * @return address Module factory address
     * @return bool Module archived
     * @return uint8 Array of module types
     * @return bytes32 Module label
     */
    function getModule(address _module) external view returns (bytes32, address, address, bool, uint8[] memory, bytes32);

    /**
     * @notice Returns module list for a module name
     * @param _name Name of the module
     * @return address[] List of modules with this name
     */
    function getModulesByName(bytes32 _name) external view returns(address[] memory);

    /**
     * @notice Returns module list for a module type
     * @param _type Type of the module
     * @return address[] List of modules with this type
     */
    function getModulesByType(uint8 _type) external view returns(address[] memory);

    /**
     * @notice Queries totalSupply at a specified checkpoint
     * @param _checkpointId Checkpoint ID to query as of
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns(uint256);

    /**
     * @notice Queries balance at a specified checkpoint
     * @param _investor Investor to query balance for
     * @param _checkpointId Checkpoint ID to query as of
     */
    function balanceOfAt(address _investor, uint256 _checkpointId) external view returns(uint256);

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     */
    function createCheckpoint() external returns(uint256);

    /**
     * @notice Gets list of times that checkpoints were created
     * @return List of checkpoint times
     */
    function getCheckpointTimes() external view returns(uint256[] memory);

    /**
     * @notice Gets length of investors array
     * NB - this length may differ from investorCount if the list has not been pruned of zero-balance investors
     * @return Length
     */
    function getInvestors() external view returns(address[] memory);

    /**
     * @notice returns an array of investors at a given checkpoint
     * NB - this length may differ from investorCount as it contains all investors that ever held tokens
     * @param _checkpointId Checkpoint id at which investor list is to be populated
     * @return list of investors
     */
    function getInvestorsAt(uint256 _checkpointId) external view returns(address[] memory);

    /**
     * @notice generates subset of investors
     * NB - can be used in batches if investor list is large
     * @param _start Position of investor to start iteration from
     * @param _end Position of investor to stop iteration at
     * @return list of investors
     */
    function iterateInvestors(uint256 _start, uint256 _end) external view returns(address[] memory);

    /**
     * @notice Gets current checkpoint ID
     * @return Id
     */
    function currentCheckpointId() external view returns(uint256);

    /**
     * @notice Gets data store address
     * @return data store address
     */
    function dataStore() external view returns (address);

    /**
    * @notice Allows owner to change data store
    * @param _dataStore Address of the token data store
    */
    function changeDataStore(address _dataStore) external;

   /**
    * @notice Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _tokenContract Address of the ERC20Basic compliance token
    * @param _value Amount of POLY to withdraw
    */
    function withdrawERC20(address _tokenContract, uint256 _value) external;

    /**
    * @notice Allows owner to increase/decrease POLY approval of one of the modules
    * @param _module Module address
    * @param _change Change in allowance
    * @param _increase True if budget has to be increased, false if decrease
    */
    function changeModuleBudget(address _module, uint256 _change, bool _increase) external;

    /**
     * @notice Changes the tokenDetails
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string calldata _newTokenDetails) external;

    /**
    * @notice Allows the owner to change token granularity
    * @param _granularity Granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external;

    /**
     * @notice Freezes all the transfers
     */
    function freezeTransfers() external;

    /**
     * @notice Un-freezes all the transfers
     */
    function unfreezeTransfers() external;

    /**
     * @notice Ends token minting period permanently
     */
    function freezeMinting() external;

    /**
     * @notice Mints new tokens and assigns them to the target investors.
     * Can only be called by the STO attached to the token or by the Issuer (Security Token contract owner)
     * @param _investors A list of addresses to whom the minted tokens will be delivered
     * @param _values A list of the amount of tokens to mint to corresponding addresses from _investor[] list
     * @return Success
     */
    function mintMulti(address[] calldata _investors, uint256[] calldata _values) external returns(bool success);

     /**
      * @notice Attachs a module to the SecurityToken
      * @dev  E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
      * @dev to control restrictions on transfers.
      * @param _moduleFactory is the address of the module factory to be added
      * @param _data is data packed into bytes used to further configure the module (See STO usage)
      * @param _maxCost max amount of POLY willing to pay to the module.
      * @param _budget max amount of ongoing POLY willing to assign to the module.
      * @param _label custom module label.
      */
    function addModuleWithLabel(
        address _moduleFactory,
        bytes calldata _data,
        uint256 _maxCost,
        uint256 _budget,
        bytes32 _label
    ) external;

    /**
     * @notice Function used to attach a module to the security token
     * @dev  E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
     * @dev to control restrictions on transfers.
     * @dev You are allowed to add a new moduleType if:
     * @dev - there is no existing module of that type yet added
     * @dev - the last member of the module list is replacable
     * @param _moduleFactory is the address of the module factory to be added
     * @param _data is data packed into bytes used to further configure the module (See STO usage)
     * @param _maxCost max amount of POLY willing to pay to module. (WIP)
     * @param _budget max amount of ongoing POLY willing to assign to the module.
     */
    function addModule(address _moduleFactory, bytes calldata _data, uint256 _maxCost, uint256 _budget) external;

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function archiveModule(address _module) external;

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function unarchiveModule(address _module) external;

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function removeModule(address _module) external;

    /**
     * @notice Used by the issuer to set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) external;

    /**
     * @notice Used by a controller to execute a forced transfer
     * @param _from address from which to take tokens
     * @param _to address where to send tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceTransfer(address _from, address _to, uint256 _value, bytes calldata _data, bytes calldata _log) external;

    /**
     * @notice Used by a controller to execute a foced burn
     * @param _from address from which to take tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceBurn(address _from, uint256 _value, bytes calldata _data, bytes calldata _log) external;

    /**
     * @notice Used by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
    function disableController() external;

    /**
     * @notice Used to get the version of the securityToken
     */
    function getVersion() external view returns(uint8[] memory);

    /**
     * @notice Gets the investor count
     */
    function getInvestorCount() external view returns(uint256);

    /**
      * @notice Overloaded version of the transfer function
      * @param _to receiver of transfer
      * @param _value value of transfer
      * @param _data data to indicate validation
      * @return bool success
      */
    function transferWithData(address _to, uint256 _value, bytes calldata _data) external returns(bool success);

    /**
      * @notice Overloaded version of the transferFrom function
      * @param _from sender of transfer
      * @param _to receiver of transfer
      * @param _value value of transfer
      * @param _data data to indicate validation
      * @return bool success
      */
    function transferFromWithData(address _from, address _to, uint256 _value, bytes calldata _data) external returns(bool);

    /**
      * @notice Provides the granularity of the token
      * @return uint256
      */
    function granularity() external view returns(uint256);
}

// File: contracts/modules/ModuleStorage.sol

/**
 * @title Storage for Module contract
 * @notice Contract is abstract
 */
contract ModuleStorage {
    address public factory;

    address public securityToken;

    bytes32 public constant FEE_ADMIN = "FEE_ADMIN";

    IERC20 public polyToken;

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor(address _securityToken, address _polyAddress) public {
        securityToken = _securityToken;
        factory = msg.sender;
        polyToken = IERC20(_polyAddress);
    }

}

// File: contracts/modules/Module.sol

/**
 * @title Interface that any module contract should implement
 * @notice Contract is abstract
 */
contract Module is IModule, ModuleStorage {
    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor (address _securityToken, address _polyAddress) public
    ModuleStorage(_securityToken, _polyAddress)
    {
    }

    //Allows owner, factory or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == Ownable(securityToken).owner();
        bool isFactory = msg.sender == factory;
        require(
            isOwner || isFactory || ICheckPermission(securityToken).checkPermission(msg.sender, address(this), _perm),
            "Permission check failed"
        );
        _;
    }

    function _onlySecurityTokenOwner() internal view {
        require(msg.sender == Ownable(securityToken).owner(), "Sender is not owner");
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Sender is not factory");
        _;
    }

    modifier onlyFactoryOwner() {
        require(msg.sender == Ownable(factory).owner(), "Sender is not factory owner");
        _;
    }

    modifier onlyFactoryOrOwner() {
        require((msg.sender == Ownable(securityToken).owner()) || (msg.sender == factory), "Sender is not factory or owner");
        _;
    }

    /**
     * @notice used to withdraw the fee by the factory owner
     */
    function takeUsageFee() public withPerm(FEE_ADMIN) returns(bool) {
        require(polyToken.transferFrom(securityToken, Ownable(factory).owner(), IModuleFactory(factory).usageCostInPoly()), "Unable to take fee");
        return true;
    }

    function getDataStore() public view returns(address) {
        return ISecurityToken(securityToken).dataStore();
    }
}

// File: contracts/modules/TransferManager/TransferManager.sol

/**
 * @title Base abstract contract to be implemented by all Transfer Manager modules
 */
contract TransferManager is ITransferManager, Module, Pausable {
  
    function unpause() public {
        _onlySecurityTokenOwner();
        super._unpause();
    }

    function pause() public {
        _onlySecurityTokenOwner();
        super._pause();
    }
}

// File: contracts/modules/Experimental/TransferManager/LockUpTransferManager.sol

contract LockUpTransferManager is TransferManager {

    using SafeMath for uint256;

    // permission definition
    bytes32 public constant ADMIN = "ADMIN";

    // a per-user lockup
    struct LockUp {
        uint256 lockupAmount; // Amount to be locked
        uint256 startTime; // when this lockup starts (seconds)
        uint256 lockUpPeriodSeconds; // total period of lockup (seconds)
        uint256 releaseFrequencySeconds; // how often to release a tranche of tokens (seconds)
    }

    // mapping use to store the lockup details corresponds to lockup name
    mapping (bytes32 => LockUp) public lockups;
    // mapping user addresses to an array of lockups name for that user
    mapping (address => bytes32[]) internal userToLockups;
    // get list of the addresses for a particular lockupName
    mapping (bytes32 => address[]) internal lockupToUsers;
    // holds lockup index corresponds to user address. userAddress => lockupName => lockupIndex
    mapping (address => mapping(bytes32 => uint256)) internal userToLockupIndex;
    // holds the user address index corresponds to the lockup. lockupName => userAddress => userIndex
    mapping (bytes32 => mapping(address => uint256)) internal lockupToUserIndex;

    bytes32[] lockupArray;

    event AddLockUpToUser(
        address indexed _userAddress,
        bytes32 indexed _lockupName
    );

    event RemoveLockUpFromUser(
        address indexed _userAddress,
        bytes32 indexed _lockupName
    );

    event ModifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 indexed _lockupName
    );

    event AddNewLockUpType(
        bytes32 indexed _lockupName,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    );

    event RemoveLockUpType(bytes32 indexed _lockupName);

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

    /** @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bytes memory /* _data */, bool /*_isTransfer*/) public returns(Result) {
        // only attempt to verify the transfer if the token is unpaused, this isn't a mint txn, and there exists a lockup for this user
        if (!paused && _from != address(0) && userToLockups[_from].length != 0) {
            // check if this transfer is valid
            return _checkIfValidTransfer(_from, _amount);
        }
        return Result.NA;
    }

    /**
     * @notice Use to add the new lockup type
     * @param _lockupAmount Amount of tokens that need to lock.
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName Name of the lockup
     */
    function addNewLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        public
        withPerm(ADMIN)
    {
        _addNewLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Use to add the new lockup type
     * @param _lockupAmounts Array of amount of tokens that need to lock.
     * @param _startTimes Array of startTimes when this lockup starts (seconds)
     * @param _lockUpPeriodsSeconds Array of total period of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of names of the lockup
     */
    function addNewLockUpTypeMulti(
        uint256[] calldata _lockupAmounts,
        uint256[] calldata _startTimes,
        uint256[] calldata _lockUpPeriodsSeconds,
        uint256[] calldata _releaseFrequenciesSeconds,
        bytes32[] calldata _lockupNames
    )
        external
        withPerm(ADMIN)
    {
        require(
            _lockupNames.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _lockupAmounts.length,
            "Input array length mismatch"
        );
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _addNewLockUpType(
                _lockupAmounts[i],
                _startTimes[i],
                _lockUpPeriodsSeconds[i],
                _releaseFrequenciesSeconds[i],
                _lockupNames[i]
            );
        }
    }

    /**
     * @notice Add the lockup to a user
     * @param _userAddress Address of the user
     * @param _lockupName Name of the lockup
     */
    function addLockUpByName(
        address _userAddress,
        bytes32 _lockupName
    )
        public
        withPerm(ADMIN)
    {
        _addLockUpByName(_userAddress, _lockupName);
    }

    /**
     * @notice Add the lockup to a user
     * @param _userAddresses Address of the user
     * @param _lockupNames Name of the lockup
     */
    function addLockUpByNameMulti(
        address[] calldata _userAddresses,
        bytes32[] calldata _lockupNames
    )
        external
        withPerm(ADMIN)
    {
        require(_userAddresses.length == _lockupNames.length, "Length mismatch");
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _addLockUpByName(_userAddresses[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin create a volume restriction lockup for a given address.
     * @param _userAddress Address of the user whose tokens should be locked up
     * @param _lockupAmount Amount of tokens that need to lock.
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName Name of the lockup
     */
    function addNewLockUpToUser(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
       _addNewLockUpToUser(
            _userAddress,
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Lets the admin create multiple volume restriction lockups for multiple given addresses.
     * @param _userAddresses Array of address of the user whose tokens should be locked up
     * @param _lockupAmounts Array of the amounts that need to be locked for the different addresses.
     * @param _startTimes Array of When this lockup starts (seconds)
     * @param _lockUpPeriodsSeconds Array of total periods of lockup (seconds)
     * @param _releaseFrequenciesSeconds Array of how often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of names of the lockup
     */
    function addNewLockUpToUserMulti(
        address[] memory _userAddresses,
        uint256[] memory _lockupAmounts,
        uint256[] memory _startTimes,
        uint256[] memory _lockUpPeriodsSeconds,
        uint256[] memory _releaseFrequenciesSeconds,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        require(
            _userAddresses.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _userAddresses.length == _lockupAmounts.length &&
            _userAddresses.length == _lockupNames.length,
            "Input array length mismatch"
        );
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _addNewLockUpToUser(_userAddresses[i], _lockupAmounts[i], _startTimes[i], _lockUpPeriodsSeconds[i], _releaseFrequenciesSeconds[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin remove a user's lock up
     * @param _userAddress Address of the user whose tokens are locked up
     * @param _lockupName Name of the lockup need to be removed.
     */
    function removeLockUpFromUser(address _userAddress, bytes32 _lockupName) external withPerm(ADMIN) {
        _removeLockUpFromUser(_userAddress, _lockupName);
    }

    /**
     * @notice Used to remove the lockup type
     * @param _lockupName Name of the lockup
     */
    function removeLockupType(bytes32 _lockupName) external withPerm(ADMIN) {
        _removeLockupType(_lockupName);
    }

    /**
     * @notice Used to remove the multiple lockup type
     * @param _lockupNames Array of the lockup names.
     */
    function removeLockupTypeMulti(bytes32[] calldata _lockupNames) external withPerm(ADMIN) {
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _removeLockupType(_lockupNames[i]);
        }
    }

    /**
     * @notice Use to remove the lockup for multiple users
     * @param _userAddresses Array of addresses of the user whose tokens are locked up
     * @param _lockupNames Array of the names of the lockup that needs to be removed.
     */
    function removeLockUpFromUserMulti(address[] calldata _userAddresses, bytes32[] calldata _lockupNames) external withPerm(ADMIN) {
        require(_userAddresses.length == _lockupNames.length, "Array length mismatch");
        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _removeLockUpFromUser(_userAddresses[i], _lockupNames[i]);
        }
    }

    /**
     * @notice Lets the admin modify a lockup.
     * @param _lockupAmount Amount of tokens that needs to be locked
     * @param _startTime When this lockup starts (seconds)
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     * @param _lockupName name of the lockup that needs to be modified.
     */
    function modifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        external
        withPerm(ADMIN)
    {
        _modifyLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    /**
     * @notice Lets the admin modify a volume restriction lockup for a multiple address.
     * @param _lockupAmounts Array of the amount of tokens that needs to be locked for the respective addresses.
     * @param _startTimes Array of the start time of the lockups (seconds)
     * @param _lockUpPeriodsSeconds Array of unix timestamp for the list of lockups (seconds).
     * @param _releaseFrequenciesSeconds How often to release a tranche of tokens (seconds)
     * @param _lockupNames Array of the lockup names that needs to be modified
     */
    function modifyLockUpTypeMulti(
        uint256[] memory _lockupAmounts,
        uint256[] memory _startTimes,
        uint256[] memory _lockUpPeriodsSeconds,
        uint256[] memory _releaseFrequenciesSeconds,
        bytes32[] memory _lockupNames
    )
        public
        withPerm(ADMIN)
    {
        require(
            _lockupNames.length == _lockUpPeriodsSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _releaseFrequenciesSeconds.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _startTimes.length && /*solium-disable-line operator-whitespace*/
            _lockupNames.length == _lockupAmounts.length,
            "Input array length mismatch"
        );
        for (uint256 i = 0; i < _lockupNames.length; i++) {
            _modifyLockUpType(
                _lockupAmounts[i],
                _startTimes[i],
                _lockUpPeriodsSeconds[i],
                _releaseFrequenciesSeconds[i],
                _lockupNames[i]
            );
        }
    }

    /**
     * @notice Get a specific element in a user's lockups array given the user's address and the element index
     * @param _lockupName The name of the lockup
     */
    function getLockUp(bytes32 _lockupName) external view returns (
        uint256 lockupAmount,
        uint256 startTime,
        uint256 lockUpPeriodSeconds,
        uint256 releaseFrequencySeconds,
        uint256 unlockedAmount
    ) {
        if (lockups[_lockupName].lockupAmount != 0) {
            return (
                lockups[_lockupName].lockupAmount,
                lockups[_lockupName].startTime,
                lockups[_lockupName].lockUpPeriodSeconds,
                lockups[_lockupName].releaseFrequencySeconds,
                _getUnlockedAmountForLockup(_lockupName)
            );
        }
        return (uint256(0), uint256(0), uint256(0), uint256(0), uint256(0));
    }

   /**
    * @notice get the list of the users of a lockup type
    * @param _lockupName Name of the lockup type
    * @return address List of users associated with the blacklist
    */
    function getListOfAddresses(bytes32 _lockupName) external view returns(address[] memory) {
        require(lockups[_lockupName].startTime != 0, "Blacklist type doesn't exist");
        return lockupToUsers[_lockupName];
    }

    /**
     * @notice get the list of lockups names
     * @return bytes32 Array of lockups names
     */
    function getAllLockups() external view returns(bytes32[] memory) {
        return lockupArray;
    }

    /**
     * @notice get the list of the lockups for a given user
     * @param _user Address of the user
     * @return bytes32 List of lockups names associated with the given address
     */
    function getLockupsNamesToUser(address _user) external view returns(bytes32[] memory) {
        return userToLockups[_user];
    }

    /**
     * @notice Use to get the total locked tokens for a given user
     * @param _userAddress Address of the user
     * @return uint256 Total locked tokens amount
     */
    function getLockedTokenToUser(address _userAddress) public view returns(uint256) {
        require(_userAddress != address(0), "Invalid address");
        bytes32[] memory userLockupNames = userToLockups[_userAddress];
        uint256 totalRemainingLockedAmount = 0;

        for (uint256 i = 0; i < userLockupNames.length; i++) {
            // Find out the remaining locked amount for a given lockup
            uint256 remainingLockedAmount = lockups[userLockupNames[i]].lockupAmount.sub(_getUnlockedAmountForLockup(userLockupNames[i]));
            // aggregating all the remaining locked amount for all the lockups for a given address
            totalRemainingLockedAmount = totalRemainingLockedAmount.add(remainingLockedAmount);
        }
        return totalRemainingLockedAmount;
    }

    /**
     * @notice Checks whether the transfer is allowed
     * @param _userAddress Address of the user whose lock ups should be checked
     * @param _amount Amount of tokens that need to transact
     */
    function _checkIfValidTransfer(address _userAddress, uint256 _amount) internal view returns (Result) {
        uint256 totalRemainingLockedAmount = getLockedTokenToUser(_userAddress);
        // Present balance of the user
        uint256 currentBalance = IERC20(securityToken).balanceOf(_userAddress);
        if ((currentBalance.sub(_amount)) >= totalRemainingLockedAmount) {
            return Result.NA;
        }
        return Result.INVALID;
    }

    /**
     * @notice Provide the unlock amount for the given lockup for a particular user
     */
    function _getUnlockedAmountForLockup(bytes32 _lockupName) internal view returns (uint256) {
        /*solium-disable-next-line security/no-block-members*/
        if (lockups[_lockupName].startTime > now) {
            return 0;
        } else if (lockups[_lockupName].startTime.add(lockups[_lockupName].lockUpPeriodSeconds) <= now) {
            return lockups[_lockupName].lockupAmount;
        } else {
            // Calculate the no. of periods for a lockup
            uint256 noOfPeriods = (lockups[_lockupName].lockUpPeriodSeconds).div(lockups[_lockupName].releaseFrequencySeconds);
            // Calculate the transaction time lies in which period
            /*solium-disable-next-line security/no-block-members*/
            uint256 elapsedPeriod = (now.sub(lockups[_lockupName].startTime)).div(lockups[_lockupName].releaseFrequencySeconds);
            // Find out the unlocked amount for a given lockup
            uint256 unLockedAmount = (lockups[_lockupName].lockupAmount.mul(elapsedPeriod)).div(noOfPeriods);
            return unLockedAmount;
        }
    }

    function _removeLockupType(bytes32 _lockupName) internal {
        require(lockups[_lockupName].startTime != 0, "Lockup type doesn’t exist");
        require(lockupToUsers[_lockupName].length == 0, "Users are associated with the lockup");
        // delete lockup type
        delete(lockups[_lockupName]);
        uint256 i = 0;
        for (i = 0; i < lockupArray.length; i++) {
            if (lockupArray[i] == _lockupName) {
                break;
            }
        }
        if (i != lockupArray.length -1) {
            lockupArray[i] = lockupArray[lockupArray.length -1];
        }
        lockupArray.length--;
        emit RemoveLockUpType(_lockupName);
    }

    function _modifyLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        /*solium-disable-next-line security/no-block-members*/
        uint256 startTime = _startTime;

        if (_startTime == 0) {
            startTime = now;
        }
        require(startTime >= now, "Invalid start time");
        require(lockups[_lockupName].lockupAmount != 0, "Doesn't exist");

        _checkLockUpParams(
            _lockupAmount,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );

        lockups[_lockupName] =  LockUp(
            _lockupAmount,
            startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds
        );

        emit ModifyLockUpType(
            _lockupAmount,
            startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
    }

    function _removeLockUpFromUser(address _userAddress, bytes32 _lockupName) internal {
        require(_userAddress != address(0), "Invalid address");
        require(_lockupName != bytes32(0), "Invalid lockup name");
        require(
            userToLockups[_userAddress][userToLockupIndex[_userAddress][_lockupName]] == _lockupName,
            "User not assosicated with given lockup"
        );

        // delete the user from the lockup type
        uint256 _lockupIndex = lockupToUserIndex[_lockupName][_userAddress];
        uint256 _len = lockupToUsers[_lockupName].length;
        if ( _lockupIndex != _len) {
            lockupToUsers[_lockupName][_lockupIndex] = lockupToUsers[_lockupName][_len - 1];
            lockupToUserIndex[_lockupName][lockupToUsers[_lockupName][_lockupIndex]] = _lockupIndex;
        }
        lockupToUsers[_lockupName].length--;
        // delete the user index from the lockup
        delete(lockupToUserIndex[_lockupName][_userAddress]);
        // delete the lockup from the user
        uint256 _userIndex = userToLockupIndex[_userAddress][_lockupName];
        _len = userToLockups[_userAddress].length;
        if ( _userIndex != _len) {
            userToLockups[_userAddress][_userIndex] = userToLockups[_userAddress][_len - 1];
            userToLockupIndex[_userAddress][userToLockups[_userAddress][_userIndex]] = _userIndex;
        }
        userToLockups[_userAddress].length--;
        // delete the lockup index from the user
        delete(userToLockupIndex[_userAddress][_lockupName]);
        emit RemoveLockUpFromUser(_userAddress, _lockupName);
    }

    function _addNewLockUpToUser(
        address _userAddress,
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        require(_userAddress != address(0), "Invalid address");
        _addNewLockUpType(
            _lockupAmount,
            _startTime,
            _lockUpPeriodSeconds,
            _releaseFrequencySeconds,
            _lockupName
        );
        _addLockUpByName(_userAddress, _lockupName);
    }

    function _addLockUpByName(
        address _userAddress,
        bytes32 _lockupName
    )
        internal
    {
        require(_userAddress != address(0), "Invalid address");
        require(lockups[_lockupName].startTime >= now, "Lockup expired");

        userToLockupIndex[_userAddress][_lockupName] = userToLockups[_userAddress].length;
        lockupToUserIndex[_lockupName][_userAddress] = lockupToUsers[_lockupName].length;
        userToLockups[_userAddress].push(_lockupName);
        lockupToUsers[_lockupName].push(_userAddress);
        emit AddLockUpToUser(_userAddress, _lockupName);
    }

    function _addNewLockUpType(
        uint256 _lockupAmount,
        uint256 _startTime,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds,
        bytes32 _lockupName
    )
        internal
    {
        uint256 startTime = _startTime;
        require(_lockupName != bytes32(0), "Invalid name");
        require(lockups[_lockupName].lockupAmount == 0, "Already exist");
        /*solium-disable-next-line security/no-block-members*/
        if (_startTime == 0) {
            startTime = now;
        }
        require(startTime >= now, "Invalid start time");
        _checkLockUpParams(_lockupAmount, _lockUpPeriodSeconds, _releaseFrequencySeconds);
        lockups[_lockupName] = LockUp(_lockupAmount, startTime, _lockUpPeriodSeconds, _releaseFrequencySeconds);
        lockupArray.push(_lockupName);
        emit AddNewLockUpType(_lockupName, _lockupAmount, startTime, _lockUpPeriodSeconds, _releaseFrequencySeconds);
    }

    /**
     * @notice Parameter checking function for creating or editing a lockup.
     *  This function will cause an exception if any of the parameters are bad.
     * @param _lockupAmount Amount that needs to be locked
     * @param _lockUpPeriodSeconds Total period of lockup (seconds)
     * @param _releaseFrequencySeconds How often to release a tranche of tokens (seconds)
     */
    function _checkLockUpParams(
        uint256 _lockupAmount,
        uint256 _lockUpPeriodSeconds,
        uint256 _releaseFrequencySeconds
    )
        internal
        pure
    {
        require(_lockUpPeriodSeconds != 0, "lockUpPeriodSeconds cannot be zero");
        require(_releaseFrequencySeconds != 0, "releaseFrequencySeconds cannot be zero");
        require(_lockupAmount != 0, "lockupAmount cannot be zero");
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Returns the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}

// File: contracts/modules/Experimental/TransferManager/LockUpTransferManagerFactory.sol

/**
 * @title Factory for deploying LockUpTransferManager module
 */
contract LockUpTransferManagerFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _polymathRegistry
    )
        public
        ModuleFactory(_setupCost, _usageCost, _polymathRegistry)
    {
        version = "1.0.0";
        name = "LockUpTransferManager";
        title = "LockUp Transfer Manager";
        description = "Manage transfers using lock ups over time";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address lockUpTransferManager = address(new LockUpTransferManager(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(lockUpTransferManager, _data);
        return lockUpTransferManager;
    }

    /**
     * @notice Type of the Module factory
     * @return uint8
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 2;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "LockUp";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
