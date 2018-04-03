pragma solidity ^0.4.18;

import '../../interfaces/IModule.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract ISTO is IModule {

    enum FundraiseType { ETH, POLY }
    FundraiseType public fundraiseType;

    address public polyAddress;

    function _check(uint8 _fundraiseType, address _polyToken) internal {
        require(_fundRaiseType == 0 || _fundRaiseType == 1);
        if (_fundRaiseType == 0) {
            fundraiseType = FundraiseType.ETH;
        }
        if (_fundraiseType == 1) {
            require(_polyToken != address(0));
            fundraiseType = FundraiseType.POLY;
            polyAddress = _polyToken;
        }
    }

    function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal {
        ERC20(polyAddress).transferFrom(_beneficiary, _to, _fundsAmount);
    }

    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) view public returns(bool) {
        return ERC20(polyAddress).allowance(_beneficiary, address(this)) >= _fundsAmount;
    }

    function getRaisedEther() public view returns (uint256);

    function getRaisedPOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

}
