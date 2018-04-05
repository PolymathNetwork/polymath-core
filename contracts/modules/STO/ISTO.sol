pragma solidity ^0.4.21;

import "../../interfaces/IModule.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract ISTO is IModule {

    enum FundraiseType { ETH, POLY }
    FundraiseType public fundraiseType;

    address public polyAddress;

    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) public view returns(bool) {
        return ERC20(polyAddress).allowance(_beneficiary, address(this)) >= _fundsAmount;
    }

    function getRaisedEther() public view returns (uint256);

    function getRaisedPOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    function _check(uint8 _fundraiseType, address _polyToken) internal {
        require(_fundraiseType == 0 || _fundraiseType == 1);
        if (_fundraiseType == 0) {
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

}
