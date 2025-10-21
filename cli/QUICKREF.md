# Shadow Economy CLI - Quick Reference

## Installation & Setup

```bash
cd cli
./setup.sh                    # Run setup script
nano .env                     # Configure environment
npm start                     # Launch CLI
```

## Quick Commands

### Start Interactive Mode
```bash
npm start
# or
node src/index.js
```

### EncryptedSwap
```bash
# Submit swap intent
node src/index.js swap:submit

# Execute swap
node src/index.js swap:execute <intentId>

# Cancel swap
node src/index.js swap:cancel <intentId>

# Get swap details
node src/index.js swap:get <intentId>

# View statistics
node src/index.js swap:stats
```

### SimpleLending
```bash
# Deposit
node src/index.js lending:deposit

# Withdraw
node src/index.js lending:withdraw

# Add collateral
node src/index.js lending:add-collateral

# Borrow
node src/index.js lending:borrow

# Repay
node src/index.js lending:repay

# View account
node src/index.js lending:account

# View statistics
node src/index.js lending:stats
```

### Oracle (PythAdapter)
```bash
# Set price feed ID
node src/index.js oracle:set-price-id

# Update metrics
node src/index.js oracle:update-metrics

# Get metrics
node src/index.js oracle:get-metrics <tokenAddress>

# Get price
node src/index.js oracle:get-price <tokenAddress>
```

### Utilities
```bash
# Check balance
node src/index.js account:balance

# Account info
node src/index.js account:info

# Network info
node src/index.js network:info
```

## Environment Variables

```bash
# Required
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=118
PRIVATE_KEY=your_private_key_here

# Optional (if different from defaults)
ENCRYPTED_SWAP_ADDRESS=0x...
PYTH_ADAPTER_ADDRESS=0x...
SIMPLE_LENDING_ADDRESS=0x...
```

## Common Test Addresses

```bash
# Test tokens
TOKEN_IN=0x0000000000000000000000000000000000000001
TOKEN_OUT=0x0000000000000000000000000000000000000002

# Pyth Price Feed IDs (examples)
ETH_USD=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
BTC_USD=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
USDC_USD=0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
```

## Pre-Flight Checklist

- [ ] Hardhat node running (`npx hardhat node`)
- [ ] Contracts deployed (`npm run deploy`)
- [ ] .env configured with PRIVATE_KEY
- [ ] Wallet has sufficient ETH
- [ ] RPC_URL accessible
- [ ] Contract addresses updated in blockchain.js

## Quick Test Flow

```bash
# 1. Verify setup
node src/index.js network:info
node src/index.js account:balance

# 2. Test EncryptedSwap
node src/index.js swap:submit
# Note the Intent ID
node src/index.js swap:execute <intentId>
node src/index.js swap:stats

# 3. Test Lending
node src/index.js lending:deposit
node src/index.js lending:account
node src/index.js lending:stats
```

## Troubleshooting Quick Fixes

### Cannot Connect
```bash
# Check node is running
lsof -i :8545

# Restart Hardhat node
cd ../contracts && npx hardhat node
```

### Insufficient Funds
```bash
# Check balance
node src/index.js account:balance

# Use funded Hardhat account (update .env)
```

### Contract Not Found
```bash
# Redeploy contracts
cd ../contracts
npm run deploy

# Update addresses in src/utils/blockchain.js
```

### Transaction Fails
```bash
# Check contract state first
node src/index.js lending:account
node src/index.js swap:get <intentId>

# Review error message
# Verify parameters are valid
```

## Useful npm Scripts

```bash
npm start              # Start interactive CLI
npm install           # Install dependencies
```

## File Locations

```
cli/
├── .env                      # Your configuration (DO NOT COMMIT)
├── .env.example             # Configuration template
├── README.md                # Full documentation
├── TESTING_GUIDE.md        # Detailed test scenarios
├── QUICKREF.md             # This file
├── package.json            # Dependencies
└── src/
    ├── index.js            # Main entry point
    ├── commands/           # Command implementations
    └── utils/              # Helper functions
```

## Getting Help

1. Read `README.md` for detailed documentation
2. Check `TESTING_GUIDE.md` for test scenarios
3. Review error messages carefully
4. Check Hardhat node console for details
5. Verify .env configuration

## Tips & Best Practices

✅ **DO:**
- Test on local network first
- Start with small amounts
- Verify each step
- Keep track of transaction hashes
- Check statistics after operations

❌ **DON'T:**
- Commit .env file
- Use production keys for testing
- Skip verification steps
- Ignore error messages

## Support

- GitHub: ShadowNox Repository
- Docs: `/docs` directory
- Contracts: `/contracts` directory

---

**Quick. Simple. Powerful. 🚀**
