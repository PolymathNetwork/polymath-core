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
    function verifyTransfer(address _from, address _to, uint256 _value) external returns (bool success);

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investor address the tokens will be minted to
     * @param _value is the amount of tokens that will be minted to the investor
     */
    function mint(address _investor, uint256 _value) external returns (bool success);

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investor address the tokens will be minted to
     * @param _value is the amount of tokens that will be minted to the investor
     * @param _data data to indicate validation
     */
    function mintWithData(address _investor, uint256 _value, bytes _data) external returns (bool success);

    /**
     * @notice Burn function used to burn the securityToken on behalf of someone else
     * @param _from Address for whom to burn tokens
     * @param _value No. of token that get burned
     * @param _data data to indicate validation
     */
    function burnFromWithData(address _from, uint256 _value, bytes _data) external;

    /**
     * @notice Burn function used to burn the securityToken
     * @param _value No. of tokens that get burned
     * @param _data data to indicate validation
     */
    function burnWithData(uint256 _value, bytes _data) external;

    event Minted(address indexed _to, uint256 _value);
    event Burnt(address indexed _burner, uint256 _value);

    // Permissions this to a Permission module, which has a key of 1
    // If no Permission return false - note that IModule withPerm will allow ST owner all permissions anyway
    // this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns (bool);

    /**
     * @notice Returns module list for a module type
     * @param _module address of the module
     * @return bytes32 name
     * @return address module address
     * @return address module factory address
     * @return bool module archived
     * @return uint8 module type
     * @return uint256 module index
     * @return uint256 name index

     */
    function getModule(address _module) external view returns(bytes32, address, address, bool, uint8, uint256, uint256);

    /**
     * @notice returns module list for a module name
     * @param _name name of the module
     * @return address[] list of modules with this name
     */
    function getModulesByName(bytes32 _name) external view returns (address[]);

    /**
     * @notice returns module list for a module type
     * @param _type type of the module
     * @return address[] list of modules with this type
     */
    function getModulesByType(uint8 _type) external view returns (address[]);

    /**
     * @notice Queries totalSupply at a specified checkpoint
     * @param _checkpointId Checkpoint ID to query as of
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns (uint256);

    /**
     * @notice Queries balances at a specified checkpoint
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
     * NB - this length may differ from investorCount if the list has not been pruned of zero-balance investors
     * @return length
     */
    function getInvestors() external view returns (address[]);

    /**
    * @notice gets current checkpoint ID
    * @return id
    */
    function currentCheckpointId() external view returns (uint256);

    /**
    * @notice gets an investor at a particular index
    * @param _index index to return address from
    * @return investor address
    */
    function investors(uint256 _index) external view returns (address);

    /**
    * @notice allows the owner to withdraw unspent POLY stored by them on the ST.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _value amount of POLY to withdraw
    */
    function withdrawPoly(uint256 _value) external;

    /**
    * @notice allows owner to approve more POLY to one of the modules
    * @param _module module address
    * @param _budget new budget
    */
    function changeModuleBudget(address _module, uint256 _budget) external;

    /**
     * @notice changes the tokenDetails
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
     * @notice End token minting period permanently
     */
    function freezeMinting() external;

    /**
     * @notice mints new tokens and assigns them to the target investors.
     * Can only be called by the STO attached to the token or by the Issuer (Security Token contract owner)
     * @param _investors A list of addresses to whom the minted tokens will be delivered
     * @param _values A list of the amount of tokens to mint to corresponding addresses from _investor[] list
     * @return success
     */
    function mintMulti(address[] _investors, uint256[] _values) external returns (bool success);

    /**
     * @notice Function used to attach a module to the security token
     * @dev  E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
     * @dev to control restrictions on transfers.
     * @dev You are allowed to add a new moduleType if:
     * @dev - there is no existing module of that type yet added
     * @dev - the last member of the module list is replacable
     * @param _moduleFactory is the address of the module factory to be added
     * @param _data is data packed into bytes used to further configure the module (See STO usage)
     * @param _maxCost max amount of POLY willing to pay to module. (WIP)
     */
    function addModule(
        address _moduleFactory,
        bytes _data,
        uint256 _maxCost,
        uint256 _budget
    ) external;

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function archiveModule(address _module) external;

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function unarchiveModule(address _module) external;

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function removeModule(address _module) external;

    /**
     * @notice Use by the issuer to set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) external;

    /**
     * @notice Use by a controller to execute a forced transfer
     * @param _from address from which to take tokens
     * @param _to address where to send tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _log) external;

    /**
     * @notice Use by a controller to execute a foced burn
     * @param _from address from which to take tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceBurn(address _from, uint256 _value, bytes _data, bytes _log) external;

    /**
     * @notice Use by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
     function disableController() external;

     /**
     * @notice Use to get the version of the securityToken
     */
     function getVersion() external view returns(uint8[]);

     /**
     * @notice gets the investor count
     */
     function getInvestorCount() external view returns(uint256);

     /**
      * @notice Overloaded version of the transfer function
      * @param _to receiver of transfer
      * @param _value value of transfer
      * @param _data data to indicate validation
      * @return bool success
      */
     function transferWithData(address _to, uint256 _value, bytes _data) external returns (bool success);

     /**
      * @notice Overloaded version of the transferFrom function
      * @param _from sender of transfer
      * @param _to receiver of transfer
      * @param _value value of transfer
      * @param _data data to indicate validation
      * @return bool success
      */
     function transferFromWithData(address _from, address _to, uint256 _value, bytes _data) external returns(bool);
     
     /**
      * @notice Provide the granularity of the token
      * @return uint256 
      */
     function granularity() external view returns(uint256);
}
