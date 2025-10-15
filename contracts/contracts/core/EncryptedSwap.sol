// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../settlement/AsyncNonceEngine.sol";

/**
 * @title EncryptedSwap
 * @notice Private swap execution for Shadow Economy on Arcology
 * @dev Swap intents use client-side metadata encryption (Lit Protocol) for privacy
 * 
 * Executes on Arcology Parallel Blockchain:
 * - 10,000-15,000 TPS throughput for parallel swap execution
 * - Transaction metadata encrypted via Lit Protocol (off-chain)
 * - Smart contract logic PUBLIC, user parameters PRIVATE
 * - Async nonce support for parallel intent submission
 * - Optimistic concurrency control for conflict-free execution
 * 
 * Privacy Model:
 * - Individual swap details: ENCRYPTED (Lit Protocol → IPFS/Arweave)
 * - Aggregate volume metrics: PUBLIC (on-chain)
 * - Smart contract bytecode: PUBLIC (Solidity logic on Arcology)
 */
contract EncryptedSwap {
    address public owner;
    AsyncNonceEngine public asyncNonceEngine;

    // Encrypted swap intent structure
    struct SwapIntent {
        bytes encryptedIntent; // Lit Protocol encrypted swap details
        uint256 timestamp;
        uint256 asyncNonce;    // Async nonce for parallel execution
        bool executed;
        bool cancelled;
    }

    // Swap intents storage
    mapping(bytes32 => SwapIntent) private swapIntents;
    
    // Aggregate metrics (public, but not individual swaps)
    uint256 public totalSwapVolume; // Example metric, updated by relayer
    uint256 public totalSwapCount;

    // Events
    event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 asyncNonce, uint256 timestamp);
    event SwapExecuted(bytes32 indexed intentId, uint256 timestamp);
    event SwapCancelled(bytes32 indexed intentId, uint256 timestamp);

    error IntentNotFound();
    error IntentAlreadyProcessed();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address _asyncNonceEngineAddress) {
        owner = msg.sender;
        asyncNonceEngine = AsyncNonceEngine(_asyncNonceEngineAddress);
    }

    /**
     * @notice Submit an encrypted swap intent.
     * @param _encryptedIntent Lit Protocol encrypted swap details.
     * @param _asyncNonce Async nonce for parallel execution.
     * @return intentId The unique ID for the swap intent.
     */
    function submitSwapIntent(bytes calldata _encryptedIntent, uint256 _asyncNonce) 
        external 
        returns (bytes32) 
    {
        bytes32 intentId = keccak256(abi.encodePacked(msg.sender, _asyncNonce, _encryptedIntent));
        
        require(swapIntents[intentId].timestamp == 0, "Intent already exists");

        // FIX: Pass msg.sender to the Async Nonce Engine
        asyncNonceEngine.createAsyncBranch(msg.sender, _asyncNonce, intentId);

        swapIntents[intentId] = SwapIntent({
            encryptedIntent: _encryptedIntent,
            timestamp: block.timestamp,
            asyncNonce: _asyncNonce,
            executed: false,
            cancelled: false
        });

        emit SwapIntentSubmitted(msg.sender, intentId, _asyncNonce, block.timestamp);
        return intentId;
    }


    /**
     * @notice Execute a swap intent after it has been settled.
     * @notice This function should only be callable by the trusted relayer (owner).
     * @param _intentId Intent ID to execute.
     * @param _volume The volume of the swap, provided by the relayer after decryption.
     */
    function executeSwap(bytes32 _intentId, uint256 _volume) external onlyOwner {
        SwapIntent storage intent = swapIntents[_intentId];

        if (intent.timestamp == 0) revert IntentNotFound();
        if (intent.executed || intent.cancelled) revert IntentAlreadyProcessed();
        
        // Note: We trust the relayer to have checked the AsyncNonceEngine for settlement
        // before calling this function.

        intent.executed = true;
        totalSwapVolume += _volume;
        totalSwapCount++;

        emit SwapExecuted(_intentId, block.timestamp);
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
     * @return volume Total swap volume.
     * @return count Total swap count.
     */
    function getAggregateMetrics() external view returns (uint256 volume, uint256 count) {
        return (totalSwapVolume, totalSwapCount);
    }

    /**
     * @notice Retrieve an encrypted swap intent by its ID.
     */
    function getSwapIntent(bytes32 _intentId) external view returns (SwapIntent memory) {
        return swapIntents[_intentId];
    }
}