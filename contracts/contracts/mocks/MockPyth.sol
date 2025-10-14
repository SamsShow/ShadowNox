// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract MockPyth is IPyth {
    mapping(bytes32 => PythStructs.Price) private prices;
    uint256 private updateFee;
    uint256 private validTimePeriod = 60; // Default to 60 seconds

    function setPrice(bytes32 id, int64 price, uint64 conf, int32 expo, uint256 timestamp) external {
        prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: timestamp
        });
    }

    function setUpdateFee(uint256 fee) external {
        updateFee = fee;
    }
    
    function setValidTimePeriod(uint256 period) external {
        validTimePeriod = period;
    }

    // --- IPyth Interface Functions ---

    function getValidTimePeriod() external view returns (uint) {
        return validTimePeriod;
    }

    function getPrice(bytes32 id) external view returns (PythStructs.Price memory) {
        require(block.timestamp - prices[id].publishTime <= validTimePeriod, "Price is too old");
        return prices[id];
    }
    
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory) {
        return prices[id];
    }
    
    function getPriceNoOlderThan(bytes32 id, uint age) external view returns (PythStructs.Price memory) {
        require(block.timestamp - prices[id].publishTime <= age, "Price is too old");
        return prices[id];
    }

    function getEmaPrice(bytes32 id) external view returns (PythStructs.Price memory) {
        require(block.timestamp - prices[id].publishTime <= validTimePeriod, "Price is too old");
        return prices[id];
    }

    function getEmaPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory) {
        return prices[id];
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint age) external view returns (PythStructs.Price memory) {
        require(block.timestamp - prices[id].publishTime <= age, "Price is too old");
        return prices[id];
    }

    function updatePriceFeeds(bytes[] calldata updateData) external payable {
        // Mock function, does nothing but accepts the call
    }

    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64[] calldata publishTimes
    ) external payable {
        // Mock function, does nothing but accepts the call
    }

    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount) {
        return updateFee;
    }
    
    function parsePriceFeedUpdates(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external payable returns (PythStructs.PriceFeed[] memory priceFeeds) {
        PythStructs.PriceFeed[] memory emptyFeeds = new PythStructs.PriceFeed[](0);
        return emptyFeeds;
    }

    function parsePriceFeedUpdatesUnique(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external payable returns (PythStructs.PriceFeed[] memory priceFeeds) {
        PythStructs.PriceFeed[] memory emptyFeeds = new PythStructs.PriceFeed[](0);
        return emptyFeeds;
    }
}