pragma solidity ^0.4.24;

import '../interfaces/IOracle.sol';
import '../external/Medianizer.sol';
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MakerDAOOracle is IOracle, Ownable {

    address public makerDAO = 0x729D19f657BD0614b4985Cf1D82531c67569197B;

    bool public manualOverride;

    uint256 public manualPrice;

    event LogChangeMakerDAO(address _newMakerDAO, address _oldMakerDAO, uint256 _now);
    event LogSetManualPrice(uint256 _oldPrice, uint256 _newPrice, uint256 _time);
    event LogSetManualOverride(bool _override, uint256 _time);

    function changeMakerDAO(address _makerDAO) public onlyOwner {
        emit LogChangeMakerDAO(_makerDAO, makerDAO, now);
        makerDAO = _makerDAO;
    }

    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address) {
        return address(0);
    }

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32) {
        return bytes32("ETH");
    }

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32) {
        return bytes32("USD");
    }

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external view returns(uint256) {
        if (manualOverride) {
            return manualPrice;
        }
        (bytes32 price, bool valid) = Medianizer(makerDAO).peek();
        require(valid, "MakerDAO Oracle returning invalid value");
        return uint256(price);
    }

    /**
      * @notice Set a manual price. NA - this will only be used if manualOverride == true
      * @param _price Price to set
      */
    function setManualPrice(uint256 _price) public onlyOwner {
        emit LogSetManualPrice(manualPrice, _price, now);
        manualPrice = _price;
    }

    /**
      * @notice Determine whether manual price is used or not
      * @param _override Whether to use the manual override price or not
      */
    function setManualOverride(bool _override) public onlyOwner {
        manualOverride = _override;
        emit LogSetManualOverride(_override, now);
    }

}
