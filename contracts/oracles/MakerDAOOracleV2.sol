pragma solidity 0.5.8;

import "../interfaces/IOracle.sol";
import "../external/IMedianizer.sol";
import "../interfaces/IPolymathRegistry.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interfaces/IModule.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/ISecurityTokenRegistry.sol";

contract MakerDAOOracleV2 is IOracle, Ownable {
    IMedianizer public medianizer;
    address public currencyAddress;
    IPolymathRegistry polymathRegistry;
    ISecurityTokenRegistry securityTokenRegistry;
    bytes32 public currencySymbol;

    bool public manualOverride;
    uint256 public manualPrice;

    /*solium-disable-next-line security/no-block-members*/
    event ChangeMedianizer(address _newMedianizer, address _oldMedianizer);
    event SetManualPrice(uint256 _oldPrice, uint256 _newPrice);
    event SetManualOverride(bool _override);

    /**
      * @notice Creates a new Maker based oracle
      * @param _medianizer Address of Maker medianizer
      * @param _currencyAddress Address of currency (0x0 for ETH)
      * @param _currencySymbol Symbol of currency
      * @param _polymathRegistry Address of the Polymath Registry
      */
    constructor(address _medianizer, address _currencyAddress, bytes32 _currencySymbol, address _polymathRegistry) public {
        medianizer = IMedianizer(_medianizer);
        currencyAddress = _currencyAddress;
        currencySymbol = _currencySymbol;
        polymathRegistry = IPolymathRegistry(_polymathRegistry);
        securityTokenRegistry = ISecurityTokenRegistry(polymathRegistry.getAddress("SecurityTokenRegistry"));
    }

    /**
      * @notice Updates medianizer address
      * @param _medianizer Address of Maker medianizer
      */
    function changeMedianizer(address _medianizer) public onlyOwner {
        require(_medianizer != address(0), "0x not allowed");
        /*solium-disable-next-line security/no-block-members*/
        emit ChangeMedianizer(_medianizer, address(medianizer));
        medianizer = IMedianizer(_medianizer);
    }

    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address) {
        return currencyAddress;
    }

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32) {
        return currencySymbol;
    }

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32) {
        // All MakerDAO oracles are denominated in USD
        return bytes32("USD");
    }

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external returns(uint256) {
        if (manualOverride) {
            return manualPrice;
        }
        _checkCallerAllowed(msg.sender);
        (bytes32 price, bool valid) = medianizer.peek();
        require(valid, "MakerDAO Oracle returning invalid value");
        return uint256(price);
    }

    // This function allows following contracts to read data from the oracles
    // - STR Address
    // - Any valid module of polymath ecosystem
    function _checkCallerAllowed(address _caller) view internal {
        if (_caller != address(securityTokenRegistry)) {
            address _securityToken = IModule(_caller).securityToken();
            // Validate the securityToken address
            // securityToken should be a part of the Polymath ecosystem
            require(_securityToken != address(0), "Invalid address");
            require(securityTokenRegistry.isSecurityToken(_securityToken), "Invalid securityToken");
            // Validate the module address
            // module address should be a valid and active module of the securityToken
            address moduleAddress;
            bool isArchived;
            (,moduleAddress,,isArchived,,) = ISecurityToken(_securityToken).getModule(_caller);
            require(moduleAddress == _caller && !isArchived, "Invalid msg.sender");
        }
    }

    /**
      * @notice Set a manual price. NA - this will only be used if manualOverride == true
      * @param _price Price to set
      */
    function setManualPrice(uint256 _price) public onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        emit SetManualPrice(manualPrice, _price);
        manualPrice = _price;
    }

    /**
      * @notice Determine whether manual price is used or not
      * @param _override Whether to use the manual override price or not
      */
    function setManualOverride(bool _override) public onlyOwner {
        manualOverride = _override;
        /*solium-disable-next-line security/no-block-members*/
        emit SetManualOverride(_override);
    }

}
