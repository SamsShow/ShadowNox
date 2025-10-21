# Shadow Economy CLI Tester

A powerful command-line interface for testing Shadow Economy smart contracts with real on-chain interactions. No mocks, no simulations - just real blockchain testing.

## Features

✅ **EncryptedSwap Operations**
- Submit swap intents with encrypted parameters
- Execute swaps with Pyth oracle price updates
- Cancel pending swaps
- View swap intent details and statistics

✅ **SimpleLending Operations**
- Deposit and withdraw funds
- Borrow against collateral
- Repay loans
- Manage collateral
- View account details and protocol statistics

✅ **PythAdapter Operations**
- Set Pyth price feed IDs for tokens
- Update aggregate metrics with price data
- Query token metrics and prices
- Real Pyth Network integration

✅ **Utilities**
- Check wallet balance
- View account and network information
- Monitor gas prices
- Test blockchain connections

## Installation

### Prerequisites

- Node.js v18 or higher
- A running Ethereum-compatible node (Hardhat, Ganache, or live network)
- Deployed Shadow Economy contracts

### Setup

1. Clone the repository and navigate to the CLI directory:
```bash
cd cli
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=118
PRIVATE_KEY=your_private_key_here
```

⚠️ **Security Warning**: Never commit your `.env` file with real private keys!

## Usage

### Interactive Mode (Recommended)

Start the interactive CLI menu:
```bash
npm start
```

Or:
```bash
node src/index.js
```

The interactive mode provides a user-friendly menu system to navigate through all available operations.

### Command-Line Mode

Use specific commands directly:

#### EncryptedSwap Commands

```bash
# Submit a new swap intent
node src/index.js swap:submit

# Execute a swap by intent ID
node src/index.js swap:execute 0x123...

# Cancel a swap
node src/index.js swap:cancel 0x123...

# Get swap intent details
node src/index.js swap:get 0x123...

# View swap statistics
node src/index.js swap:stats
```

#### SimpleLending Commands

```bash
# Deposit funds
node src/index.js lending:deposit

# Withdraw funds
node src/index.js lending:withdraw

# Add collateral
node src/index.js lending:add-collateral

# Borrow funds
node src/index.js lending:borrow

# Repay loan
node src/index.js lending:repay

# View account details
node src/index.js lending:account

# View lending statistics
node src/index.js lending:stats
```

#### Oracle Commands

```bash
# Set Pyth price feed ID
node src/index.js oracle:set-price-id

# Update aggregate metrics
node src/index.js oracle:update-metrics

# Get token metrics
node src/index.js oracle:get-metrics 0x...

# Get current price
node src/index.js oracle:get-price 0x...
```

#### Utility Commands

```bash
# Check wallet balance
node src/index.js account:balance

# View account information
node src/index.js account:info

# View network information
node src/index.js network:info
```

## Configuration

### Contract Addresses

Contract addresses are configured in `src/utils/blockchain.js`:

```javascript
const CONTRACTS = {
  EncryptedSwap: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  SimpleLending: '0x0000000000000000000000000000000000000000',
  PythAdapter: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  // ... other contracts
};
```

Update these addresses after deploying your contracts.

### Network Configuration

The CLI supports any Ethereum-compatible network. Common configurations:

**Hardhat Local Node:**
```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=118
```

**Arcology DevNet:**
```env
RPC_URL=http://localhost:8545
CHAIN_ID=1234
```

**Arcology Testnet:**
```env
RPC_URL=https://testnet-rpc.arcology.network
CHAIN_ID=4321
```

## Testing Workflow

### 1. Test Encrypted Swap

```bash
# Start the CLI
npm start

# Select: EncryptedSwap Operations > Submit Swap Intent
# Fill in the swap parameters:
- Token In: 0x0000000000000000000000000000000000000001
- Token Out: 0x0000000000000000000000000000000000000002
- Amount In: 1.0
- Min Amount Out: 0.95
- Deadline: 3600

# Note the Intent ID from the transaction

# Execute the swap
# Select: EncryptedSwap Operations > Execute Swap
# Enter the Intent ID

# Check statistics
# Select: EncryptedSwap Operations > View Stats
```

### 2. Test Lending Protocol

```bash
# Deposit funds
# Select: Lending Operations > Deposit
# Amount: 10.0 ETH

# Add collateral
# Select: Lending Operations > Add Collateral
# Amount: 5.0 ETH
# Token: 0x0000000000000000000000000000000000000001

# Borrow against collateral
# Select: Lending Operations > Borrow
# Amount: 3.0 ETH

# View account
# Select: Lending Operations > View Account

# Repay loan
# Select: Lending Operations > Repay
# Amount: 1.0 ETH
```

### 3. Test Oracle Integration

```bash
# Set price feed ID
# Select: Oracle Operations > Set Price ID
# Token: 0x0000000000000000000000000000000000000001
# Price ID: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace

# Update metrics
# Select: Oracle Operations > Update Metrics
# Fill in the parameters

# Check metrics
# Select: Oracle Operations > Get Metrics
```

## Project Structure

```
cli/
├── package.json              # Dependencies and scripts
├── .env.example             # Environment template
├── README.md                # This file
└── src/
    ├── index.js             # Main entry point
    ├── commands/            # Command implementations
    │   ├── encryptedSwap.js # Swap operations
    │   ├── lending.js       # Lending operations
    │   ├── pythAdapter.js   # Oracle operations
    │   └── utils.js         # Utility commands
    └── utils/               # Helper utilities
        ├── blockchain.js    # Blockchain interactions
        └── display.js       # Console output formatting
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to blockchain node
```bash
# Test connection
node src/index.js network:info
```

**Solution**: Verify your RPC_URL is correct and the node is running.

### Transaction Failures

**Problem**: Transaction reverts or fails
- Check you have sufficient ETH balance
- Verify contract addresses are correct
- Ensure you're connected to the right network

### ABI Not Found

**Problem**: Contract ABI cannot be loaded
- Ensure contracts are compiled: `cd ../contracts && npm run compile`
- Verify artifact paths in `src/utils/blockchain.js`

### Private Key Issues

**Problem**: Invalid private key error
- Ensure PRIVATE_KEY in `.env` is valid
- Private key should be without "0x" prefix
- Never use production keys for testing

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use test accounts only** - Never use real funds
3. **Rotate keys regularly** - Especially on shared networks
4. **Verify contract addresses** - Double-check before transactions
5. **Test on local networks first** - Before using testnets

## Advanced Usage

### Custom Network Configuration

To add support for a new network:

1. Update `NETWORK_CONFIG` in `src/utils/blockchain.js`
2. Set appropriate RPC_URL and CHAIN_ID in `.env`
3. Update contract addresses if deployed to new network

### Extending Commands

To add new commands:

1. Create a new command file in `src/commands/`
2. Implement command functions
3. Export command object
4. Import and register in `src/index.js`

### Integration with CI/CD

Use the CLI in automated testing:

```bash
# Example: Test swap submission in CI
node src/index.js swap:submit << EOF
0x0000000000000000000000000000000000000001
0x0000000000000000000000000000000000000002
1.0
0.95
3600
EOF
```

## Support

For issues, questions, or contributions:
- GitHub Issues: [ShadowNox Repository]
- Documentation: `/docs` directory in the main repository

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for Shadow Economy on Arcology Blockchain**
