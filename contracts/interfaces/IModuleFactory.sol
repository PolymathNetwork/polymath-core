pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";


//Simple interface that any module contracts should implement
contract IModuleFactory is Ownable {

    ERC20 public polyToken;

    constructor (address _polyAddress) public {
      polyToken = ERC20(_polyAddress);
    }

    //Should create an instance of the Module, or throw
    function deploy(bytes _data) external returns(address);

    function getType() public view returns(uint8);

    function getName() public view returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() public view returns(uint256);

    function getDescription() public view returns(string);

    function getTitle() public view returns(string);

    function getInstructions() public view returns (string);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < len; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (len - 1 - i))));
        }
    }

}
