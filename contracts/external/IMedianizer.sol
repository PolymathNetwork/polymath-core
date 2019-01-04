/* solium-disable */
pragma solidity ^0.4.24;

/**
 * @title Interface to MakerDAO Medianizer contract
 */

interface IMedianizer {

    function peek() constant external returns (bytes32, bool);

    function read() constant external returns (bytes32);

    function set(address wat) external;

    function set(bytes12 pos, address wat) external;

    function setMin(uint96 min_) external;

    function setNext(bytes12 next_) external;

    function unset(bytes12 pos) external;

    function unset(address wat) external;

    function poke() external;

    function poke(bytes32) external;

    function compute() constant external returns (bytes32, bool);

    function void() external;

}
