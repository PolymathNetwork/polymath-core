pragma solidity 0.5.8;

/**
 * @title Contract used to store layout for the CappedSTO storage
 */
contract CappedSTOStorage {

    // Determine whether users can invest on behalf of a beneficiary
    bool public allowBeneficialInvestments = false;
    // How many token units a buyer gets (multiplied by 10^18) per wei / base unit of POLY
    // If rate is 10^18, buyer will get 1 token unit for every wei / base unit of poly.
    uint256 public rate;
    //How many token base units this STO will be allowed to sell to investors
    // 1 full token = 10^decimals_of_token base units
    uint256 public cap;

    mapping (address => uint256) public investors;

}
