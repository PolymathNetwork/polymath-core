pragma solidity ^0.4.24;

/**
 * @title Helper library use to compare or validate the semantic versions
 */

library VersionUtils {

    /**
     * @notice This function is used to validate the version submitted
     * @param _current Array holds the present version of ST
     * @param _new Array holds the latest version of the ST
     * @return bool
     */
    function isValidVersion(uint8[] _current, uint8[] _new) internal pure returns(bool) {
        bool[] memory _temp = new bool[](_current.length);
        uint8 counter = 0;
        for (uint8 i = 0; i < _current.length; i++) {
            if (_current[i] < _new[i])
                _temp[i] = true;
            else
                _temp[i] = false;
        }

        for (i = 0; i < _current.length; i++) {
            if (i == 0) {
                if (_current[i] <= _new[i])
                    if(_temp[0]) {
                        counter = counter + 3;
                        break;
                    } else
                        counter++;
                else
                    return false;
            } else {
                if (_temp[i-1])
                    counter++;
                else if (_current[i] <= _new[i])
                    counter++;
                else
                    return false;
            }
        }
        if (counter == _current.length)
            return true;
    }

    /**
     * @notice This function use to compare the lower bound with the latest version
     * @param _version1 Array holds the lower bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareLowerBound(uint8[] _version1, uint8[] _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length);
        uint counter = 0;
        for (uint8 j = 0; j< _version1.length; j++) {
            if (_version1[j] == 0)
                counter ++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                    if (_version2[i] > _version1[i])
                        return true;
                    else if (_version2[i] < _version1[i])
                        return false;
                    else
                        counter++;
            }
            if (counter == _version1.length - 1)
                return true;
            else
                return false;
        } else
            return true;
    }

    /**
     * @notice This function use to compare the upper bound with the latest version
     * @param _version1 Array holds the upper bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareUpperBound(uint8[] _version1, uint8[] _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length);
        uint counter = 0;
        for (uint8 j = 0; j< _version1.length; j++) {
            if (_version1[j] == 0)
                counter ++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                    if (_version1[i] > _version2[i])
                        return true;
                    else if (_version1[i] < _version2[i])
                        return false;
                    else
                        counter++;
            }
            if (counter == _version1.length - 1)
                return true;
            else
                return false;
        } else
            return true;
    }


    /**
     * @notice Use to pack the uint8[] array data into uint24 value
     * @param _major Major version
     * @param _minor Minor version
     * @param _patch Patch version
     */
    function pack(uint8 _major, uint8 _minor, uint8 _patch) internal pure returns(uint24) {
        return (uint24(_major) << 16) | (uint24(_minor) << 8) | uint24(_patch);
    }

    /**
     * @notice Use to convert packed data into uint8 array
     * @param _packedVersion Packed data
     */
    function unpack(uint24 _packedVersion) internal pure returns (uint8[]) {
        uint8[] memory _unpackVersion = new uint8[](3);
        _unpackVersion[0] = uint8(_packedVersion >> 16);
        _unpackVersion[1] = uint8(_packedVersion >> 8);
        _unpackVersion[2] = uint8(_packedVersion);
        return _unpackVersion;
    }


}
