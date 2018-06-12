pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "./IPausable.sol";

contract IRegistry is Ownable, IPausable {

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;

    // Polymath contract addresses
    address public POLY_Address;
    address public TR_Address;
    address public STR_Address;
    address public MR_Address;

    event LogChangePolyRegisterationFee(uint256 _oldFee, uint256 _newFee);
    event LogChangeRegistryAddress(string _registryName, address indexed _oldAddress, address indexed _newAddress);

    /**
    * @dev Reclaim all ERC20Basic compatible tokens
    * @param _tokenContract The address of the token contract
    */
    function reclaimERC20(address _tokenContract) external onlyOwner {
        require(_tokenContract != address(0));
        ERC20Basic token = ERC20Basic(_tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance));
    }

    /**
     * @dev set the ticker registration fee in POLY tokens
     * @param _registrationFee registration fee in POLY tokens (base 18 decimals)
     */
    function changePolyRegisterationFee(uint256 _registrationFee) public onlyOwner {
        require(registrationFee != _registrationFee);
        emit LogChangePolyRegisterationFee(registrationFee, _registrationFee);
        registrationFee = _registrationFee;
    }

    /**
     * @dev set the Ticker Registry contract address, needs to be called by each inheritees
     * @param _newAddress is address of new contract
     */
    function changeTickerRegistryAddress(address _newAddress) public onlyOwner {
        require(_newAddress != TR_Address && _newAddress != address(0));
        emit LogChangeRegistryAddress('TickerRegistry', TR_Address, _newAddress);
        TR_Address = _newAddress;
    }

    /**
     * @dev set the Security Token Registry contract address, needs to be called by each inheritees
     * @param _newAddress is address of new contract
     */
    function changeSecurityTokenRegistryAddress(address _newAddress) public onlyOwner {
        require(_newAddress != STR_Address && _newAddress != address(0));
        emit LogChangeRegistryAddress('SecurityTokenRegistry', STR_Address, _newAddress);
        STR_Address = _newAddress;
    }

    /**
     * @dev set the Module Registry contract address, needs to be called by each inheritees
     * @param _newAddress is address of new contract
     */
    function changeModuleRegistryAddress(address _newAddress) public onlyOwner {
        require(_newAddress != MR_Address && _newAddress != address(0));
        emit LogChangeRegistryAddress('ModuleRegistry', MR_Address, _newAddress);
        MR_Address = _newAddress;
    }

    /**
     * @dev pause (overridden function)
     */
    function unpause() public onlyOwner  {
        super._unpause();
    }

    /**
     * @dev unpause (overridden function)
     */
    function pause() public onlyOwner {
        super._pause();
    }

}
