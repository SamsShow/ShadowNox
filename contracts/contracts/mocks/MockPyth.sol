// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title MockPyth
 * @notice Mock Pyth contract for testing only
 * @dev DO NOT USE IN PRODUCTION - For testing SimpleLending and EncryptedSwap
 */
contract MockPyth is IPyth {
    mapping(bytes32 => PythStructs.Price) private prices;
    uint256 private updateFee;

    function getValidTimePeriod() external pure override returns (uint) {
        return 60;
    }

    function getPrice(bytes32 id) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getEmaPrice(bytes32 id) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getPriceUnsafe(bytes32 id) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getPriceNoOlderThan(bytes32 id, uint age) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getEmaPriceUnsafe(bytes32 id) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint age) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function updatePriceFeeds(bytes[] calldata updateData) external payable override {
        // Mock implementation - does nothing
    }

    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64[] calldata publishTimes
    ) external payable override {
        // Mock implementation - does nothing
    }

    function getUpdateFee(bytes[] calldata updateData) external view override returns (uint feeAmount) {
        return updateFee;
    }

    function parsePriceFeedUpdates(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external payable override returns (PythStructs.PriceFeed[] memory priceFeeds) {
        priceFeeds = new PythStructs.PriceFeed[](priceIds.length);
        return priceFeeds;
    }
    
    function parsePriceFeedUpdatesUnique(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64 minPublishTime,
        uint64 maxPublishTime
    ) external payable override returns (PythStructs.PriceFeed[] memory priceFeeds) {
        priceFeeds = new PythStructs.PriceFeed[](priceIds.length);
        return priceFeeds;
    }

    // Test helper functions
    function setPrice(bytes32 id, int64 price, uint64 conf, int32 expo, uint publishTime) external {
        prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime
        });
    }

    function setUpdateFee(uint256 fee) external {
        updateFee = fee;
    }
}

