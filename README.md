# Shadow Nox

> A Privacy-Preserving Parallel DeFi Ecosystem on EVVM

![ETH Online 2025](https://img.shields.io/badge/ETH%20Online-2025-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Shadow Nox is a fully encrypted, parallel DeFi layer running inside EVVM's virtual blockchain environment. It introduces end-to-end encrypted transactions, async nonces, and bot-based interaction models to enable provably private financial activity while maintaining aggregate verifiability.

This creates a "dark-pool-like DeFi" environment—where users can trade, lend, stake, and manage strategies without any public visibility into wallets, trades, or portfolio states.

## Architecture

```
User → Fisher Bot → Lit Protocol (Encrypt) → EVVM Executor → Async Nonce Engine
                                              ↓
                                           Pyth Oracle (Aggregate Data)
                                              ↓
User ← Fisher Bot ← Lit Protocol (Decrypt) ← Result
```

## Technology Stack

- **EVVM**: Virtual blockchain execution layer with async nonce support
- **Lit Protocol**: Distributed encryption and threshold key management
- **Pyth Network**: Privacy-preserving aggregate oracle data
- **Node.js**: Bot infrastructure for WhatsApp and Telegram
- **Hardhat**: Smart contract development and deployment
- **React**: Frontend dashboard for portfolio management

## Project Structure

```
shadow-economy/
├── contracts/     # EVVM smart contracts
├── bots/          # Fisher/Relayer bot implementations
├── frontend/      # React dashboard
└── docs/          # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shadow-economy

# Install dependencies
npm install

# Set up environment variables
cp bots/.env.example bots/.env
# Edit bots/.env with your configuration
```

### Development

```bash
# Compile contracts
cd contracts
npm run compile

# Run bots (development mode)
cd bots
npm run dev

# Run frontend
cd frontend
npm run dev
```

## Key Features

- **End-to-End Encryption**: All transactions encrypted via Lit Protocol
- **Async Nonce System**: Quantum-like state management for parallel transactions
- **Bot Interface**: Interact via WhatsApp/Telegram for seamless UX
- **Aggregate Privacy**: Zero-knowledge market summaries protect individual positions
- **EVVM Native**: Leverages virtual blockchain capabilities for isolated execution

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Setup Guide](docs/setup.md)
- [API Reference](docs/api-reference.md)
- [CI/CD and Code Quality Guide](docs/ci-cd-guide.md)

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

For more details, see the [CI/CD Guide](docs/ci-cd-guide.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

All commits must:
- Follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Be ≤ 500 lines (ETH Online requirement)
- Pass all CI checks

## License

MIT License - see LICENSE file for details

