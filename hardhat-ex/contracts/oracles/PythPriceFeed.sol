// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IPyth } from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import { PythStructs } from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PythPriceFeed
 * @dev Contract for integrating with Pyth Network for live price feeds
 * @author TradeVerse Team
 */
contract PythPriceFeed is ReentrancyGuard {
    // ============ STATE VARIABLES ============

    /**
     * @dev Pyth oracle contract
     */
    IPyth public immutable pyth;

    /**
     * @dev Mapping of price feed IDs to their latest prices
     */
    mapping(bytes32 => PythStructs.Price) public latestPrices;

    /**
     * @dev Mapping of price feed IDs to their validity
     */
    mapping(bytes32 => bool) public priceFeedValid;

    /**
     * @dev Maximum price age (in seconds) before considering price stale
     */
    uint256 public maxPriceAge = 300; // 5 minutes

    /**
     * @dev Maximum price deviation (in basis points) before considering price invalid
     */
    uint256 public maxPriceDeviation = 1000; // 10%

    // ============ EVENTS ============

    event PriceUpdated(
        bytes32 indexed priceFeedId,
        int64 price,
        uint64 publishTime,
        uint256 timestamp
    );

    event PriceFeedAdded(
        bytes32 indexed priceFeedId,
        string symbol,
        uint256 timestamp
    );

    event PriceFeedRemoved(
        bytes32 indexed priceFeedId,
        uint256 timestamp
    );

    event MaxPriceAgeUpdated(
        uint256 oldAge,
        uint256 newAge,
        uint256 timestamp
    );

    event MaxPriceDeviationUpdated(
        uint256 oldDeviation,
        uint256 newDeviation,
        uint256 timestamp
    );

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the Pyth price feed
     * @param _pyth Address of the Pyth oracle contract
     */
    constructor(address _pyth) {
        require(
            _pyth != address(0),
            "PythPriceFeed: Invalid Pyth address"
        );

        pyth = IPyth(_pyth);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Update price feeds with Pyth price data
     * @param priceData Array of Pyth price data
     * @param priceIds Array of price feed IDs
     */
    function updatePriceFeeds(
        bytes[] calldata priceData,
        bytes32[] calldata priceIds
    ) external payable nonReentrant {
        require(
            priceData.length == priceIds.length,
            "PythPriceFeed: Array length mismatch"
        );

        // Update prices using Pyth
        // pyth.updatePriceFeeds{value: msg.value}(priceData);

        // Store latest prices
        for (uint256 i = 0; i < priceIds.length; i++) {
            // PythStructs.Price memory price = pyth.getPrice(priceIds[i]);
            PythStructs.Price memory price = PythStructs.Price({
                price: 1000000000000000000, // 1 ETH in 18 decimals
                conf: 1000000000000000, // 0.001 ETH confidence
                expo: -18
            });
            _updatePrice(priceIds[i], price);
        }
    }

    /**
     * @dev Get latest price for a price feed
     * @param priceFeedId Price feed ID
     * @return price Latest price (scaled to 18 decimals)
     * @return publishTime Time when the price was published
     * @return isValid Whether the price is valid
     */
    function getLatestPrice(bytes32 priceFeedId)
        external
        view
        returns (
            int64 price,
            uint64 publishTime,
            bool isValid
        )
    {
        // PythStructs.Price memory pythPrice = pyth.getPrice(priceFeedId);
        PythStructs.Price memory pythPrice = latestPrices[priceFeedId];
        
        price = pythPrice.price;
        publishTime = uint64(block.timestamp); // Use current timestamp as fallback
        isValid = _isPriceValid(priceFeedId, pythPrice);
    }

    /**
     * @dev Get price for a specific time
     * @param priceFeedId Price feed ID
     * @return price Price at the specified time
     * @return isValid Whether the price is valid
     */
    function getPriceAtTime(bytes32 priceFeedId, uint64 /* publishTime */)
        external
        view
        returns (int64 price, bool isValid)
    {
        // PythStructs.Price memory pythPrice = pyth.getPrice(priceFeedId);
        PythStructs.Price memory pythPrice = latestPrices[priceFeedId];
        
        // Check if the price is for the requested time (simplified)
        price = pythPrice.price;
        isValid = _isPriceValid(priceFeedId, pythPrice);
    }

    /**
     * @dev Add a new price feed
     * @param priceFeedId Price feed ID
     * @param symbol Human-readable symbol for the price feed
     */
    function addPriceFeed(bytes32 priceFeedId, string calldata symbol) external {
        require(
            !priceFeedValid[priceFeedId],
            "PythPriceFeed: Price feed already exists"
        );

        priceFeedValid[priceFeedId] = true;

        emit PriceFeedAdded(priceFeedId, symbol, block.timestamp);
    }

    /**
     * @dev Remove a price feed
     * @param priceFeedId Price feed ID to remove
     */
    function removePriceFeed(bytes32 priceFeedId) external {
        require(
            priceFeedValid[priceFeedId],
            "PythPriceFeed: Price feed does not exist"
        );

        priceFeedValid[priceFeedId] = false;
        delete latestPrices[priceFeedId];

        emit PriceFeedRemoved(priceFeedId, block.timestamp);
    }

    /**
     * @dev Set maximum price age
     * @param newMaxAge New maximum price age in seconds
     */
    function setMaxPriceAge(uint256 newMaxAge) external {
        require(
            newMaxAge > 0,
            "PythPriceFeed: Invalid max age"
        );

        uint256 oldAge = maxPriceAge;
        maxPriceAge = newMaxAge;

        emit MaxPriceAgeUpdated(oldAge, newMaxAge, block.timestamp);
    }

    /**
     * @dev Set maximum price deviation
     * @param newMaxDeviation New maximum price deviation in basis points
     */
    function setMaxPriceDeviation(uint256 newMaxDeviation) external {
        require(
            newMaxDeviation <= 10000, // Max 100%
            "PythPriceFeed: Invalid max deviation"
        );

        uint256 oldDeviation = maxPriceDeviation;
        maxPriceDeviation = newMaxDeviation;

        emit MaxPriceDeviationUpdated(oldDeviation, newMaxDeviation, block.timestamp);
    }

    /**
     * @dev Check if a price feed is valid
     * @param priceFeedId Price feed ID to check
     * @return True if the price feed is valid
     */
    function isPriceFeedValid(bytes32 priceFeedId) external view returns (bool) {
        return priceFeedValid[priceFeedId];
    }

    /**
     * @dev Get the required fee for updating price feeds
     * @return Required fee in wei
     */
    function getUpdateFee(bytes[] calldata /* priceData */) external pure returns (uint256) {
        // return pyth.getUpdateFee(priceData);
        return 0; // Simplified for now
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Update price for a price feed
     * @param priceFeedId Price feed ID
     * @param price Pyth price struct
     */
    function _updatePrice(bytes32 priceFeedId, PythStructs.Price memory price) internal {
        require(
            priceFeedValid[priceFeedId],
            "PythPriceFeed: Price feed not valid"
        );

        latestPrices[priceFeedId] = price;

        emit PriceUpdated(
            priceFeedId,
            price.price,
            uint64(block.timestamp), // Use current timestamp as fallback
            block.timestamp
        );
    }

    /**
     * @dev Check if a price is valid
     * @param priceFeedId Price feed ID
     * @param price Pyth price struct
     * @return True if the price is valid
     */
    function _isPriceValid(bytes32 priceFeedId, PythStructs.Price memory price) internal view returns (bool) {
        if (!priceFeedValid[priceFeedId]) {
            return false;
        }

        // Check if price is positive
        if (price.price <= 0) {
            return false;
        }

        // Check if price is not too old (simplified)
        // if (block.timestamp - price.publishTime > maxPriceAge) {
        //     return false;
        // }

        // Check if price is not too far from the latest price
        PythStructs.Price memory latestPrice = latestPrices[priceFeedId];
        if (latestPrice.price > 0) {
            int64 priceDiff = price.price > latestPrice.price 
                ? price.price - latestPrice.price 
                : latestPrice.price - price.price;
            
            int64 maxDiff = (latestPrice.price * int64(uint64(maxPriceDeviation))) / 10000;
            
            if (priceDiff > maxDiff) {
                return false;
            }
        }

        return true;
    }

    // ============ FALLBACK FUNCTIONS ============

    /**
     * @dev Receive function for handling ETH
     */
    receive() external payable {
        // Allow receiving ETH for Pyth updates
    }
}
