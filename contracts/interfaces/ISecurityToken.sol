pragma solidity ^0.4.24;

/**
 * @title Interface for all security tokens
 */
interface ISecurityToken {

    // Standard ERC20 interface
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function allowance(address _owner, address _spender) external view returns (uint256);
    function transfer(address _to, uint256 _value) external returns (bool);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
    function decreaseApproval(address _spender, uint _subtractedValue) external returns (bool);
    function increaseApproval(address _spender, uint _addedValue) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) external returns (bool success);

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     */
    function mint(address _investor, uint256 _amount) external returns (bool success);

    /**
     * @notice Burn function used to burn the securityToken
     * @param _value No. of token that get burned
     */
    function burn(uint256 _value) external returns (bool success);

    event Minted(address indexed to, uint256 amount);
    event Burnt(address indexed _burner, uint256 _value);

    // Permissions this to a Permission module, which has a key of 1
    // If no Permission return false - note that IModule withPerm will allow ST owner all permissions anyway
    // this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns (bool);

    /**
     * @notice returns module list for a module type
     * @param _moduleType is which type of module we are trying to remove
     * @param _moduleIndex is the index of the module within the chosen type
     */
    function getModule(uint8 _moduleType, uint _moduleIndex) external view returns (bytes32, address);

    /**
     * @notice returns module list for a module name - will return first match
     * @param _moduleType is which type of module we are trying to remove
     * @param _name is the name of the module within the chosen type
     */
    function getModuleByName(uint8 _moduleType, bytes32 _name) external view returns (bytes32, address);

    /**
     * @notice returns All module list for a module name 
     * @param _moduleType is which type of module we are trying to get
     * @param _name is the name of the module within the chosen type
     * @return bytes32
     * @return address
     */
    function getAllModulesByName(uint8 _moduleType, bytes32 _name) public view returns (bytes32[], address[]);

    /**
     * @notice Queries totalSupply as of a defined checkpoint
     * @param _checkpointId Checkpoint ID to query as of
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns (uint256);

    /**
     * @notice Queries balances as of a defined checkpoint
     * @param _investor Investor to query balance for
     * @param _checkpointId Checkpoint ID to query as of
     */
    function balanceOfAt(address _investor, uint256 _checkpointId) external view returns (uint256);

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     */
    function createCheckpoint() external returns (uint256);

    /**
     * @notice gets length of investors array
     * NB - this length may differ from investorCount if list has not been pruned of zero balance investors
     * @return length
     */
    function getInvestorsLength() external view returns (uint256);

    /**
    * @notice gets current checkpoint ID
    * @return id
    */
    function currentCheckpointId() external view returns (uint256);

    /**
    * @notice gets investor at a particular index
    * @param _index index to return address from
    * @return investor address
    */
    function investors(uint256 _index) external view returns (address);

    /**
    * @notice gets number of investors
    * @return count of investors
    */
    function investorCount() external view returns (uint256);

    /**
    * @notice allows the owner to withdraw unspent POLY stored by them on the ST.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _amount amount of POLY to withdraw
    */
    function withdrawPoly(uint256 _amount) external;

    /**
    * @notice allows owner to approve more POLY to one of the modules
    * @param _moduleType module type
    * @param _moduleIndex module index
    * @param _budget new budget
    */
    function changeModuleBudget(uint8 _moduleType, uint8 _moduleIndex, uint256 _budget) external;

    /**
     * @notice change the tokenDetails
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string _newTokenDetails) external;

    /**
    * @notice allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external;

    /**
    * @notice removes addresses with zero balances from the investors list
    * @param _start Index in investor list at which to start removing zero balances
    * @param _iters Max number of iterations of the for loop
    * NB - pruning this list will mean you may not be able to iterate over investors on-chain as of a historical checkpoint
    */
    function pruneInvestors(uint256 _start, uint256 _iters) external;

    /**
     * @notice freeze all the transfers
     */
    function freezeTransfers() external;

    /**
     * @notice un-freeze all the transfers
     */
    function unfreezeTransfers() external;

    /**
     * @notice End token minting period permanently for Issuer
     */
    function finishMintingIssuer() external;

    /**
     * @notice End token minting period permanently for STOs
     */
    function finishMintingSTO() external;

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investors A list of addresses to whom the minted tokens will be dilivered
     * @param _amounts A list of number of tokens get minted and transfer to corresponding address of the investor from _investor[] list
     * @return success
     */
    function mintMulti(address[] _investors, uint256[] _amounts) external returns (bool success);

    /**
     * @notice used to set the token Burner address. It only be called by the owner
     * @param _tokenBurner Address of the token burner contract
     */
    function setTokenBurner(address _tokenBurner) external;

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _moduleType is which type of module we are trying to remove
    * @param _moduleIndex is the index of the module within the chosen type
    */
    function removeModule(uint8 _moduleType, uint8 _moduleIndex) external;

    /**
     * @notice Function used to attach the module in security token
     * @param _moduleFactory Contract address of the module factory that needs to be attached
     * @param _data Data used for the intialization of the module factory variables
     * @param _maxCost Maximum cost of the Module factory
     * @param _budget Budget of the Module factory
     */
    function addModule(
        address _moduleFactory,
        bytes _data,
        uint256 _maxCost,
        uint256 _budget
    ) external;

}
