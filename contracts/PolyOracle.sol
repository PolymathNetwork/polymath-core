pragma solidity ^0.4.24;

import "./oraclize/oraclizeAPI.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PolyOracle is usingOraclize, Ownable {
    using SafeMath for uint256;

    string public oracleURL = "json(https://api.coinmarketcap.com/v2/ticker/2496/?convert=USD).data.quotes.USD.price";
    uint256 public sanityBounds = 20*10**16;
    uint256 public gasLimit = 100000;
    uint256 public oraclizeTimeTolerance = 5 minutes;

    uint256 public POLYUSD;
    uint256 public latestUpdate;
    mapping (bytes32 => uint256) requestIds;
    mapping (bytes32 => bool) ignoreRequestIds;

    bool public freezeOracle;

    event LogPriceUpdated(uint256 _price, uint256 _oldPrice, uint256 _time);
    event LogNewOraclizeQuery(uint256 _time, bytes32 _queryId, string _query);

    constructor() payable public {
        // Use 50 gwei for now
        oraclize_setCustomGasPrice(50*10**9);
    }

    function __callback(bytes32 _requestId, string _result) public {
        require(msg.sender == oraclize_cbAddress(), "Only Oraclize can access this method");
        require(!freezeOracle, "Oracle is frozen");
        require(!ignoreRequestIds[_requestId], "Ignoring requestId");
        require(requestIds[_requestId] >= latestUpdate, "Result is stale");
        require(requestIds[_requestId] <= now + oraclizeTimeTolerance, "Result is early");
        uint256 newPOLYUSD = parseInt(_result, 18);
        uint256 bound = POLYUSD.mul(sanityBounds).div(10**18);
        if (latestUpdate != 0) {
          require(newPOLYUSD <= POLYUSD.add(bound), "Result is too large");
          require(newPOLYUSD >= POLYUSD.sub(bound), "Result is too small");
        }
        latestUpdate = requestIds[_requestId];
        delete requestIds[_requestId];
        emit LogPriceUpdated(newPOLYUSD, POLYUSD, latestUpdate);
        POLYUSD = newPOLYUSD;
    }

    function schedulePriceUpdatesFixed(uint256[] _times) payable onlyOwner public {
        bytes32 requestId;
        if (_times.length == 0) {
            require(oraclize_getPrice("URL") <= address(this).balance, "Insufficient Funds");
            requestId = oraclize_query("URL", oracleURL, gasLimit);
            requestIds[requestId] = now;
            emit LogNewOraclizeQuery(now, requestId, oracleURL);
        } else {
            require(oraclize_getPrice("URL") * _times.length <= address(this).balance, "Insufficient Funds");
            for (uint256 i = 0; i < _times.length; i++) {
                requestId = oraclize_query(_times[i], "URL", oracleURL, gasLimit);
                requestIds[requestId] = _times[i];
                emit LogNewOraclizeQuery(_times[i], requestId, oracleURL);
            }
        }
    }

    function schedulePriceUpdatesRolling(uint256 _startTime, uint256 _interval, uint256 _iters) onlyOwner public {
        bytes32 requestId;
        require(oraclize_getPrice("URL") * _iters <= address(this).balance, "Insufficient Funds");
        for (uint256 i = 0; i < _iters; i++) {
            uint256 scheduledTime = _startTime + (i * _interval);
            requestId = oraclize_query(scheduledTime, "URL", oracleURL, gasLimit);
            requestIds[requestId] = scheduledTime;
            emit LogNewOraclizeQuery(scheduledTime, requestId, oracleURL);
        }
    }

    function setPOLYUSD(uint256 _price) onlyOwner public {
        POLYUSD = _price;
        latestUpdate = now;
    }

    function setFreezeOracle(bool _frozen) onlyOwner public {
        freezeOracle = _frozen;
    }

    function setOracleURL(string _oracleURL) onlyOwner public {
        oracleURL = _oracleURL;
    }

    function setSanityBounds(uint256 _sanityBounds) onlyOwner public {
        sanityBounds = _sanityBounds;
    }

    function setGasPrice(uint256 _gasPrice) onlyOwner public {
        oraclize_setCustomGasPrice(_gasPrice);
    }

    function getPrice() view public returns(uint256, uint256) {
        return (POLYUSD, latestUpdate);
    }

    function setGasLimit(uint256 _gasLimit) onlyOwner public {
        gasLimit = _gasLimit;
    }

    function setIgnoreRequestIds(bytes32[] _requestIds, bool[] _ignore) onlyOwner public {
        require(_requestIds.length == _ignore.length, "Incorrect parameter lengths");
        for (uint256 i = 0; i < _requestIds.length; i++) {
            ignoreRequestIds[_requestIds[i]] = _ignore[i];
        }
    }

    function setOraclizeTimeTolerance(uint256 _oraclizeTimeTolerance) onlyOwner public {
        oraclizeTimeTolerance = _oraclizeTimeTolerance;
    }

}
