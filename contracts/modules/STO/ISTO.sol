pragma solidity ^0.4.18;

import '../../interfaces/IModule.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract ISTO is IModule {

    bytes8 constant TOKEN = "POLY";
    bool public toggle = false;
    address polyAddress;

    function _check(bytes8 _config, address _polyToken) internal {
        require(TOKEN == _config);
        require(_polyToken != address(0));
        toggle = true;
        polyAddress = _polyToken;
    }
    
    function _forwardPoly(address _beneficiary, address _to, uint256 _cryptoAmount) internal {
        ERC20(polyAddress).transferFrom(_beneficiary, _to, _cryptoAmount);
    }

    function verifyInvestment(address _beneficiary, uint256 _cryptoAmount) view public returns(bool) {
        return ERC20(polyAddress).allowance(this, _beneficiary) >= _cryptoAmount;
    }

    function getRaiseEther() public view returns (uint256);

    function getRaisePOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

}
