# Arcology Integration - Transaction Batch Benchmarking

This directory contains the complete benchmarking system for testing Shadow Economy smart contracts on Arcology's parallel blockchain.

## 🎯 Goal

Achieve **10,000-15,000 TPS** on Arcology through parallel transaction execution.

## 📁 Files

### Core Components

- **`batchGenerator.js`** - Transaction batch generation engine
  - Supports 7 transaction types
  - 5 batch patterns for different parallelism scenarios
  - Test user generation
  - Parallelism analysis tools

- **`benchmarkExecutor.js`** - Benchmark execution engine
  - Parallel and sequential execution modes
  - TPS measurement
  - Gas tracking
  - Conflict detection
  - Results export

- **`benchmark-cli.js`** - Command-line interface
  - 5 preset configurations
  - Custom benchmark parameters
  - Comparison mode
  - Batch generation mode

- **`connector.js`** - Arcology blockchain connector
  - Provider initialization
  - Wallet management
  - Contract instances
  - Async nonce support

- **`parallelMonitor.js`** - Real-time monitoring
  - TPS tracking
  - Concurrent transaction count
  - Conflict rate monitoring

### Supporting Files

- **`examples.js`** - 7 example scenarios
- **`../../__tests__/arcology-benchmark.test.js`** - Integration tests

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run a Quick Test

```bash
npm run benchmark:quick
```

### 3. Run High Throughput Test

```bash
npm run benchmark:high
```

## 📊 Available Commands

### NPM Scripts

```bash
npm run benchmark:quick        # 100 tx, 10 users
npm run benchmark:moderate     # 1K tx, 50 users  
npm run benchmark:high         # 10K tx, 100 users (TPS target test)
npm run benchmark:stress       # 15K tx, 200 users
npm run benchmark:compare      # Compare parallel vs sequential
npm run benchmark:generate     # Generate batch without executing
npm run benchmark:presets      # List all available presets
```

### CLI Usage

```bash
# Custom benchmark
node src/arcology/benchmark-cli.js run \
  --transactions 5000 \
  --users 100 \
  --pattern user_isolated \
  --type mixed

# Compare execution modes  
node src/arcology/benchmark-cli.js compare \
  --transactions 1000 \
  --users 50

# Generate batch only
node src/arcology/benchmark-cli.js generate \
  --output my-batch.json
```

## 🎯 Transaction Types

| Type | Description | Parallelism |
|------|-------------|-------------|
| `swap` | Encrypted swap intents | Moderate |
| `async` | Async nonce transactions | **High** ⭐ |
| `lending` | Lending deposits/borrows | Moderate |
| `vault` | Vault deposits/withdrawals | **High** ⭐ |
| `mixed` | Mix of all types | Moderate |

## 📐 Batch Patterns

### user_isolated ⭐ (Recommended)
- Maximum parallelism
- Each user independent
- **Best for 10K-15K TPS**

### independent
- All transactions independent
- High parallelism

### sequential
- Strict ordering
- Baseline for comparisons

### mixed
- Realistic workload
- Some dependencies

### high_contention
- Intentional conflicts
- Stress testing

## 📈 Presets

| Name | Transactions | Users | Purpose |
|------|-------------|-------|---------|
| `quick` | 100 | 10 | Quick validation |
| `moderate` | 1,000 | 50 | Standard testing |
| `high-throughput` | 10,000 | 100 | **TPS validation** ⭐ |
| `stress` | 15,000 | 200 | Stress testing |
| `conflict` | 1,000 | 10 | Conflict testing |

## 📊 Metrics Tracked

### Performance
- ⚡ **TPS** (Transactions Per Second)
- ⏱️ Submission time
- ⏱️ Confirmation time
- 📊 Average time per transaction

### Concurrency
- 🔄 Conflict detection count
- 🔁 Retry count
- 📉 Conflict rate percentage

### Gas
- ⛽ Total gas used
- 📊 Average gas per transaction
- 💰 Cost estimates

## 🎓 Usage Examples

### Example 1: Quick Test
```bash
npm run benchmark:quick
```

### Example 2: Custom High-Throughput
```bash
node src/arcology/benchmark-cli.js run \
  --transactions 15000 \
  --users 200 \
  --pattern user_isolated \
  --type async \
  --export results.json
```

### Example 3: Compare Modes
```bash
npm run benchmark:compare -- \
  --transactions 500 \
  --users 25
```

### Example 4: Generate Batch for Later
```bash
npm run benchmark:generate -- \
  --transactions 10000 \
  --users 100 \
  --output batches/test-batch-$(date +%Y%m%d).json
```

## 🧪 Testing

Run integration tests:

```bash
npm test -- __tests__/arcology-benchmark.test.js
```

## 📖 Documentation

Full documentation available at:
- [Arcology Benchmark Guide](../../../docs/ARCOLOGY_BENCHMARK.md)
- [Concurrent Library Patterns](../../../contracts/arcology/ConcurrentLibrary.md)

## ⚙️ Configuration

Edit `bots/config/arcology.config.js`:

```javascript
export const arcologyConfig = {
  rpcUrl: 'https://testnet.arcology.network',
  chainId: 118,
  contracts: {
    encryptedSwap: '0x...',
    asyncNonceEngine: '0x...',
  },
  parallelExecutionEnabled: true,
  optimisticConcurrency: true
};
```

## 🎯 Performance Targets

### Optimal Scenario
```
✅ Achieved TPS:      12,500
   Target TPS:        10,000-15,000
   Target Reached:    YES
   
   Conflict Rate:     0.1%
   Avg Time per Tx:   0.8ms
```

### When to Use Each Pattern

**Use `user_isolated`** when:
- Testing maximum TPS
- Each user operates independently
- Target: 10K-15K TPS ✅

**Use `independent`** when:
- Testing general parallelism
- No user dependencies

**Use `mixed`** when:
- Simulating realistic load
- Mixture of transaction types

**Use `sequential`** when:
- Establishing baseline
- Comparing parallel performance

**Use `high_contention`** when:
- Stress testing
- Testing conflict resolution

## 🔧 Troubleshooting

### Low TPS
1. Increase user count (`--users 200`)
2. Use `user_isolated` pattern
3. Use `async` transaction type
4. Check network conditions

### High Conflicts
1. Switch to `user_isolated` pattern
2. Increase unique users
3. Avoid `high_contention` pattern

### Connection Issues
1. Check `ARCOLOGY_RPC_URL` in `.env`
2. Verify Arcology node is running
3. Validate contract addresses

## 📝 TODO

- [ ] Implement conflict detection from events
- [ ] Add real-time TPS monitoring
- [ ] Integrate with parallel monitor
- [ ] Add more transaction types (borrow, withdraw, etc.)
- [ ] Performance profiling tools
- [ ] CI/CD integration examples

## 🤝 Contributing

When adding new features:

1. **New transaction types**: Update `TransactionType` enum and generator methods
2. **New patterns**: Add to `BatchPattern` enum and `selectUser` logic
3. **New metrics**: Extend `calculateMetrics` in executor
4. **Always add tests**: Update `__tests__/arcology-benchmark.test.js`

## 📚 References

- [Arcology Network](https://arcology.network)
- [Arcology Documentation](https://arcology.network/docs)
- [Shadow Economy Architecture](../../../docs/architecture.md)

---

**Built for Shadow Economy · Targeting 10,000-15,000 TPS on Arcology ⚡**
