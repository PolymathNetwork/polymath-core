pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./PolymathRegistry.sol";

contract RegistryUpdater is Ownable {
    address public polymathRegistry;
    address public moduleRegistry;
    address public securityTokenRegistry;
    address public featureRegistry;
    address public polyToken;

    constructor(address _polymathRegistry) public {
        require(_polymathRegistry != address(0), "Invalid address");
        polymathRegistry = _polymathRegistry;
    }

    function updateFromRegistry() public onlyOwner {
        moduleRegistry = PolymathRegistry(polymathRegistry).getAddress("ModuleRegistry");
        securityTokenRegistry = PolymathRegistry(polymathRegistry).getAddress("SecurityTokenRegistry");
        featureRegistry = PolymathRegistry(polymathRegistry).getAddress("FeatureRegistry");
        polyToken = PolymathRegistry(polymathRegistry).getAddress("PolyToken");
    }

}
