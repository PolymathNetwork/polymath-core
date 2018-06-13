pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "./IPausable.sol";

contract IRegistry is Ownable, IPausable {

    /*
    Valid Address Keys
        TR_Address -> getAddress("TR_Address")
        STR_Address -> getAddress("STR_Address")
        MR_Address -> getAddress("MR_Address")
        POLY_Address -> getAddress("POLY_Address")
        */

    // Registration fee in POLY base 18 decimals
    uint256 public registrationFee;

    mapping (bytes32 => address) public storedAddresses;
    mapping (bytes32 => bool) public validAddressKeys;

    event LogChangePolyRegisterationFee(uint256 _oldFee, uint256 _newFee);
    event LogChangeAddress(string _nameKey, address indexed _oldAddress, address indexed _newAddress);

    /**
     * @dev get the contract address
     * @param _nameKey is the key for the contract address mapping
     */
    function getAddress(string _nameKey) public returns(address) {
        require(validAddressKeys[keccak256(_nameKey)]);
        return storedAddresses[keccak256(_nameKey)];
    }

    /**
     * @dev set the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function setAddress(string _nameKey, address _newAddress) public onlyOwner {
        require(!validAddressKeys[keccak256(_nameKey)] && storedAddresses[keccak256(_nameKey)] == address(0));
        validAddressKeys[keccak256(_nameKey)] = true;
        storedAddresses[keccak256(_nameKey)] = _newAddress;
        emit LogChangeAddress(_nameKey, address(0), _newAddress);
    }

    /**
     * @dev change the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string _nameKey, address _newAddress) public onlyOwner {
        address oldAddress = getAddress(_nameKey);
        storedAddresses[keccak256(_nameKey)] = _newAddress;
        emit LogChangeAddress(_nameKey, oldAddress, _newAddress);
    }

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
