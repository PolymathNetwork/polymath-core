pragma solidity ^0.4.24;

/**
 * @title Utility contract for reusable code
 */
contract Util {

   /**
    * @notice changes a string to upper case
    * @param _base string to change
    */
    function upper(string _base) internal pure returns (string) {
        bytes memory _baseBytes = bytes(_base);
        for (uint i = 0; i < _baseBytes.length; i++) {
            bytes1 b1 = _baseBytes[i];
            if (b1 >= 0x61 && b1 <= 0x7A) {
                b1 = bytes1(uint8(b1)-32);
            }
            _baseBytes[i] = b1;
        }
        return string(_baseBytes);
    }

    /**
     * @notice changes the string into bytes32
     * @param _source String that need to convert into bytes32
     */
    /// Notice - Maximum length for _source will be 32 chars otherwise returned bytes32 value will have lossy value. 
    function stringToBytes32(string memory _source) public pure returns (bytes32 result) {
        bytes memory tempString = bytes(_source);
        if (tempString.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(_source, 32))
        }
    }

    /**
     * @notice Changes the bytes32 into string 
     * @param _source that need to convert into string
     */
    function bytes32ToString(bytes32 _source) public pure returns (string result) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(_source) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }


}
