pragma solidity ^0.4.18;

contract Util {

   /**
    * @dev changes a string to lower case
    * @param _base string to change
    */
    function lower(string _base) internal pure returns (string) {
      bytes memory _baseBytes = bytes(_base);
      for (uint i = 0; i < _baseBytes.length; i++) {
       bytes1 b1 = _baseBytes[i];
       if (b1 >= 0x41 && b1 <= 0x5A) {
         b1 = bytes1(uint8(b1)+32);
       }
       _baseBytes[i] = b1;
      }
      return string(_baseBytes);
    }

}