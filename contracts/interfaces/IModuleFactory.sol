pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


//Simple interface that any module contracts should implement
contract IModuleFactory is Ownable {

    ERC20 public polyToken;

    /**
     * @dev Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress) public {
      polyToken = ERC20(_polyAddress);
    }

    //Should create an instance of the Module, or throw
    function deploy(bytes _data) external returns(address);

    /**
     * @dev Type of the Module factory
     */
    function getType() public view returns(uint8);

    /**
     * @dev Get the name of the Module
     */
    function getName() public view returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() public view returns(uint256);

    /**
     * @dev Get the description of the Module 
     */
    function getDescription() public view returns(string);

    /**
     * @dev Get the title of the Module
     */
    function getTitle() public view returns(string);

    /**
     * @dev Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns (string);
    
    /**
     * @dev Get the tags related to the module factory
     */
    function getTags() public view returns (bytes32[]);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < len; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (len - 1 - i))));
        }
    }

}
