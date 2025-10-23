# 🚀 Arcology Benchmark - Quick Reference

## One-Line Commands

```bash
# Quick test (100 transactions)
npm run benchmark:quick

# High throughput test (10,000 tx - TPS target)
npm run benchmark:high

# Compare parallel vs sequential
npm run benchmark:compare

# Generate batch only
npm run benchmark:generate
```

## Custom Benchmarks

```bash
# Using NPM
npm run benchmark:arcology -- --transactions 5000 --users 100

# Using CLI
node src/arcology/benchmark-cli.js run --transactions 5000 --users 100 --type async

# Using Bash
./contracts/scripts/benchmark-parallel.sh --transactions 5000 --users 100
```

## Presets Available

- `quick` - 100 tx, 10 users
- `moderate` - 1,000 tx, 50 users  
- `high-throughput` - 10,000 tx, 100 users ⭐
- `stress` - 15,000 tx, 200 users
- `conflict` - 1,000 tx with contention

## Transaction Types

- `swap` - Encrypted swaps
- `async` - Async nonce (optimal) ⭐
- `lending` - Lending operations
- `vault` - Vault operations
- `mixed` - All types

## Batch Patterns

- `user_isolated` - Max parallelism ⭐
- `independent` - High parallelism
- `sequential` - Baseline
- `mixed` - Realistic
- `high_contention` - Stress test

## Export Results

```bash
npm run benchmark:high -- --export results/benchmark-$(date +%Y%m%d-%H%M%S).json
```

## Run Examples

```bash
cd bots
node src/arcology/examples.js
```

## Full Documentation

- Main: `docs/ARCOLOGY_BENCHMARK.md`
- Quick: `bots/src/arcology/README.md`
- Status: `ARCOLOGY_BENCHMARK_IMPLEMENTATION.md`

---
**Target: 10,000-15,000 TPS** ⚡
