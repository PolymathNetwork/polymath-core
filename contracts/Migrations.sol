pragma solidity ^0.4.24;


contract Migrations {

    address public owner;

    uint public lastCompletedMigration;

    modifier restricted() {
        require(msg.sender == owner);
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function setCompleted(uint _completed)public  restricted {
        lastCompletedMigration = _completed;
    }

    function upgrade(address _newAddress)public  restricted {
        Migrations upgraded = Migrations(_newAddress);
        upgraded.setCompleted(lastCompletedMigration);
    }
}
