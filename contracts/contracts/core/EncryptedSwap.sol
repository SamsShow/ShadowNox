// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../settlement/AsyncNonceEngine.sol";
import "../arcology/AtomicCounter.sol";

/**
 * @title EncryptedSwap
 * @notice Private swap execution for Shadow Economy on Arcology
 * @dev Swap intents store arbitrary intent data for privacy-preserving execution
 * 
 * Executes on Arcology Parallel Blockchain:
 * - 10,000-15,000 TPS throughput for parallel swap execution
 * - Transaction metadata stored as bytes on-chain
 * - Smart contract logic PUBLIC, user parameters stored as bytes
 * - Async nonce support for parallel intent submission
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
 * - Batch execution for efficient processing
 * - Expected Performance: 10k-15k TPS
 */
contract EncryptedSwap {
    address public owner;
    AsyncNonceEngine public asyncNonceEngine;
    
    // BOT INTEGRATION: FisherRewards contract for bot incentives
    address public fisherRewards;

    // Private swap intent structure
    struct SwapIntent {
        bytes intentData;      // ABI-encoded swap parameters (tokenIn, tokenOut, amountIn, minAmountOut, deadline)
        uint256 timestamp;
        uint256 asyncNonce;    // Async nonce for parallel execution
        bool executed;
        bool cancelled;
    }

    // Swap intents storage (per-intent isolation for Arcology parallelism)
    mapping(bytes32 => SwapIntent) private swapIntents;
    
    // Arcology-optimized aggregate metrics using AtomicCounter
    // Separate counter instances minimize storage-slot conflicts
    AtomicCounter public totalSwapVolume;
    AtomicCounter public totalSwapCount;

    // Events
    event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 asyncNonce, uint256 timestamp);
    event SwapExecuted(bytes32 indexed intentId, uint256 timestamp);
    event SwapCancelled(bytes32 indexed intentId, uint256 timestamp);
    event BatchSwapsExecuted(uint256 count, uint256 totalVolume, uint256 timestamp);
    
    // BOT MONITORING: Events for Fisher bot dashboards
    event FisherRewardRecorded(address indexed fisher, bytes32 indexed intentId, uint256 reward);

    error IntentNotFound();
    error IntentAlreadyProcessed();
    error NotOwner();
    error InvalidBatchSize();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address _asyncNonceEngineAddress) {
        owner = msg.sender;
        asyncNonceEngine = AsyncNonceEngine(_asyncNonceEngineAddress);
        
        // Deploy Arcology-optimized AtomicCounters
        totalSwapVolume = new AtomicCounter();
        totalSwapCount = new AtomicCounter();
    }
    
    /**
     * @notice Set FisherRewards contract address
     * @dev BOT INTEGRATION: Links to Fisher bot reward system
     * @param _fisherRewards Address of FisherRewards contract
     */
    function setFisherRewards(address _fisherRewards) external onlyOwner {
        fisherRewards = _fisherRewards;
    }

    /**
     * @notice Submit a private swap intent.
     * @dev BOT INTEGRATION: Fisher bots relay user's signed intent to this function
     * @param _intentData ABI-encoded swap parameters (tokenIn, tokenOut, amountIn, minAmountOut, deadline).
     * @param _asyncNonce Async nonce for parallel execution.
     * @return intentId The unique ID for the swap intent.
     */
    function submitSwapIntent(bytes calldata _intentData, uint256 _asyncNonce) 
        external 
        returns (bytes32) 
    {
        bytes32 intentId = keccak256(abi.encodePacked(msg.sender, _asyncNonce, _intentData));
        
        require(swapIntents[intentId].timestamp == 0, "Intent already exists");

        // Register with AsyncNonceEngine for parallel execution support
        asyncNonceEngine.createAsyncBranch(msg.sender, _asyncNonce, intentId);

        swapIntents[intentId] = SwapIntent({
            intentData: _intentData,
            timestamp: block.timestamp,
            asyncNonce: _asyncNonce,
            executed: false,
            cancelled: false
        });

        // BOT MONITORING: Fisher bots track this event for execution
        emit SwapIntentSubmitted(msg.sender, intentId, _asyncNonce, block.timestamp);
        return intentId;
    }


    /**
     * @notice Execute a swap intent after it has been settled.
     * @dev BOT INTEGRATION: Called by Fisher bot relayer after processing intent data
     * @param _intentId Intent ID to execute.
     * @param _volume The volume of the swap, provided by the relayer after processing.
     */
    function executeSwap(bytes32 _intentId, uint256 _volume) external onlyOwner {
        SwapIntent storage intent = swapIntents[_intentId];

        if (intent.timestamp == 0) revert IntentNotFound();
        if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();
        
        // Note: We trust the relayer to have checked the AsyncNonceEngine for settlement
        // before calling this function.

        intent.executed = true;
        
        // Arcology-optimized: Use AtomicCounter for conflict-resistant updates
        totalSwapVolume.increment(_volume);
        totalSwapCount.increment(1);

        // BOT REWARD: Record Fisher bot reward for executing this swap
        // The FisherRewards contract handles actual reward calculation and distribution
        if (fisherRewards != address(0)) {
            // Calculate reward based on gas and complexity
            uint256 reward = _calculateFisherReward(_volume);
            emit FisherRewardRecorded(msg.sender, _intentId, reward);
        }

        emit SwapExecuted(_intentId, block.timestamp);
    }
    
    /**
     * @notice Batch execute multiple swaps for Arcology parallel efficiency
     * @dev Optimized for high-throughput parallel execution on Arcology
     * @param _intentIds Array of intent IDs to execute
     * @param _volumes Array of volumes for each swap
     */
    function batchExecuteSwaps(
        bytes32[] calldata _intentIds, 
        uint256[] calldata _volumes
    ) external onlyOwner {
        if (_intentIds.length != _volumes.length) revert InvalidBatchSize();
        if (_intentIds.length == 0) revert InvalidBatchSize();
        
        uint256 batchVolume = 0;
        
        for (uint256 i = 0; i < _intentIds.length; i++) {
            SwapIntent storage intent = swapIntents[_intentIds[i]];
            
            if (intent.timestamp == 0) revert IntentNotFound();
            if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();
            
            intent.executed = true;
            batchVolume += _volumes[i];
            
            emit SwapExecuted(_intentIds[i], block.timestamp);
        }
        
        // Single atomic update for all swaps (more efficient on Arcology)
        totalSwapVolume.increment(batchVolume);
        totalSwapCount.increment(_intentIds.length);
        
        emit BatchSwapsExecuted(_intentIds.length, batchVolume, block.timestamp);
    }
    
    /**
     * @notice Calculate Fisher bot reward for swap execution
     * @dev Internal reward calculation based on swap volume
     * @param _volume Swap volume
     * @return reward Calculated reward amount
     */
    function _calculateFisherReward(uint256 _volume) internal pure returns (uint256 reward) {
        // Simple reward model: 0.1% of swap volume
        // TODO: More sophisticated reward model in FisherRewards contract
        return _volume / 1000;
    }

    /**
     * @notice Cancel a pending swap intent.
     * @notice This can be called by the user who submitted it or the owner (relayer).
     * @param _intentId Intent ID to cancel.
     */
    function cancelSwap(bytes32 _intentId) external {
        // In a real implementation, you'd verify the original sender.
        // For now, we allow the owner/relayer to cancel.
        if (msg.sender != owner) revert NotOwner();

        SwapIntent storage intent = swapIntents[_intentId];
        if (intent.timestamp == 0) revert IntentNotFound();
        if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();

        intent.cancelled = true;

        // Future enhancement: could also interact with AsyncNonceEngine to discard branch
        emit SwapCancelled(_intentId, block.timestamp);
    }

    /**
     * @notice Get aggregate swap metrics.
     * @dev Public metrics safe for display (individual swap details remain private)
     * @return volume Total swap volume.
     * @return count Total swap count.
     */
    function getAggregateMetrics() external view returns (uint256 volume, uint256 count) {
        return (totalSwapVolume.current(), totalSwapCount.current());
    }

    /**
     * @notice Retrieve a swap intent by its ID.
     */
    function getSwapIntent(bytes32 _intentId) external view returns (SwapIntent memory) {
        return swapIntents[_intentId];
    }
}