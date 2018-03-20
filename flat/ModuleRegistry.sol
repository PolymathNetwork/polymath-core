pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external view returns(bool);

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external view returns(uint256);

    function registerModule(address _moduleFactory) external returns(bool);

}

//Simple interface that any module contracts should implement
contract IModuleFactory {

    //TODO: Add delegates to this
    //Should create an instance of the Module, or throw
    function deploy(address _owner, bytes _data) external returns(address);

    function getType() view external returns(uint8);

    function getName() view external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() view external returns(uint256);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint l = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < l; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
        }
    }

}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

//Store registered modules
//Could initially be centrally controlled (only Polymath can register modules)
//and then over time move to a more decentralised version (modules can be registerd provided POLY holders agree)
contract ModuleRegistry is IModuleRegistry, Ownable {

    struct ModuleReputation {
        uint8 score;
    }

    struct ModuleData {
        uint8 moduleType;
        bytes32 name;
        uint256 cost;
    }

    mapping (address => ModuleData) public registry;
    mapping (address => ModuleReputation) public reputation;

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external view returns(bool) {
        return (registry[_moduleFactory].moduleType != 0);
    }

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external view returns(uint256) {
        return registry[_moduleFactory].cost;
    }

    function registerModule(address _moduleFactory) external onlyOwner returns(bool) {
        require(registry[_moduleFactory].moduleType == 0);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(moduleFactory.getType() != 0);
        registry[_moduleFactory] = ModuleData(moduleFactory.getType(), moduleFactory.getName(), moduleFactory.getCost());
        return true;
    }
}