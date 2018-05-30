pragma solidity ^0.4.23;

import "./GeneralTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract GeneralTransferManagerFactory is IModuleFactory {

    /**
     * @dev Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

     /**
     * @dev used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes /* _data */) external returns(address) {
        if (getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        return address(new GeneralTransferManager(msg.sender, address(polyToken)));
    }


    /**
     * @dev Type of the Module factory
     */
    function getType() public view returns(uint8) {
        return 2;
    }

    /**
     * @dev Get the name of the Module
     */
    function getName() public view returns(bytes32) {
        return "GeneralTransferManager";
    }

    /**
     * @dev Get the description of the Module 
     */
    function getDescription() public view returns(string) {
        return "Manage transfers using a time based whitelist";
    }

    /**
     * @dev Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "General Transfer Manager";
    }

    /**
     * @dev Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to maintain a time based whitelist of authorised token holders.Addresses are added via modifyWhitelist, and take a fromTime (the time from which they can send tokens) and a toTime (the time from which they can receive tokens). There are additional flags, allowAllWhitelistIssuances, allowAllWhitelistTransfers & allowAllTransfers which allow you to set corresponding contract level behaviour. Init function takes no parameters.";
    }

    /**
     * @dev Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "General";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }


}
