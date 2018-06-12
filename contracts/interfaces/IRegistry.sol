pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";

contract IRegistry is Ownable {

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;

    event LogChangePolyRegisterationFee(uint256 _oldFee, uint256 _newFee);

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
     * @dev set the ticker registration fee in POLY tokens
     * @param _registrationFee registration fee in POLY tokens (base 18 decimals)
     */
    function changePolyRegisterationFee(uint256 _registrationFee) public onlyOwner {
        emit LogChangePolyRegisterationFee(registrationFee, _registrationFee);
        registrationFee = _registrationFee;
    }

}
