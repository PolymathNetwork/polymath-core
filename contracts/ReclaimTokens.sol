pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IERC20.sol";

/**
 * @title Utility contract to allow owner to retreive any ERC20 sent to the contract
 */
contract ReclaimTokens is Ownable {

    /**
    * @notice Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance));
    }
}
