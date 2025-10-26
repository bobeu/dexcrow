// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IPyth } from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import { PythStructs } from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title PythPriceFeed
 * @dev Contract for integrating with Pyth Network for live price feeds
 * @author TradeVerse Team
 */
abstract contract PythPriceFeed {
    error PriceFeedIdAlreadySetForOrder();
    error InvalidPriceFeedId();
    error InvalidCaller();
    error InsufficientPriceUpdateFee();

    // ============ STATE VARIABLES ============

    /**
     * @dev Pyth oracle contract
     */
    IPyth public immutable pyth;

    /**
     * @dev Mapping of order IDs to price feed IDs
     */
    mapping(bytes32 => bytes32) public priceFeedIds;

    // Example constant for an authenticator's price feed ID
    bytes32 private immutable authenticator ;

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the Pyth price feed
     * @param _pyth Address of the Pyth oracle contract
     */
    constructor(address _pyth, address _seller) {
        require(
            _pyth != address(0),
            "PythPriceFeed: Invalid Pyth address"
        );

        pyth = IPyth(_pyth);
        authenticator = keccak256(abi.encodePacked(_seller));
    }

    // ============ FALLBACK FUNCTIONS ============

    /**
     * @dev Receive function for handling ETH
     */
    receive() external payable {
        // Allow receiving ETH for Pyth updates
    }

    // @param orderId: The unique identifier for the order
    // @param priceUpdate: The encoded data to update the contract with the latest pricecontract-addresses/evm
    function getPriceFor(bytes32 orderId) public payable returns (int result) {
        if(keccak256(abi.encodePacked(msg.sender)) != authenticator) {
            revert InvalidCaller();
        }
        bytes[] memory priceUpdate;
        bytes32 priceFeedId = priceFeedIds[orderId];
        if(priceFeedId == bytes32(0)) {
            revert InvalidPriceFeedId();
        }
        uint updateFee = pyth.getUpdateFee(priceUpdate);
        if(address(this).balance < updateFee) revert InsufficientPriceUpdateFee();
        pyth.updatePriceFeeds{ value: updateFee }(priceUpdate);

        result = pyth.getPriceNoOlderThan(priceFeedId, 60).price;
    }

    function _updatePriceFeedId(bytes32 orderId, bytes32 priceFeedId) internal {
        bytes32 existingPriceFeedId = priceFeedIds[orderId];
        if(existingPriceFeedId == priceFeedId) {
            revert PriceFeedIdAlreadySetForOrder();
        }
        if(priceFeedId == bytes32(0)) {
            revert InvalidPriceFeedId();
        }
        priceFeedIds[orderId] = priceFeedId;
    }

}
