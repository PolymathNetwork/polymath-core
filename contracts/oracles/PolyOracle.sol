pragma solidity ^0.4.24;

import "../external/oraclizeAPI.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import '../interfaces/IOracle.sol';

contract PolyOracle is usingOraclize, IOracle, Ownable {
    using SafeMath for uint256;

    string public oracleURL = '[URL] json(https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2496&convert=USD&CMC_PRO_API_KEY=${[decrypt] BCA0Bqxmn3jkSENepaHxQv09Z/vGdEO9apO+B9RplHyV3qOL/dw5Indlei3hoXrGk9G14My8MFpHJycB7UoVnl+4mlzEsjTlS2UBAYVrl0fAepfiSyM30/GMZAoJmDagY+0YyNZvpkgXn86Q/59Bi48PWEet}).data."2496".quote.USD.price';
    string public oracleQueryType = "nested";
    uint256 public sanityBounds = 20*10**16;
    uint256 public gasLimit = 100000;
    uint256 public oraclizeTimeTolerance = 5 minutes;
    uint256 public staleTime = 6 hours;

    uint256 private POLYUSD;
    uint256 public latestUpdate;
    uint256 public latestScheduledUpdate;

    mapping (bytes32 => uint256) public requestIds;
    mapping (bytes32 => bool) public ignoreRequestIds;

    mapping (address => bool) public admin;

    bool public freezeOracle;

    event LogPriceUpdated(uint256 _price, uint256 _oldPrice, bytes32 _queryId, uint256 _time);
    event LogNewOraclizeQuery(uint256 _time, bytes32 _queryId, string _query);
    event LogAdminSet(address _admin, bool _valid, uint256 _time);
    event LogStalePriceUpdate(bytes32 _queryId, uint256 _time, string _result);

    modifier isAdminOrOwner {
        require(admin[msg.sender] || msg.sender == owner, "Address is not admin or owner");
        _;
    }

    /**
    * @notice Constructor - accepts ETH to initialise a balance for subsequent Oraclize queries
    */
    constructor() payable public {
        // Use 50 gwei for now
        oraclize_setCustomGasPrice(50*10**9);
    }

    /**
    * @notice Oraclize callback (triggered by Oraclize)
    * @param _requestId requestId corresponding to Oraclize query
    * @param _result data returned by Oraclize URL query
    */
    function __callback(bytes32 _requestId, string _result) public {
        require(msg.sender == oraclize_cbAddress(), "Only Oraclize can access this method");
        require(!freezeOracle, "Oracle is frozen");
        require(!ignoreRequestIds[_requestId], "Ignoring requestId");
        if (requestIds[_requestId] < latestUpdate) {
            // Result is stale, probably because it was received out of order
            emit LogStalePriceUpdate(_requestId, requestIds[_requestId], _result);
            return;
        }
        require(requestIds[_requestId] >= latestUpdate, "Result is stale");
        require(requestIds[_requestId] <= now + oraclizeTimeTolerance, "Result is early");
        uint256 newPOLYUSD = parseInt(_result, 18);
        uint256 bound = POLYUSD.mul(sanityBounds).div(10**18);
        if (latestUpdate != 0) {
          require(newPOLYUSD <= POLYUSD.add(bound), "Result is too large");
          require(newPOLYUSD >= POLYUSD.sub(bound), "Result is too small");
        }
        latestUpdate = requestIds[_requestId];
        emit LogPriceUpdated(newPOLYUSD, POLYUSD, _requestId, latestUpdate);
        POLYUSD = newPOLYUSD;
    }

    /**
    * @notice Allows owner to schedule future Oraclize calls
    * @param _times UNIX timestamps to schedule Oraclize calls as of. Empty list means trigger an immediate query.
    */
    function schedulePriceUpdatesFixed(uint256[] _times) payable isAdminOrOwner public {
        bytes32 requestId;
        uint256 maximumScheduledUpdated;
        if (_times.length == 0) {
            require(oraclize_getPrice(oracleQueryType, gasLimit) <= address(this).balance, "Insufficient Funds");
            requestId = oraclize_query(oracleQueryType, oracleURL, gasLimit);
            requestIds[requestId] = now;
            maximumScheduledUpdated = now;
            emit LogNewOraclizeQuery(now, requestId, oracleURL);
        } else {
            require(oraclize_getPrice(oracleQueryType, gasLimit) * _times.length <= address(this).balance, "Insufficient Funds");
            for (uint256 i = 0; i < _times.length; i++) {
                require(_times[i] >= now, "Past scheduling is not allowed and scheduled time should be absolute timestamp");
                requestId = oraclize_query(_times[i], oracleQueryType, oracleURL, gasLimit);
                requestIds[requestId] = _times[i];
                if (maximumScheduledUpdated < requestIds[requestId]) {
                    maximumScheduledUpdated = requestIds[requestId];
                }
                emit LogNewOraclizeQuery(_times[i], requestId, oracleURL);
            }
        }
        if (latestScheduledUpdate < maximumScheduledUpdated) {
            latestScheduledUpdate = maximumScheduledUpdated;
        }
    }

    /**
    * @notice Allows owner to schedule future Oraclize calls on a rolling schedule
    * @param _startTime UNIX timestamp for the first scheduled Oraclize query
    * @param _interval how long (in seconds) between each subsequent Oraclize query
    * @param _iters the number of Oraclize queries to schedule.
    */
    function schedulePriceUpdatesRolling(uint256 _startTime, uint256 _interval, uint256 _iters) payable isAdminOrOwner public {
        bytes32 requestId;
        require(_interval > 0, "Interval between scheduled time should be greater than zero");
        require(_iters > 0, "No iterations specified");
        require(_startTime >= now, "Past scheduling is not allowed and scheduled time should be absolute timestamp");
        require(oraclize_getPrice(oracleQueryType, gasLimit) * _iters <= address(this).balance, "Insufficient Funds");
        for (uint256 i = 0; i < _iters; i++) {
            uint256 scheduledTime = _startTime + (i * _interval);
            requestId = oraclize_query(scheduledTime, oracleQueryType, oracleURL, gasLimit);
            requestIds[requestId] = scheduledTime;
            emit LogNewOraclizeQuery(scheduledTime, requestId, oracleURL);
        }
        if (latestScheduledUpdate < requestIds[requestId]) {
            latestScheduledUpdate = requestIds[requestId];
        }
    }

    /**
    * @notice Allows owner to manually set POLYUSD price
    * @param _price POLYUSD price
    */
    function setPOLYUSD(uint256 _price) onlyOwner public {
        emit LogPriceUpdated(_price, POLYUSD, 0, now);
        POLYUSD = _price;
        latestUpdate = now;
    }

    /**
    * @notice Allows owner to set oracle to ignore all Oraclize pricce updates
    * @param _frozen true to freeze updates, false to reenable updates
    */
    function setFreezeOracle(bool _frozen) onlyOwner public {
        freezeOracle = _frozen;
    }

    /**
    * @notice Allows owner to set URL used in Oraclize queries
    * @param _oracleURL URL to use
    */
    function setOracleURL(string _oracleURL) onlyOwner public {
        oracleURL = _oracleURL;
    }

    /**
    * @notice Allows owner to set type used in Oraclize queries
    * @param _oracleQueryType to use
    */
    function setOracleQueryType(string _oracleQueryType) onlyOwner public {
        oracleQueryType = _oracleQueryType;
    }

    /**
    * @notice Allows owner to set new sanity bounds for price updates
    * @param _sanityBounds sanity bounds as a percentage * 10**16
    */
    function setSanityBounds(uint256 _sanityBounds) onlyOwner public {
        sanityBounds = _sanityBounds;
    }

    /**
    * @notice Allows owner to set new gas price for future Oraclize queries
    * @notice NB - this will only impact newly scheduled Oraclize queries, not future queries which have already been scheduled
    * @param _gasPrice gas price to use for Oraclize callbacks
    */
    function setGasPrice(uint256 _gasPrice) onlyOwner public {
        oraclize_setCustomGasPrice(_gasPrice);
    }

    /**
    * @notice Returns price and corresponding update time
    * @return latest POLYUSD price
    * @return timestamp of latest price update
    */
    function getPriceAndTime() view public returns(uint256, uint256) {
        return (POLYUSD, latestUpdate);
    }

    /**
    * @notice Allows owner to set new gas limit on Oraclize queries
    * @notice NB - this will only impact newly scheduled Oraclize queries, not future queries which have already been scheduled
    * @param _gasLimit gas limit to use for Oraclize callbacks
    */
    function setGasLimit(uint256 _gasLimit) isAdminOrOwner public {
        gasLimit = _gasLimit;
    }

    /**
    * @notice Allows owner to set time after which price is considered stale
    * @param _staleTime elapsed time after which price is considered stale
    */
    function setStaleTime(uint256 _staleTime) onlyOwner public {
        staleTime = _staleTime;
    }

    /**
    * @notice Allows owner to ignore specific requestId results from Oraclize
    * @param _requestIds Oraclize queryIds (as logged out when Oraclize query is scheduled)
    * @param _ignore whether or not they should be ignored
    */
    function setIgnoreRequestIds(bytes32[] _requestIds, bool[] _ignore) onlyOwner public {
        require(_requestIds.length == _ignore.length, "Incorrect parameter lengths");
        for (uint256 i = 0; i < _requestIds.length; i++) {
            ignoreRequestIds[_requestIds[i]] = _ignore[i];
        }
    }

    /**
    * @notice Allows owner to set up admin addresses that can schedule updates
    * @param _admin Admin address
    * @param _valid Whether address should be added or removed from admin list
    */
    function setAdmin(address _admin, bool _valid) onlyOwner public {
        admin[_admin] = _valid;
        emit LogAdminSet(_admin, _valid, now);
    }

    /**
    * @notice Allows owner to set new time tolerance on Oraclize queries
    * @param _oraclizeTimeTolerance amount of time in seconds that an Oraclize query can be early
    */
    function setOraclizeTimeTolerance(uint256 _oraclizeTimeTolerance) onlyOwner public {
        oraclizeTimeTolerance = _oraclizeTimeTolerance;
    }

    /**
    * @notice Returns address of oracle currency (0x0 for ETH)
    */
    function getCurrencyAddress() external view returns(address) {
        return 0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC;
    }

    /**
    * @notice Returns symbol of oracle currency (0x0 for ETH)
    */
    function getCurrencySymbol() external view returns(bytes32) {
        return bytes32("POLY");
    }

    /**
    * @notice Returns denomination of price
    */
    function getCurrencyDenominated() external view returns(bytes32) {
        return bytes32("USD");
    }

    /**
    * @notice Returns price - should throw if not valid
    */
    function getPrice() external view returns(uint256) {
        require(latestUpdate >= now - staleTime);
        return POLYUSD;
    }

    /**
    * @notice Returns balance to owner
    */
    function drainContract() external onlyOwner {
        msg.sender.transfer(address(this).balance);
    }

}
