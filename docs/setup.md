# Shadow Economy Setup Guide

## Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Recommended Tools
- **VS Code** or similar IDE
- **MetaMask** or compatible Web3 wallet
- **Telegram** account (for bot testing)
- **WhatsApp** account (for bot testing)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shadow-economy
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# This will also install dependencies for all workspaces:
# - contracts
# - bots
# - frontend
```

## Configuration

### Arcology DevNet Setup

1. **Deploy Arcology DevNet** following the [Arcology Quick Start Guide](https://arcology.network/docs)

2. **Note your Arcology RPC URL and Chain ID**
   - Local DevNet: `http://localhost:8545` (Chain ID: 1337)
   - Testnet: Check Arcology documentation for testnet endpoints

3. **Verify EVM Equivalence**
   ```bash
   # Test connection
   curl -X POST http://localhost:8545 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

### Lit Protocol Setup

1. Sign up for Lit Protocol access at [developer.litprotocol.com](https://developer.litprotocol.com/)

2. Obtain your Lit Relay API key (optional for testnet)

3. Choose your Lit Network:
   - **DatilDev**: Development network (recommended for testing)
   - **Datil**: Production network

**Important**: Lit Protocol encrypts **transaction metadata only** (user balances, trade amounts, portfolio positions), NOT smart contract bytecode. Smart contracts execute on Arcology with public logic and private parameters.

### Pyth Network Setup (Pull Oracle via Hermes)

1. **Hermes API Access**: Pyth's Hermes provides price feeds via REST API
   - Hermes Endpoint: `https://hermes.pyth.network`
   - No API key required for testnet

2. **Price Feed IDs**: Find price feed IDs at [pyth.network/developers/price-feed-ids](https://pyth.network/developers/price-feed-ids)
   - ETH/USD: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
   - BTC/USD: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
   - USDC/USD: `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a`

3. **Configure Pull Method**: 
   - Fetch from Hermes API
   - Call `updatePriceFeeds()` on-chain in Arcology
   - Consume prices in Shadow Economy contracts

### EVVM Fisher Bot Configuration

1. **EVVM Fisher Network**: EVVM provides Fisher/Relayer bots for gasless transaction execution

2. **EIP-191 Signatures**: Fisher bots construct signed messages to relay transactions to Arcology

3. **Bot Wallet**: Create a dedicated wallet for Fisher bot operations
   ```bash
   # Generate a new private key (save securely!)
   openssl rand -hex 32
   ```

### Bot Configuration

1. **Create Telegram Bot**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command to create a new bot
   - Save the bot token

2. **WhatsApp Setup**
   - No API key needed
   - QR code authentication on first run
   - Session will be saved for subsequent runs

### Environment Variables

Create environment files for each package:

#### Bots Environment (`bots/.env`)

```bash
cp bots/.env.example bots/.env
```

Edit `bots/.env` with your configuration:

```env
# Arcology Configuration (Execution Layer)
ARCOLOGY_RPC_URL=http://localhost:8545
ARCOLOGY_CHAIN_ID=1337

# Lit Protocol (Metadata Encryption Only)
LIT_NETWORK=datil-dev
LIT_RELAY_API_KEY=optional-for-testnet

# Pyth Network (Pull Oracle via Hermes)
PYTH_HERMES_URL=https://hermes.pyth.network

# Telegram
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>

# EVVM Fisher Bot Wallet
BOT_PRIVATE_KEY=<your-private-key>

# Contract Addresses (update after Arcology deployment)
SHADOW_VAULT_ADDRESS=
ENCRYPTED_SWAP_ADDRESS=
ASYNC_NONCE_ENGINE_ADDRESS=
PYTH_ADAPTER_ADDRESS=
```

#### Frontend Environment (`frontend/.env`)

```bash
# Create frontend environment file
cat > frontend/.env << EOF
VITE_ARCOLOGY_RPC_URL=http://localhost:8545
VITE_ARCOLOGY_CHAIN_ID=1337
EOF
```

## Smart Contracts

### Compile Contracts

```bash
cd contracts
npm run compile
```

### Deploy Contracts to Arcology

1. Update `contracts/hardhat.config.js` with Arcology network configuration:

```javascript
networks: {
  arcology: {
    url: process.env.ARCOLOGY_RPC_URL || "http://localhost:8545",
    chainId: parseInt(process.env.ARCOLOGY_CHAIN_ID || "1337"),
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}
```

2. Deploy to Arcology DevNet:

```bash
npm run deploy -- --network arcology
```

3. Save the deployed contract addresses

4. Update the contract addresses in `bots/.env`:

```env
SHADOW_VAULT_ADDRESS=0x...
ENCRYPTED_SWAP_ADDRESS=0x...
ASYNC_NONCE_ENGINE_ADDRESS=0x...
PYTH_ADAPTER_ADDRESS=0x...
```

## Running the EVVM Fisher Bots

### Start Bot Services

```bash
cd bots
npm start
```

On first run:
- **WhatsApp**: Scan the QR code with your WhatsApp mobile app
- **Telegram**: Bot will start polling for messages
- **EVVM Fisher**: Bot wallet will relay transactions to Arcology

### Test Bot Commands

#### Telegram
1. Find your bot on Telegram
2. Send `/start` to begin
3. Use `/help` to see available commands
4. Try `/swap 1 ETH USDC` to test a swap intent (executes on Arcology)

#### WhatsApp
1. Send a message to your bot's phone number
2. Use `/help` for commands
3. Commands are the same as Telegram

### How It Works

```
User (/swap 1 ETH USDC)
    → EVVM Fisher Bot constructs EIP-191 signature
    → Lit Protocol encrypts metadata (amount, tokens)
    → Arcology executes swap in parallel at 10k-15k TPS
    → Pyth Hermes updates aggregate volume (individual swap private)
    → Fisher Bot decrypts result
    → User receives confirmation
```

## Running the Frontend

### Start Development Server

```bash
cd frontend
npm run dev
```

The dashboard will open at `http://localhost:3000`

### Configure MetaMask for Arcology

1. Open MetaMask
2. Add Custom Network:
   - **Network Name**: Arcology DevNet
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

### Build for Production

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## Development Workflow

### Project Structure

```
shadow-economy/
├── contracts/         # Smart contracts (deployed on Arcology)
├── bots/              # EVVM Fisher/Relayer bots
├── frontend/          # Web dashboard
└── docs/              # Documentation
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes in small commits (max 500 LOC per commit)

3. Test your changes:
   ```bash
   # Test contracts on Arcology
   cd contracts && npm test
   
   # Test EVVM Fisher bots (manual testing recommended)
   cd bots && npm start
   
   # Test frontend
   cd frontend && npm run dev
   ```

4. Commit with conventional commit messages:
   ```bash
   git commit -m "feat: add parallel swap execution on Arcology"
   git commit -m "fix: resolve async nonce collision in Fisher bot"
   ```

## Testing

### Smart Contract Tests (Arcology Deployment)

```bash
cd contracts
npm test
```

Tests verify:
- Async nonce engine parallel execution
- Encrypted swap metadata handling
- Pyth oracle pull integration
- Arcology optimistic concurrency

### Bot Testing

Bot testing is primarily manual:
1. Start the EVVM Fisher bots
2. Send test commands via Telegram/WhatsApp
3. Monitor console logs for:
   - EIP-191 signature construction
   - Lit Protocol metadata encryption
   - Arcology transaction submission
   - Pyth Hermes API calls
4. Verify Arcology transactions

### Frontend Testing

```bash
cd frontend
npm run dev
```

Manual testing in browser:
- Connect wallet to Arcology
- Test metadata encryption/decryption via Lit Protocol
- Verify Arcology parallel execution metrics
- Test Pyth price feed display

## Troubleshooting

### Common Issues

#### "Arcology connection failed"
- Verify ARCOLOGY_RPC_URL is correct
- Check that Arcology DevNet instance is running
- Confirm network connectivity
- Test with: `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`

#### "Lit Protocol initialization failed"
- Check LIT_NETWORK setting (datil-dev for testing)
- Verify internet connection for Lit nodes
- Remember: Lit encrypts METADATA only (balances, amounts), not contract bytecode

#### "Pyth Hermes API error"
- Verify PYTH_HERMES_URL is correct: `https://hermes.pyth.network`
- Check price feed IDs are valid
- Ensure updatePriceFeeds() has sufficient gas

#### "EVVM Fisher bot signature error"
- Verify BOT_PRIVATE_KEY is set correctly
- Check EIP-191 signature construction
- Ensure wallet has funds for Arcology gas

#### "WhatsApp QR code not showing"
- Clear `bots/sessions/whatsapp` directory
- Restart bot service
- Check console for errors

#### "Telegram bot not responding"
- Verify TELEGRAM_BOT_TOKEN is correct
- Check bot is not running elsewhere
- Review Telegram bot settings with @BotFather

### Getting Help

- Review [Architecture Documentation](./architecture.md)
- Check [API Reference](./api-reference.md)
- Review code comments in source files
- Check Arcology documentation at [arcology.network](https://arcology.network/)
- EVVM Fisher documentation
- Pyth Hermes API docs

## Next Steps

1. **Deploy to Arcology DevNet**
   - Run deployment script
   - Verify parallel execution (10k-15k TPS)
   - Test async nonce branches

2. **Configure EVVM Fisher Bots**
   - Implement EIP-191 signature construction
   - Set up Fisher reward tracking
   - Test async/sync nonce patterns

3. **Integrate Lit Protocol**
   - Configure metadata-only encryption
   - Set up IPFS/Arweave storage
   - Test access control conditions

4. **Connect Pyth Hermes**
   - Implement pull oracle flow
   - Test updatePriceFeeds() on Arcology
   - Verify aggregate privacy metrics

5. **Enhance Frontend**
   - Add Arcology wallet connection
   - Implement portfolio decryption
   - Build parallel transaction monitoring UI
   - Display Pyth aggregate metrics

## Security Checklist

Before deploying to production:

- [ ] All private keys stored securely (never commit to git)
- [ ] Environment variables never committed to git
- [ ] Smart contracts audited for Arcology parallel execution
- [ ] Rate limiting implemented on EVVM Fisher bots
- [ ] Lit Protocol access control conditions tested (metadata only)
- [ ] Encryption/decryption flows validated
- [ ] Arcology network security configured
- [ ] EVVM Fisher bot authentication mechanisms in place
- [ ] Pyth Hermes API calls validated
- [ ] Async nonce collision handling tested

## Performance Benchmarking

### Arcology Parallel Execution Test

```bash
cd contracts
./scripts/benchmark-parallel.sh --transactions 10000 --parallel true
```

Expected Results:
- TPS: >10,000
- Conflict Rate: <5% (via optimistic concurrency control)
- Average Confirmation: <2 seconds

### Pyth Oracle Pull Test

```bash
cd bots
node src/oracle/pythHermes.js --test
```

Expected Results:
- Hermes API Latency: <500ms
- On-chain Update Cost: <$0.01
- Aggregate Privacy: Individual positions hidden
