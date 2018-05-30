pragma solidity ^0.4.23;

import "./ExchangeTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract ExchangeTransferManagerFactory is IModuleFactory {

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
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        ExchangeTransferManager exchangeTransferManager = new ExchangeTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == exchangeTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(exchangeTransferManager).call(_data), "Un-successfull call");
        return address(exchangeTransferManager);

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
        return "ExchangeTransferManager";
    }

    /**
     * @dev Get the description of the Module 
     */
    function getDescription() public view returns(string) {
        return "Manage transfers within an exchange";
    }

    /**
     * @dev Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "Exchange Transfer Manager";
    }

    /**
     * @dev Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an exchange to whitelist users for depositing / withdrawing from an exchange address. Init function takes exchange address as a parameter and users are added via modifyWhitelist.";
    }

    /**
     * @dev Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Exchange"; 
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
