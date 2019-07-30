pragma solidity 0.5.8;

import "../interfaces/IOracle.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract StableOracle is IOracle, Ownable {
    using SafeMath for uint256;

    IOracle public oracle;
    uint256 public lastPrice;
    uint256 public evictPercentage; //% multiplid by 10**16

    bool public manualOverride;
    uint256 public manualPrice;

    /*solium-disable-next-line security/no-block-members*/
    event ChangeOracle(address _oldOracle, address _newOracle);
    event ChangeEvictPercentage(uint256 _oldEvictPercentage, uint256 _newEvictPercentage);
    event SetManualPrice(uint256 _oldPrice, uint256 _newPrice);
    event SetManualOverride(bool _override);

    /**
      * @notice Creates a new stable oracle based on existing oracle
      * @param _oracle address of underlying oracle
      */
    constructor(address _oracle, uint256 _evictPercentage) public {
        require(_oracle != address(0), "Invalid oracle");
        oracle = IOracle(_oracle);
        evictPercentage = _evictPercentage;
    }

    /**
      * @notice Updates medianizer address
      * @param _oracle Address of underlying oracle
      */
    function changeOracle(address _oracle) public onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        /*solium-disable-next-line security/no-block-members*/
        emit ChangeOracle(address(oracle), _oracle);
        oracle = IOracle(_oracle);
    }

    /**
      * @notice Updates eviction percentage
      * @param _evictPercentage Percentage multiplied by 10**16
      */
    function changeEvictPercentage(uint256 _evictPercentage) public onlyOwner {
        emit ChangeEvictPercentage(evictPercentage, _evictPercentage);
        evictPercentage = _evictPercentage;
    }

    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address) {
        return oracle.getCurrencyAddress();
    }

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32) {
        return oracle.getCurrencySymbol();
    }

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32) {
        return oracle.getCurrencyDenominated();
    }

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external returns(uint256) {
        if (manualOverride) {
            return manualPrice;
        }
        uint256 currentPrice = oracle.getPrice();
        if ((lastPrice == 0) || (_change(currentPrice, lastPrice) >= evictPercentage)) {
            lastPrice = currentPrice;
        }
        return lastPrice;
    }

    function _change(uint256 _newPrice, uint256 _oldPrice) internal pure returns(uint256) {
        uint256 diff = _newPrice > _oldPrice ? _newPrice.sub(_oldPrice) : _oldPrice.sub(_newPrice);
        return diff.mul(10**18).div(_oldPrice);
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
