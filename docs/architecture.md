# Shadow Economy Architecture

## Overview

Shadow Economy is a fully encrypted, parallel DeFi layer running inside EVVM's virtual blockchain environment. It introduces end-to-end encrypted transactions, async nonces, and bot-based interaction models to enable provably private financial activity while maintaining aggregate verifiability.

## System Architecture

### Layer Stack

| Layer | Component | Description |
|-------|-----------|-------------|
| **Interaction Layer** | Fisher / Relayer Bots | Secure WhatsApp and Telegram bots that relay encrypted user intents to the virtual blockchain |
| **Encryption Layer** | Lit Protocol | Handles distributed key management and end-to-end encryption of all transactions, positions, and strategies |
| **Execution Layer** | EVVM Virtual Blockchain | Parallel EVM instance where encrypted smart contracts are executed deterministically but privately |
| **Oracle Layer** | Pyth Network | Provides encrypted live market data feeds while exposing only aggregate market metrics |
| **Privacy Layer** | Async Nonce Engine | Enables parallel/conflicting transactions to coexist in quantum-like states until one is settled |

## Key Innovations

### 1. End-to-End Encrypted Transactions

Every transaction (swap, lend, stake, unwind, etc.) is encrypted client-side with Lit Protocol before being transmitted to EVVM.

Decryption keys are threshold-shared across Lit nodes, ensuring no single entity—including validators—can inspect transaction data.

| Property | Traditional EVM Tx | Shadow Economy Tx |
|----------|-------------------|-------------------|
| Visibility | Public | Encrypted |
| Validation | Miner/Validator executes | EVVM executes on encrypted bytecode |
| Auditability | Per-transaction | Aggregate (via zero-knowledge proofs) |

### 2. Async Nonce Model (Quantum Nonce System)

Traditional blockchains enforce sequential transaction ordering (nonce = 0, 1, 2…). Shadow Economy introduces asynchronous nonces, allowing multiple concurrent transactions from the same address to exist simultaneously.

**Features:**
- **Multiple coexisting transactions**: Greater optionality and parallelism
- **Hidden intent**: Protects user strategy and price impact
- **Probabilistic settlement**: Mitigates front-running and MEV exposure

Transactions are independent branches in "quantum superposition." At settlement, EVVM collapses the state into one valid branch, discarding the others.

### 3. Encrypted Market State

Instead of visible order books or lending pools, Shadow Economy aggregates encrypted activity into zero-knowledge market summaries.

| Visible On-Chain | Hidden From Public View |
|------------------|-------------------------|
| Total liquidity, aggregated TVL | Wallet balances |
| Market volatility metrics | Specific trade histories |
| Average lending rates | Lender/borrower identities |

## Data Flow

```
User → Fisher Bot → Lit Protocol (Encrypt Tx) → EVVM Executor (Encrypted Contract) 
→ Settlement Engine (Async Nonce Resolver) → Pyth (Aggregate Data Feed)
→ Fisher Bot (Decrypted Result) → User
```

### Detailed Flow

1. **User submits intent** via WhatsApp/Telegram bot (e.g., `/swap 1 ETH USDC`)
2. **Fisher Bot encrypts intent** using Lit Protocol with user's access control conditions
3. **Encrypted transaction** is submitted to EVVM virtual blockchain
4. **EVVM executor** processes encrypted bytecode without decryption
5. **Async Nonce Engine** creates parallel transaction branch (quantum superposition)
6. **Smart contracts execute** on encrypted data
7. **Settlement Engine** resolves async nonces, collapses quantum state
8. **Pyth Adapter** updates aggregate market metrics (not individual positions)
9. **Result is decrypted** by Fisher Bot using Lit Protocol
10. **User receives confirmation** via bot with transaction details

## Smart Contract Architecture

### Core Contracts

#### ShadowVault.sol
- **Purpose**: Encrypted position storage
- **Features**:
  - Stores all positions as encrypted bytecode
  - Lit Protocol integration for key management
  - Position CRUD operations with encrypted data
  - No public visibility into positions

#### EncryptedSwap.sol
- **Purpose**: Private swap execution
- **Features**:
  - Encrypted swap intents
  - Async nonce support for parallel swaps
  - Aggregate volume metrics only
  - MEV protection through encryption

#### AsyncNonceEngine.sol
- **Purpose**: Quantum-like nonce management
- **Features**:
  - Multiple concurrent transactions per address
  - Quantum superposition state management
  - Settlement logic for collapsing states
  - Conflict resolution

#### PythAdapter.sol
- **Purpose**: Privacy-preserving oracle integration
- **Features**:
  - Aggregate market metrics
  - Price feeds with privacy noise
  - No individual position exposure
  - Real-time data updates

## Bot Architecture

### Fisher/Relayer Bots

#### WhatsApp Bot
- QR code authentication
- End-to-end encrypted messaging
- Command parsing and validation
- Transaction intent relay

#### Telegram Bot
- Bot token authentication
- Rich command interface
- Inline keyboards for UX
- Status notifications

### Bot Components

```
bots/
├── src/
│   ├── whatsapp/     # WhatsApp client
│   ├── telegram/     # Telegram bot
│   ├── encryption/   # Lit Protocol wrapper
│   ├── evvm/         # EVVM connector
│   └── handlers/     # Intent processing
```

## Security Model

### Encryption
- All transaction data encrypted via Lit Protocol
- Threshold encryption (no single point of failure)
- User-controlled decryption keys
- Access control conditions per transaction

### Privacy
- No on-chain visibility of individual transactions
- Aggregate metrics only exposed
- Async nonces prevent transaction ordering analysis
- Bot interactions leave no public trace

### Integrity
- Smart contract validation on EVVM
- Cryptographic verification of encrypted data
- Settlement guarantees through async nonce engine
- Oracle data from trusted Pyth Network

## Frontend Architecture

### Dashboard
- Portfolio overview with encrypted balances
- Decrypt-on-demand functionality
- System status indicators
- Action cards for common operations

### Wallet Integration
- MetaMask and modern wallet support
- EVVM network configuration
- Transaction signing for encrypted operations

## Technology Stack

- **EVVM**: Virtual blockchain with async nonce support - [evvm.org](https://www.evvm.org/)
- **Lit Protocol**: Distributed encryption and key management
- **Pyth Network**: Privacy-preserving oracle data
- **Node.js**: Bot infrastructure (WhatsApp, Telegram)
- **Hardhat**: Smart contract development
- **React + Vite**: Frontend dashboard
- **Tailwind CSS**: Styling framework

## Theoretical Properties

| Category | Property | Mechanism |
|----------|----------|-----------|
| Privacy | Zero knowledge visibility | Lit Protocol + EVVM Encrypted Execution |
| Integrity | Cryptographic verification | zkProof-based state verification |
| Scalability | Parallel virtual chain | EVVM instance for isolated execution |
| Usability | Chat-based interface | Fisher/Relayer integration |
| Interoperability | EVM compatible bytecode | Runs in EVVM sandbox |
| Data Transparency | Aggregate exposure only | ZK summaries by Pyth Oracles |

## Use Cases

### Private Trading
- Swap tokens without revealing positions
- No front-running or MEV exploitation
- Price impact protection
- Strategy confidentiality

### Encrypted Lending
- Lend assets privately
- Hidden collateral positions
- Private liquidation events
- Confidential interest rates

### Dark Pool Liquidity
- Institutional-grade privacy
- Large order execution without slippage
- No public order books
- Aggregate metrics for transparency

## Future Extensions

- Private Real World Assets (RWAs)
- Encrypted DAO voting
- Institutional dark-pool liquidity management
- Cross-chain private bridges
- Privacy-preserving derivatives

