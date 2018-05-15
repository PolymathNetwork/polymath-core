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

}
