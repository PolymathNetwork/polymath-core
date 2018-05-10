pragma solidity ^0.4.23;

import "./CountTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract CountTransferManagerFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        CountTransferManager countTransferManager = new CountTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == countTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(countTransferManager).call(_data), "Un-successfull call");
        return address(countTransferManager);

    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 2;
    }

    function getName() public view returns(bytes32) {
        return "CountTransferManager";
    }

    function getDescription() public view returns(string) {
        return "Restrict the number of investors";
    }

    function getTitle() public view returns(string) {
        return "Count Transfer Manager";
    }

    function getInstructions() public view returns(string) {
        return "Allows an issuer to restrict the total number of non-zero token holders";
    }

    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Count";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }
}
