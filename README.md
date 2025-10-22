# Shadow Economy

> A Privacy-Preserving Parallel DeFi Ecosystem on Arcology

![ETH Online 2025](https://img.shields.io/badge/ETH%20Online-2025-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Shadow Economy is a privacy-preserving, high-performance DeFi layer leveraging **Arcology's parallel execution blockchain**. It features async nonces for parallel execution and EVVM Fisher bot-based interaction models to enable private financial activity while maintaining aggregate verifiability through custom oracle integration with Pyth's Hermes API.

⚠️ **Note**: Pyth Network is NOT deployed on Arcology. We use a CustomPriceOracle that fetches real prices from Pyth's Hermes API off-chain.

This creates a "dark-pool-like DeFi" environment designed for private trading, lending, and strategy management while achieving **10,000-15,000 TPS** through Arcology's parallel processing.

## Architecture

```
User (WhatsApp/Telegram)
    ↓
EVVM Fisher Bot (EIP-191 signature) → Intent Processing
    ↓
Arcology Parallel Blockchain (10k-15k TPS)
    ↓
CustomPriceOracle (fetches from Pyth Hermes API) → Aggregate Data Only
    ↓
EVVM Fisher Bot (Process Result) → User
```

## Technology Stack

- **Arcology**: Parallel blockchain execution layer with 10k-15k TPS and EVM equivalence
- **EVVM**: Fisher/Relayer bot network with EIP-191 signatures for gasless UX
- **Pyth Hermes API**: Privacy-preserving aggregate oracle data via off-chain API (Pyth not on Arcology)
- **CustomPriceOracle**: On-chain price storage contract compatible with Arcology
- **Node.js**: Bot infrastructure for WhatsApp, Telegram, and Fisher network
- **Hardhat**: Smart contract development and Arcology deployment
- **React**: Frontend dashboard for portfolio management

## Project Structure

```
shadow-economy/
├── contracts/         # Smart contracts (deployed on Arcology)
├── bots/              # EVVM Fisher/Relayer bot implementations
├── frontend/          # React dashboard
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Arcology DevNet access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shadow-economy

# Install dependencies
npm install

# Set up environment variables
cp bots/.env.example bots/.env
# Edit bots/.env with your Arcology and EVVM configuration
```

### Development

```bash
# Compile contracts
cd contracts
npm run compile

# Deploy to Arcology DevNet
npm run deploy

# Run EVVM Fisher bots (development mode)
cd bots
npm run dev

# Run frontend
cd frontend
npm run dev
```

## Key Features

- **Parallel Execution**: 10,000-15,000 TPS on Arcology blockchain
- **Privacy-Preserving Architecture**: Intent-based execution designed for private transactions
- **Async Nonce System**: Quantum-like state management for parallel transactions
- **Fisher Bot Interface**: Interact via WhatsApp/Telegram with EIP-191 signatures
- **Aggregate Privacy**: Market summaries protect individual positions
- **Custom Oracle Solution**: Real Pyth prices via Hermes API without on-chain dependency

## Architecture Highlights

### Arcology Parallel Execution
- **10k-15k TPS**: Massive throughput for private DeFi operations
- **100x Lower Gas**: Significantly reduced transaction costs
- **Optimistic Concurrency**: Parallel smart contract execution with conflict resolution
- **EVM Equivalence**: Full compatibility with existing Solidity code

### Privacy Model (MVP)
- **Intent Data**: Transaction parameters stored as bytes on-chain
- **Aggregate Metrics**: Market-wide data publicly visible, individual positions private
- **Future Enhancement**: Full encryption layer planned for production
- **Access Control**: User-controlled transaction submission

### EVVM Fisher Bots
- **EIP-191 Signatures**: Secure transaction relay to Arcology
- **Gasless UX**: Fisher network executes transactions
- **Multi-Platform**: WhatsApp, Telegram support
- **Async/Sync Nonces**: Flexible transaction ordering

### Pyth Pull Oracle
- **Hermes API**: Pull latest price feeds on-demand
- **Aggregate Metrics**: Market-wide data only (individual positions private)
- **On-Chain Updates**: `updatePriceFeeds()` for smart contract consumption

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Setup Guide](docs/setup.md)
- [API Reference](docs/api-reference.md)
- [Migration Guide](MIGRATION.md)

## Code Quality & CI/CD

This project maintains high code quality standards with automated checks:

### Automated Checks

✅ **Build Validation**: All components must build successfully  
✅ **Test Coverage**: Comprehensive test suites for smart contracts  
✅ **Code Linting**: ESLint (JS/TS) and Solhint (Solidity)  
✅ **Commit Size**: Max 500 lines per commit (ETH Online requirement)  
✅ **Security Scanning**: No hardcoded secrets or private keys  
✅ **Conventional Commits**: Standardized commit message format  

### Quick Commands

```bash
# Run all linters
npm run lint:all

# Run all tests
npm run test:all

# Validate everything (lint + test + build)
npm run validate
```

### Pre-commit Hooks

Git hooks automatically run before each commit to ensure:
- Commit size ≤ 500 lines
- No secrets or .env files committed
- Code passes linting checks
- Conventional commit message format

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

All commits must:
- Follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Be ≤ 500 lines (ETH Online requirement)
- Pass all CI checks

## Use Cases

### Private Trading
Swap tokens using Arcology's parallel execution with privacy-preserving intent architecture.

### Private Lending
Lend/borrow assets with privacy-focused position management and confidential operations.

### Dark Pool Liquidity
Institutional-grade infrastructure for large order execution without slippage, powered by 10k-15k TPS.

## License

MIT License - see LICENSE file for details

---

**Built for ETH Online 2025**

Prize Tracks:
- 🚀 Arcology: Best Parallel Contracts ($2,500)
- ⛓️ Pyth: Most Innovative Pull Oracle Use ($1,500)
- 🎣 EVVM: Best Relayer/Fisher Integration ($500)
- ⭐ EVVM: Best Async Nonce Implementation ($250)
