pragma solidity ^0.4.18;

interface IRegulatorService {

    function verify(uint8 toStatus, uint8 fromStatus) external; 

}