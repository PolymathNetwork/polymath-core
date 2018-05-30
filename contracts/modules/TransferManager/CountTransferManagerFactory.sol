pragma solidity ^0.4.23;

import "./CountTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract CountTransferManagerFactory is IModuleFactory {

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
        CountTransferManager countTransferManager = new CountTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == countTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(countTransferManager).call(_data), "Un-successfull call");
        return address(countTransferManager);

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
        return "CountTransferManager";
    }

    /**
     * @dev Get the description of the Module 
     */
    function getDescription() public view returns(string) {
        return "Restrict the number of investors";
    }

    /**
     * @dev Get the title of the Module
     */
    function getTitle() public view returns(string) {
        return "Count Transfer Manager";
    }

    /**
     * @dev Get the Instructions that helped to used the module
     */
    function getInstructions() public view returns(string) {
        return "Allows an issuer to restrict the total number of non-zero token holders";
    }

    /**
     * @dev Get the tags related to the module factory
     */
    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Count";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
