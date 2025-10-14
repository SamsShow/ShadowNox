// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
// import "../../../node_modules/@pythnetwork/pyth-sdk-solidity/IPyth.sol";

/**
 * @title PythAdapter
 * @notice Aggregate price feed adapter for Shadow Nox.
 * @dev Integrates with Pyth Network for oracle data and stores aggregate metrics
 * updated by a trusted relayer. It does not expose individual position data.
 */
contract PythAdapter {
    IPyth public pyth;
    address public owner;

    // Aggregate market metrics structure
    struct AggregateMetrics {
        uint256 totalLiquidity;
        uint256 totalVolume;
        uint256 lastUpdateTime;
        int64 lastPrice; // Storing the last known price from Pyth
    }

    // Token address => Pyth price feed ID
    mapping(address => bytes32) private pythPriceIds;

    // Token address => Aggregate metrics
    mapping(address => AggregateMetrics) private aggregateMetrics;

    // Events
    event MetricsUpdated(address indexed token, uint256 liquidity, uint256 volume, int64 price, uint256 timestamp);
    event PriceIdSet(address indexed token, bytes32 indexed priceId);

    error NotOwner();
    error PriceFeedNotSet();
    error InvalidUpdateData();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address _pythAddress) {
        pyth = IPyth(_pythAddress);
        owner = msg.sender;
    }

    /**
     * @notice Sets the Pyth price feed ID for a given token. (Admin only)
     * @param _token The address of the token (e.g., USDC).
     * @param _priceId The corresponding Pyth price feed ID for that token.
     */
    function setPriceId(address _token, bytes32 _priceId) external onlyOwner {
        pythPriceIds[_token] = _priceId;
        emit PriceIdSet(_token, _priceId);
    }

    /**
     * @notice Updates aggregate metrics for a token. (Trusted Relayer/Owner only)
     * @dev This function is called by the off-chain bot after it executes a private transaction.
     * @param _token The token address to update.
     * @param _liquidityChange The change in total liquidity (can be negative).
     * @param _volume The volume of the transaction.
     * @param _updateData The Pyth price update data, provided by the off-chain bot.
     */
    function updateAggregateMetrics(
        address _token,
        int256 _liquidityChange,
        uint256 _volume,
        bytes[] calldata _updateData
    ) external payable onlyOwner {
        bytes32 priceId = pythPriceIds[_token];
        if (priceId == 0) {
            revert PriceFeedNotSet();
        }

        // The fee required by Pyth to update the price on-chain
        uint256 updateFee = pyth.getUpdateFee(_updateData);
        if (msg.value < updateFee) {
            revert InvalidUpdateData();
        }

        // Update the Pyth price on-chain
        pyth.updatePriceFeeds{value: msg.value}(_updateData);

        // Get the latest price
        PythStructs.Price memory price = pyth.getPrice(priceId);

        // Update our aggregate metrics
        AggregateMetrics storage metrics = aggregateMetrics[_token];
        if (_liquidityChange > 0) {
            metrics.totalLiquidity += uint256(_liquidityChange);
        } else {
            metrics.totalLiquidity -= uint256(-_liquidityChange);
        }
        metrics.totalVolume += _volume;
        metrics.lastUpdateTime = block.timestamp;
        metrics.lastPrice = price.price;

        emit MetricsUpdated(_token, metrics.totalLiquidity, metrics.totalVolume, metrics.lastPrice, block.timestamp);
    }

    /**
     * @notice Get the latest price from Pyth for a specific token.
     * @param _token The token address.
     * @return The latest price struct from Pyth.
     */
    function getLatestPrice(address _token) external view returns (PythStructs.Price memory) {
        bytes32 priceId = pythPriceIds[_token];
        if (priceId == 0) {
            revert PriceFeedNotSet();
        }
        return pyth.getPrice(priceId);
    }

    /**
     * @notice Get the stored aggregate market metrics for a token.
     * @param _token The token address.
     */
    function getAggregateMetrics(address _token)
        external
        view
        returns (AggregateMetrics memory)
    {
        return aggregateMetrics[_token];
    }
}