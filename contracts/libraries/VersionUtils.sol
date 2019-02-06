pragma solidity ^0.5.0;

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
    function isValidVersion(uint8[] memory _current, uint8[] memory _new) internal pure returns(bool) {
        bool[] memory _temp = new bool[](_current.length);
        uint8 counter = 0;
        uint8 i = 0;
        for (i = 0; i < _current.length; i++) {
            if (_current[i] < _new[i]) _temp[i] = true;
            else _temp[i] = false;
        }

        for (i = 0; i < _current.length; i++) {
            if (i == 0) {
                if (_current[i] <= _new[i]) if (_temp[0]) {
                    counter = counter + 3;
                    break;
                } else counter++;
                else return false;
            } else {
                if (_temp[i - 1]) counter++;
                else if (_current[i] <= _new[i]) counter++;
                else return false;
            }
        }
        if (counter == _current.length) return true;
    }

    /**
     * @notice Used to compare the lower bound with the latest version
     * @param _version1 Array holds the lower bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareLowerBound(uint8[] memory _version1, uint8[] memory _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length, "Input length mismatch");
        uint counter = 0;
        for (uint8 j = 0; j < _version1.length; j++) {
            if (_version1[j] == 0) counter++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                if (_version2[i] > _version1[i]) return true;
                else if (_version2[i] < _version1[i]) return false;
                else counter++;
            }
            if (counter == _version1.length - 1) return true;
            else return false;
        } else return true;
    }

    /**
     * @notice Used to compare the upper bound with the latest version
     * @param _version1 Array holds the upper bound of the version
     * @param _version2 Array holds the latest version of the ST
     * @return bool
     */
    function compareUpperBound(uint8[] memory _version1, uint8[] memory _version2) internal pure returns(bool) {
        require(_version1.length == _version2.length, "Input length mismatch");
        uint counter = 0;
        for (uint8 j = 0; j < _version1.length; j++) {
            if (_version1[j] == 0) counter++;
        }
        if (counter != _version1.length) {
            counter = 0;
            for (uint8 i = 0; i < _version1.length; i++) {
                if (_version1[i] > _version2[i]) return true;
                else if (_version1[i] < _version2[i]) return false;
                else counter++;
            }
            if (counter == _version1.length - 1) return true;
            else return false;
        } else return true;
    }

    /**
     * @notice Used to pack the uint8[] array data into uint24 value
     * @param _major Major version
     * @param _minor Minor version
     * @param _patch Patch version
     */
    function pack(uint8 _major, uint8 _minor, uint8 _patch) internal pure returns(uint24) {
        return (uint24(_major) << 16) | (uint24(_minor) << 8) | uint24(_patch);
    }

    /**
     * @notice Used to convert packed data into uint8 array
     * @param _packedVersion Packed data
     */
    function unpack(uint24 _packedVersion) internal pure returns(uint8[] memory) {
        uint8[] memory _unpackVersion = new uint8[](3);
        _unpackVersion[0] = uint8(_packedVersion >> 16);
        _unpackVersion[1] = uint8(_packedVersion >> 8);
        _unpackVersion[2] = uint8(_packedVersion);
        return _unpackVersion;
    }


    /**
     * @notice Used to packed the KYC data
     */
    function packKYC(uint64 _a, uint64 _b, uint64 _c, uint8 _d, uint8 _e, uint8 _f) internal pure returns(uint256) {
        return (uint256(_a) << 152) | (uint256(_b) << 88) | (uint256(_c) << 24) | (uint256(_d) << 16) | (uint256(_e) << 8) | uint256(_f);
    }

    /**
     * @notice Used to convert packed data into KYC data
     * @param _packedVersion Packed data
     */
    function unpackKYC(uint256 _packedVersion) internal pure returns(uint64 fromTime, uint64 toTime, uint64 expiryTime, uint8 canBuy, uint8 added, uint8 accredited) {
        fromTime = uint64(_packedVersion >> 152);
        toTime = uint64(_packedVersion >> 88);
        expiryTime = uint64(_packedVersion >> 24);
        canBuy = uint8(_packedVersion >> 16);
        added = uint8(_packedVersion >> 8);
        accredited = uint8(_packedVersion);
    }

}
