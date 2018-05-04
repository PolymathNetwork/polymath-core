pragma solidity ^0.4.23;

import "./GeneralTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract GeneralTransferManagerFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes /* _data */) external returns(address) {
        if (getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new GeneralTransferManager(msg.sender, address(polyToken)));
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 2;
    }

    function getName() public view returns(bytes32) {
        return "GeneralTransferManager";
    }

    function getDescription() public view returns(string) {
        return "Manage transfers using a time based whitelist";
    }

    function getTitle() public view returns(string) {
        return "General Transfer Manager";
    }

    function getInstructions() public view returns(string) {
        return "Allows an issuer to maintain a time based whitelist of authorised token holders.Addresses are added via modifyWhitelist, and take a fromTime (the time from which they can send tokens) and a toTime (the time from which they can receive tokens). There are additional flags, allowAllWhitelistIssuances, allowAllWhitelistTransfers & allowAllTransfers which allow you to set corresponding contract level behaviour. Init function takes no parameters.";
    }

    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "General";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
