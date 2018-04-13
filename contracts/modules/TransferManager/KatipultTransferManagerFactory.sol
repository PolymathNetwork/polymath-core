pragma solidity ^0.4.21;

import "./KatipultTransferManager.sol";
import "../../interfaces/IModuleFactory.sol";


contract KatipultTransferManagerFactory is IModuleFactory {

    address public katipultKYCAddress;

    function KatipultTransferManagerFactory(address _polyAddress, address _katipultKYCAddress) public
      IModuleFactory(_polyAddress)
    {
        katipultKYCAddress = _katipultKYCAddress;
    }

    function deploy(bytes /* _data */) external returns(address) {
        require(polyToken.transferFrom(msg.sender, owner, getCost()));
        return address(new KatipultTransferManager(msg.sender, address(polyToken), katipultKYCAddress));
    }

    function getCost() public view returns(uint256) {
        return 100;
    }

    function getType() public view returns(uint8) {
        return 2;
    }

    function getName() public view returns(bytes32) {
        return "KatipultTransferManager";
    }

    function getDescription() public view returns(string) {
        return "Katiput Transfer Manager";
    }

    function getTitle() public view returns(string) {
        return "Katiput Transfer Manager";
    }

    function getInstructions() public view returns(string) {
        return "Allows Katipult to manage KYC on behalf of an issuer.";
    }


}
