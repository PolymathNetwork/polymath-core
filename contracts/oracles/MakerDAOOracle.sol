pragma solidity 0.5.8;

import "../interfaces/IOracle.sol";
import "../external/IMedianizer.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MakerDAOOracle is IOracle, Ownable {
    IMedianizer public medianizer;
    address public currencyAddress;
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
      */
    constructor(address _medianizer, address _currencyAddress, bytes32 _currencySymbol) public {
        medianizer = IMedianizer(_medianizer);
        currencyAddress = _currencyAddress;
        currencySymbol = _currencySymbol;
    }

    /**
      * @notice Updates medianizer address
      * @param _medianizer Address of Maker medianizer
      */
    function changeMedianier(address _medianizer) public onlyOwner {
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
        (bytes32 price, bool valid) = medianizer.peek();
        require(valid, "MakerDAO Oracle returning invalid value");
        return uint256(price);
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
