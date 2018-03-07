pragma solidity ^0.4.18;

import './interfaces/ITransferManager.sol';

contract SimpleTransferManager is ITransferManager {

    mapping (address => bool) public whitelist;

    address public admin;

    modifier onlyAdmin {
      require(msg.sender == admin);
      _;
    }

    function SimpleTransferManager() public {
      admin = msg.sender;
    }

    function verifyTransfer(address _to, address _from) external returns(bool) {
        return (whitelist[_to] && whitelist[_from]);
    }

    function modifyWhitelist(address _investor, bool _valid) public onlyAdmin {
        //TODO: emit event
        whitelist[_investor] = _valid;
    }

}
