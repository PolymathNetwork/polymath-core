pragma solidity ^0.4.18;

import '../../interfaces/IModule.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract ISTO is IModule {

    enum FundraiseType { ETH, POLY }
    FundraiseType public fundraiseType;

    address public polyAddress;

    function _check(uint8 _fundraiseType, address _polyToken) internal {
        if (_fundraiseType == 1) {
            fundraiseType = FundraiseType(_fundraiseType);
            require(_polyToken != address(0));
            polyAddress = _polyToken;
        }
        else
            fundraiseType = FundraiseType(0);
    }

    function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal {
        ERC20(polyAddress).transferFrom(_beneficiary, _to, _fundsAmount);
    }

    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) view public returns(bool) {
        return ERC20(polyAddress).allowance(this, _beneficiary) >= _fundsAmount;
    }

    function getRaiseEther() public view returns (uint256);

    function getRaisePOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

}
