# Arcology Concurrent Library - Parallel Execution Patterns

## Overview

Arcology's Concurrent Library provides language-specific APIs for writing parallel smart contracts. Shadow Economy contracts can leverage these patterns for optimal 10k-15k TPS execution on Arcology.

## Key Concepts

### Optimistic Concurrency Control
- Arcology executes transactions in parallel by default
- Detects conflicts at storage-slot level
- Automatically retries conflicting transactions
- No manual locking required in most cases

### Storage-Slot Level Conflict Detection
- Each storage variable tracked independently
- Conflicts only when same slot accessed by concurrent txs
- Minimize conflicts by reducing shared state

### Multiple EVM Instances
- Arcology runs multiple EVM containers simultaneously
- Transactions distributed across instances
- Results merged after execution

## Parallel Execution Patterns for Shadow Economy

### 1. Async Nonce Engine (Low Contention)

**Pattern**: Independent nonce branches per user

```solidity
// ✅ GOOD: Low contention - each user has separate storage slots
mapping(address => mapping(uint256 => AsyncTransaction)) private asyncTransactions;
mapping(address => uint256[]) private activeNonces;
mapping(address => uint256) private lastSettledNonce;
```

**Why it's parallel-friendly:**
- Different users access different storage slots
- No cross-user dependencies
- Arcology can execute multiple users' transactions simultaneously

**Expected Performance:** 10k-15k TPS

### 2. Encrypted Swap (Moderate Contention)

**Pattern**: Per-user swap intents with aggregate metrics

```solidity
// ✅ GOOD: User-specific storage
mapping(bytes32 => SwapIntent) private swapIntents; // intentId => intent

// ⚠️ CAUTION: Global counter (potential conflict point)
uint256 public totalSwapVolume;
uint256 public totalSwapCount;
```

**Optimization Strategy:**
- Most swaps execute in parallel (different intentIds)
- Aggregate updates batched periodically to reduce conflicts
- Consider using Arcology's atomic increment for counters

**Expected Performance:** 5k-10k TPS (limited by aggregate updates)

### 3. Shadow Vault (High Parallelism)

**Pattern**: Completely isolated per-user storage

```solidity
// ✅ EXCELLENT: Zero cross-user conflicts
mapping(address => mapping(uint256 => EncryptedPosition)) private positions;
mapping(address => uint256) private positionCounts;
```

**Why it's optimal:**
- Each user's positions stored separately
- No shared state across users
- Perfect for parallel execution

**Expected Performance:** 10k-15k TPS

## Future: Advanced Concurrent Patterns

### Concurrent Library APIs (To Be Implemented)

```solidity
// Example: Arcology Concurrent Library usage (pseudo-code)
import "arcology/concurrent/AtomicCounter.sol";
import "arcology/concurrent/ConcurrentMap.sol";

contract OptimizedEncryptedSwap {
    // Use atomic counter to minimize conflicts
    AtomicCounter public totalSwapVolume;
    
    // Concurrent map for lock-free access
    ConcurrentMap<bytes32, SwapIntent> public swapIntents;
    
    function executeSwap(...) external {
        // Atomic increment (no lock required)
        totalSwapVolume.increment(volume);
    }
}
```

### Conflict Reduction Strategies

1. **Minimize Shared State**
   - Use per-user storage mappings
   - Avoid global counters when possible
   - Batch aggregate updates

2. **Use Arcology-Specific Types**
   - `AtomicCounter` for concurrent increments
   - `ConcurrentMap` for lock-free maps
   - `ParallelArray` for concurrent array access

3. **Transaction Design**
   - Keep transactions independent
   - Avoid cross-user dependencies
   - Use async nonces for parallel submission

## Performance Benchmarking

### Benchmark Script (To Be Implemented)

See `contracts/scripts/benchmark-parallel.sh` for:
- Submit 10,000 concurrent transactions
- Measure TPS
- Track conflict rate
- Monitor Arcology optimistic concurrency

### Expected Results

| Contract | Pattern | Expected TPS | Conflict Rate |
|----------|---------|--------------|---------------|
| ShadowVault | Per-user isolated | 10k-15k | <1% |
| AsyncNonceEngine | Per-user branches | 10k-15k | <5% |
| EncryptedSwap | Mixed (user + global) | 5k-10k | <10% |
| PythAdapter | Global aggregate | 1k-5k | <20% |

## Resources

- [Arcology Documentation](https://arcology.network/docs)
- Arcology Concurrent Library API Reference (coming soon)
- Shadow Economy Architecture: `docs/architecture.md`

## Next Steps for Team

1. Review Arcology Concurrent Library documentation when available
2. Implement `AtomicCounter` for `totalSwapVolume` in EncryptedSwap
3. Consider `ConcurrentMap` for high-frequency operations
4. Run parallel execution benchmarks on Arcology DevNet
5. Optimize contracts based on conflict detection metrics

