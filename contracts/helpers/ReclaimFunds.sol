pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";

contract ReclaimFunds is Ownable {

    /**
    * @dev Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        ERC20Basic token = ERC20Basic(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }

    /**
    * @dev Reclaim all ETH stored in contract
    */
    function reclaimETH() external onlyOwner {
        uint256 balance = address(this).balance;
        owner.transfer(balance);
    }

    function() public payable {}

}
