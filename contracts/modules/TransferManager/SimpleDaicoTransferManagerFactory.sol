pragma solidity ^0.4.23;

import "./SimpleDaicoTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract SimpleDaicoTransferManagerFactory is IModuleFactory {

    constructor (address _polyAddress) public
      IModuleFactory(_polyAddress)
    {

    }

    function deploy(bytes _data) external returns(address) {
        if(getCost() > 0)
            require(polyToken.transferFrom(msg.sender, owner, getCost()), "Failed transferFrom because of sufficent Allowance is not provided");
        SimpleDaicoTransferManager daicoTransferManager = new SimpleDaicoTransferManager(msg.sender, address(polyToken));
        require(getSig(_data) == daicoTransferManager.getInitFunction(), "Provided data is not valid");
        require(address(daicoTransferManager).call(_data), "Un-successfull call");
        return address(daicoTransferManager);

    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 2;
    }

    function getName() public view returns(bytes32) {
        return "SimpleDaicoTransferManager";
    }

    function getDescription() public view returns(string) {
        return "Rebalance token votes for DAICO module";
    }

    function getTitle() public view returns(string) {
        return "Simple Daico Transfer Manager";
    }

    function getInstructions() public view returns(string) {
        return "";
    }

    function getTags() public view returns(bytes32[]) {
         bytes32[] memory availableTags = new bytes32[](2);
        availableTags[0] = "Daico";
        availableTags[1] = "Transfer Restriction";
        return availableTags;
    }

}
