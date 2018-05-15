pragma solidity ^0.4.23;

import "../../interfaces/IModule.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract ISTO is IModule {

    enum FundraiseType { ETH, POLY }
    FundraiseType public fundraiseType;

    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) public view returns(bool) {
        return polyToken.allowance(_beneficiary, address(this)) >= _fundsAmount;
    }

    function getRaisedEther() public view returns (uint256);

    function getRaisedPOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    function _check(uint8 _fundraiseType) internal {
        require(_fundraiseType == 0 || _fundraiseType == 1, "Not a valid fundraise type");
        if (_fundraiseType == 0) {
            fundraiseType = FundraiseType.ETH;
        }
        if (_fundraiseType == 1) {
            require(address(polyToken) != address(0), "Address of the polyToken should not be 0x");
            fundraiseType = FundraiseType.POLY;
        }
    }

    function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal {
        polyToken.transferFrom(_beneficiary, _to, _fundsAmount);
    }

}
