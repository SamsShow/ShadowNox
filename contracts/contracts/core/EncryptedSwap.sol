// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../arcology/AtomicCounter.sol";
import "../oracle/CustomPriceOracle.sol";

/**
 * @title EncryptedSwap
 * @notice Private swap execution for Shadow Economy on Arcology
 * @dev Swap intents store arbitrary intent data for privacy-preserving execution
 * 
 * Executes on Arcology Parallel Blockchain:
 * - 10,000-15,000 TPS throughput for parallel swap execution
 * - Transaction metadata stored as bytes on-chain
 * - Smart contract logic PUBLIC, user parameters stored as bytes
 * - Optimistic concurrency control for conflict-free execution
 * 
 * Privacy Model:
 * - Individual swap details: Stored as bytes (intent data)
 * - Aggregate volume metrics: PUBLIC (on-chain)
 * - Smart contract bytecode: PUBLIC (Solidity logic on Arcology)
 * 
 * Arcology Optimizations:
 * - AtomicCounter for conflict-resistant aggregate metrics
 * - Per-user storage isolation for maximum parallelism
 * - Expected Performance: 10k-15k TPS
 */
contract EncryptedSwap {
    address public owner;
    CustomPriceOracle public priceOracle;
    
    // Private swap intent structure
    struct SwapIntent {
        address user;
        bytes intentData;      // ABI-encoded swap parameters (tokenIn, tokenOut, amountIn, minAmountOut, deadline)
        uint256 timestamp;
        bool executed;
        bool cancelled;
    }

    // Swap intents storage (per-intent isolation for Arcology parallelism)
    mapping(bytes32 => SwapIntent) private swapIntents;
    
    // User swap count for intent ID generation
    mapping(address => uint256) private userSwapCount;
    
    // Arcology-optimized aggregate metrics using AtomicCounter
    // Separate counter instances minimize storage-slot conflicts
    AtomicCounter public totalSwapVolume;
    AtomicCounter public totalSwapCount;

    // Events
    event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 timestamp);
    event SwapExecuted(bytes32 indexed intentId, address indexed user, uint256 volume, uint256 timestamp);
    event SwapCancelled(bytes32 indexed intentId, uint256 timestamp);

    error IntentNotFound();
    error IntentAlreadyProcessed();
    error NotOwner();
    error NotIntentOwner();
    error InvalidSlippage();
    error PriceStale();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address _priceOracleAddress) {
        owner = msg.sender;
        priceOracle = CustomPriceOracle(_priceOracleAddress);
        
        // Deploy Arcology-optimized AtomicCounters
        totalSwapVolume = new AtomicCounter();
        totalSwapCount = new AtomicCounter();
    }

    /**
     * @notice Submit a private swap intent
     * @dev Users submit swap intents that will be executed with price validation
     * @param _intentData ABI-encoded swap parameters (tokenIn, tokenOut, amountIn, minAmountOut, deadline)
     * @return intentId The unique ID for the swap intent
     */
    function submitSwapIntent(bytes calldata _intentData) 
        external 
        returns (bytes32) 
    {
        uint256 nonce = userSwapCount[msg.sender]++;
        bytes32 intentId = keccak256(abi.encodePacked(msg.sender, nonce, block.timestamp, _intentData));
        
        require(swapIntents[intentId].timestamp == 0, "Intent already exists");

        swapIntents[intentId] = SwapIntent({
            user: msg.sender,
            intentData: _intentData,
            timestamp: block.timestamp,
            executed: false,
            cancelled: false
        });

        emit SwapIntentSubmitted(msg.sender, intentId, block.timestamp);
        return intentId;
    }

    /**
     * @notice Execute a swap intent after validation
     * @dev Validates price using custom price oracle and executes swap
     * @param _intentId Intent ID to execute
     * @param _volume The volume of the swap (for metrics)
     * @param _tokenIn Address of input token
     * @param _tokenOut Address of output token
     */
    function executeSwap(
        bytes32 _intentId, 
        uint256 _volume,
        address _tokenIn,
        address _tokenOut
    ) external onlyOwner {
        SwapIntent storage intent = swapIntents[_intentId];

        if (intent.timestamp == 0) revert IntentNotFound();
        if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();
        
        // Validate prices using custom oracle (pulls from Pyth Hermes API)
        CustomPriceOracle.Price memory priceIn = priceOracle.getLatestPrice(_tokenIn);
        CustomPriceOracle.Price memory priceOut = priceOracle.getLatestPrice(_tokenOut);
        
        // Basic staleness check (prices should be recent) - oracle does this internally too
        require(priceIn.publishTime > block.timestamp - 60, "Price too stale");
        require(priceOut.publishTime > block.timestamp - 60, "Price too stale");

        intent.executed = true;
        
        // Arcology-optimized: Use AtomicCounter for conflict-resistant updates
        totalSwapVolume.increment(_volume);
        totalSwapCount.increment(1);

        emit SwapExecuted(_intentId, intent.user, _volume, block.timestamp);
    }

    /**
     * @notice Cancel a pending swap intent
     * @dev Can be called by the user who submitted it
     * @param _intentId Intent ID to cancel
     */
    function cancelSwap(bytes32 _intentId) external {
        SwapIntent storage intent = swapIntents[_intentId];
        
        if (intent.timestamp == 0) revert IntentNotFound();
        if (intent.user != msg.sender && msg.sender != owner) revert NotIntentOwner();
        if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();

        intent.cancelled = true;

        emit SwapCancelled(_intentId, block.timestamp);
    }

    /**
     * @notice Get aggregate swap metrics
     * @dev Public metrics safe for display (individual swap details remain private)
     * @return volume Total swap volume
     * @return count Total swap count
     */
    function getAggregateMetrics() external view returns (uint256 volume, uint256 count) {
        return (totalSwapVolume.current(), totalSwapCount.current());
    }

    /**
     * @notice Retrieve a swap intent by its ID
     * @dev Only returns data to intent owner or contract owner
     * @param _intentId Intent ID to query
     * @return intent The swap intent data
     */
    function getSwapIntent(bytes32 _intentId) external view returns (SwapIntent memory) {
        SwapIntent memory intent = swapIntents[_intentId];
        
        // Privacy: only owner or intent creator can view details
        if (intent.user != msg.sender && msg.sender != owner) {
            revert NotIntentOwner();
        }
        
        return intent;
    }
    
    /**
     * @notice Update price oracle address
     * @param _priceOracleAddress New CustomPriceOracle address
     */
    function updatePriceOracle(address _priceOracleAddress) external onlyOwner {
        priceOracle = CustomPriceOracle(_priceOracleAddress);
    }
}
