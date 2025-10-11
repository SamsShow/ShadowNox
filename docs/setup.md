# Shadow Nox Setup Guide

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

### EVVM Setup

1. Deploy your EVVM virtual blockchain following the [EVVM Quick Start Guide](https://www.evvm.org/)

2. Note your EVVM RPC URL and Chain ID

### Lit Protocol Setup

1. Sign up for Lit Protocol access at [developer.litprotocol.com](https://developer.litprotocol.com/)

2. Obtain your Lit Relay API key

3. Choose your Lit Network (cayenne for development, datil for production)

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
# EVVM Configuration
EVVM_RPC_URL=<your-evvm-rpc-url>
EVVM_CHAIN_ID=<your-chain-id>

# Lit Protocol
LIT_NETWORK=cayenne
LIT_RELAY_API_KEY=<your-lit-api-key>

# Telegram
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>

# Bot Wallet
BOT_PRIVATE_KEY=<your-private-key>
```

#### Frontend Environment (`frontend/.env`)

```bash
# Create frontend environment file
cat > frontend/.env << EOF
VITE_EVVM_RPC_URL=<your-evvm-rpc-url>
VITE_EVVM_CHAIN_ID=<your-chain-id>
EOF
```

## Smart Contracts

### Compile Contracts

```bash
cd contracts
npm run compile
```

### Deploy Contracts

1. Update `contracts/scripts/deploy.js` with your deployment logic (to be implemented)

2. Deploy to EVVM:

```bash
npm run deploy
```

3. Save the deployed contract addresses

4. Update the contract addresses in `bots/.env`:

```env
SHADOW_VAULT_ADDRESS=<deployed-address>
ENCRYPTED_SWAP_ADDRESS=<deployed-address>
ASYNC_NONCE_ENGINE_ADDRESS=<deployed-address>
PYTH_ADAPTER_ADDRESS=<deployed-address>
```

## Running the Bots

### Start Bot Services

```bash
cd bots
npm start
```

On first run:
- **WhatsApp**: Scan the QR code with your WhatsApp mobile app
- **Telegram**: Bot will start polling for messages

### Test Bot Commands

#### Telegram
1. Find your bot on Telegram
2. Send `/start` to begin
3. Use `/help` to see available commands
4. Try `/swap 1 ETH USDC` to test a swap intent

#### WhatsApp
1. Send a message to your bot's phone number
2. Use `/help` for commands
3. Commands are the same as Telegram

## Running the Frontend

### Start Development Server

```bash
cd frontend
npm run dev
```

The dashboard will open at `http://localhost:3000`

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
├── contracts/     # Smart contracts
├── bots/          # Bot services
├── frontend/      # Web dashboard
└── docs/          # Documentation
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes in small commits (max 500 LOC per commit)

3. Test your changes:
   ```bash
   # Test contracts
   cd contracts && npm test
   
   # Test bots (manual testing recommended)
   cd bots && npm start
   
   # Test frontend
   cd frontend && npm run dev
   ```

4. Commit with conventional commit messages:
   ```bash
   git commit -m "feat: add swap encryption"
   git commit -m "fix: resolve async nonce collision"
   ```

## Testing

### Smart Contract Tests

```bash
cd contracts
npm test
```

### Bot Testing

Bot testing is primarily manual:
1. Start the bots
2. Send test commands via Telegram/WhatsApp
3. Monitor console logs for errors
4. Verify EVVM transactions

### Frontend Testing

```bash
cd frontend
npm run dev
```

Manual testing in browser:
- Connect wallet
- Test encryption/decryption
- Verify EVVM connectivity

## Troubleshooting

### Common Issues

#### "EVVM connection failed"
- Verify EVVM_RPC_URL is correct
- Check that EVVM instance is running
- Confirm network connectivity

#### "Lit Protocol initialization failed"
- Check LIT_RELAY_API_KEY is valid
- Verify LIT_NETWORK setting
- Ensure internet connection for Lit nodes

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
- Check EVVM documentation at [evvm.org](https://www.evvm.org/)

## Next Steps

1. **Implement Smart Contract Logic**
   - Complete ShadowVault encryption logic
   - Implement EncryptedSwap execution
   - Build AsyncNonceEngine settlement
   - Integrate Pyth oracle feeds

2. **Build Bot Functionality**
   - Complete Lit Protocol encryption
   - Implement EVVM transaction relay
   - Add command parsing and validation
   - Build error handling and retries

3. **Enhance Frontend**
   - Add wallet connection logic
   - Implement portfolio decryption
   - Build transaction submission UI
   - Add real-time status updates

## Security Checklist

Before deploying to production:

- [ ] All private keys stored securely
- [ ] Environment variables never committed to git
- [ ] Smart contracts audited
- [ ] Rate limiting implemented on bots
- [ ] Access control conditions tested
- [ ] Encryption/decryption flows validated
- [ ] EVVM network security configured
- [ ] Bot authentication mechanisms in place

