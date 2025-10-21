# Shadow Economy Architecture

## Overview

Shadow Economy is a privacy-preserving, high-performance DeFi layer leveraging **Arcology's parallel execution blockchain**. It features async nonces for parallel execution and EVVM Fisher bot-based interaction models to enable private financial activity while maintaining aggregate verifiability through Pyth oracle integration.

This creates a "dark-pool-like DeFi" environment designed for private trading, lending, and strategy management while achieving **10,000-15,000 TPS** through Arcology's parallel processing.

## System Architecture

### Layer Stack

| Layer | Component | Description |
|-------|-----------|-------------|
| **Interaction Layer** | EVVM Fisher/Relayer Bots | Secure WhatsApp and Telegram bots that relay user intents to Arcology blockchain using EIP-191 signatures |
| **Privacy Layer** | Intent Architecture (MVP) | Privacy-preserving intent storage on-chain as bytes, designed for future encryption enhancement |
| **Execution Layer** | Arcology Parallel Blockchain | EVM-equivalent parallel blockchain executing thousands of transactions simultaneously at 10k-15k TPS |
| **Oracle Layer** | Pyth Network (Pull Method) | Provides real-time market data feeds via Hermes API, with aggregate-only public visibility |
| **Nonce Management** | Async Nonce Engine | Enables parallel/out-of-order transaction execution without sequential dependency on Arcology |

## Key Innovations

### 1. Arcology Parallel Execution Integration

Arcology processes transactions in full parallel using multiple EVM instances simultaneously while maintaining 100% EVM equivalence, achieving **10,000-15,000 TPS** with optimistic concurrency control.

**Benefits for Shadow Economy:**
- **Massive Throughput**: Handle thousands of private DeFi transactions per second
- **Low Cost**: 100x lower gas fees compared to Ethereum L1
- **Parallel Smart Contracts**: DeFi operations (swaps, lending, staking) execute simultaneously
- **No Sequential Bottlenecks**: Traditional DeFi ordering constraints eliminated
- **Concurrent Library**: Storage-slot level concurrency control for conflict-free execution

| Property | Traditional EVM | Shadow Economy on Arcology |
|----------|----------------|---------------------------|
| Execution Model | Sequential | Parallel (10k-15k TPS) |
| Transaction Privacy | Public | Privacy-preserving intents |
| Gas Costs | High | 100x lower |
| Concurrency | None | Optimistic concurrency control |
| MEV Exposure | High | Minimized through parallel execution |

### 2. Privacy-Preserving Intent Architecture (MVP)

**Design Pattern**: Shadow Economy stores transaction intent data as bytes on-chain for privacy-preserving execution.

**Intent Flow:**

1. **User Side**: User intent (swap amount, lending parameters, portfolio data) is prepared as ABI-encoded bytes
2. **Intent Storage**: Intent data stored on-chain as bytes in Arcology contracts
3. **Smart Contract Execution**: Arcology executes standard Solidity contracts with PUBLIC logic, intent data stored as bytes
4. **Future Enhancement**: Full encryption layer planned for production with off-chain privacy

**Privacy Features (MVP):**
✅ Intent data stored as bytes (not human-readable by default)  
✅ Aggregate metrics publicly visible  
✅ Individual positions remain private  
✅ Architecture ready for encryption enhancement  

**What Remains Public:**
✅ Smart contract logic (Solidity code)  
✅ Aggregate liquidity metrics  
✅ Total protocol TVL  
✅ Market-wide statistics  

| Visibility Level | Data Type | Storage Location |
|-----------------|-----------|-----------------|
| Private (MVP) | Individual user intents | On-chain as bytes (Arcology) |
| Private (MVP) | Specific trade details | On-chain as bytes (Arcology) |
| Private (MVP) | Personal portfolio data | On-chain as bytes (Arcology) |
| Public | Aggregate TVL | On-chain (Arcology) |
| Public | Smart contract code | On-chain (Arcology) |
| Public | Market-wide volume | Pyth Oracle feeds |

### 3. EVVM Fisher/Relayer Bot Layer

EVVM Fisher bots serve as the interaction layer, relaying user intents from messaging platforms to Arcology blockchain.

**Key Features:**
- **EIP-191 Signature Construction**: Fisher bots construct signed messages for transaction relay
- **Async/Sync Nonce Management**: Support for both sequential and parallel transaction patterns
- **Gasless UX**: Fishers execute transactions, users don't pay gas directly
- **Multi-Platform**: WhatsApp, Telegram, future Discord/Slack integration

**Fisher Bot Flow:**
```
User Intent (WhatsApp/Telegram)
    → EVVM Fisher Bot (EIP-191 signature construction)
    → Intent Processing (ABI-encode parameters)
    → Arcology Blockchain (parallel execution)
    → Pyth Hermes (aggregate price feeds)
    → Fisher Bot (process result)
    → User Confirmation
```

### 4. Async Nonce System for Parallel Privacy

Arcology supports async nonce execution, allowing multiple transactions from the same address to execute in parallel without sequential dependency.

**Features:**
- **Out-of-Order Execution**: Submit multiple transactions without waiting for confirmation
- **Parallel Strategy Execution**: Deploy multiple DeFi strategies simultaneously
- **MEV Resistance**: Transactions exist in quantum-like superposition until settlement
- **Privacy Protection**: No public transaction ordering reveals user strategy

**Example:**
```
User submits 3 transactions in parallel:
- Tx A (async nonce: 1): Lend 1000 USDC
- Tx B (async nonce: 2): Swap 1 ETH → USDC
- Tx C (async nonce: 3): Stake 500 USDC

All execute in parallel on Arcology without sequential dependency
```

### 5. Pyth Oracle Integration (Pull Method via Hermes)

Shadow Economy uses Pyth Network's **Pull Oracle** to maintain private individual positions while exposing aggregate market data.

**Implementation Steps:**

1. **Fetch from Hermes**: Fisher bots pull latest price feeds from Pyth's Hermes API
2. **Update On-Chain**: Call `updatePriceFeeds()` on Arcology to update oracle data
3. **Consume Prices**: Shadow Economy contracts read updated prices for execution
4. **Aggregate Publishing**: Only market-wide metrics published publicly

| Visible On-Chain (Public) | Hidden From Public (Encrypted) |
|---------------------------|-------------------------------|
| Total protocol liquidity (TVL) | Individual wallet balances |
| Market volatility metrics | Specific trade histories |
| Average lending rates | Lender/borrower identities |
| Aggregate swap volumes | User portfolio compositions |

**Privacy Guarantee**: Pyth updates reflect market-wide activity without revealing individual transactions.

## Data Flow Diagram

```
User (WhatsApp/Telegram)
    ↓ [1. Submit intent: "swap 1 ETH → USDC"]
EVVM Fisher/Relayer Bot
    ↓ [2. Construct EIP-191 signature]
    ↓ [3. Encrypt metadata via Lit Protocol]
Lit Protocol Nodes
    ↓ [4. Return encrypted data + access control]
EVVM Fisher Bot
    ↓ [5. Submit transaction to Arcology with encrypted metadata]
Arcology Parallel Blockchain
    ├→ [6. Execute smart contract in parallel (10k-15k TPS)]
    ├→ [7. Create async nonce branch]
    ├→ [8. Request aggregate price data]
    ↓
Pyth Oracle (Pull via Hermes)
    ├→ [9. Fetch from Hermes API]
    ├→ [10. Update price feeds on-chain]
    ↓ [11. Return aggregate metrics]
Arcology Settlement
    ↓ [12. Resolve async nonce branches]
EVVM Fisher Bot
    ↓ [13. Decrypt result via Lit Protocol]
User
    ↓ [14. "Swap executed: 2,845 USDC received"]
```

## Smart Contract Architecture

### Core Contracts (Deployed on Arcology)

#### AsyncNonceEngine.sol
- **Purpose**: Quantum-like nonce management for parallel transaction execution on Arcology
- **Features**:
  - Multiple concurrent transactions per address
  - Async nonce branch creation and settlement
  - Compatible with Arcology's optimistic concurrency control
  - Storage-slot level conflict resolution via Concurrent Library

#### EncryptedSwap.sol
- **Purpose**: Private swap execution on Arcology parallel blockchain
- **Features**:
  - Encrypted swap intents (metadata only via Lit Protocol)
  - Async nonce support for parallel swaps
  - Aggregate volume metrics only (individual swaps private)
  - MEV protection through metadata encryption + parallel execution
  - Executes at 10k-15k TPS on Arcology

#### ShadowVault.sol
- **Purpose**: Encrypted position storage for Arcology parallel execution
- **Features**:
  - Stores position metadata references (actual data on IPFS/Arweave)
  - Lit Protocol integration for access control
  - Position CRUD operations with encrypted metadata
  - No public visibility into positions

#### PythAdapter.sol
- **Purpose**: Privacy-preserving oracle integration via Pyth Pull method
- **Features**:
  - Hermes API price feed integration
  - On-chain price updates via `updatePriceFeeds()`
  - Aggregate market metrics only
  - No individual position exposure
  - Real-time data updates for Arcology parallel contracts

## EVVM Fisher Bot Architecture

### Bot Components

```
bots/
├── src/
│   ├── whatsapp/          # WhatsApp client
│   ├── telegram/          # Telegram bot
│   ├── evvm/              # EVVM Fisher infrastructure
│   │   ├── fisherSignature.js    # EIP-191 signature construction
│   │   ├── fisherRewards.js      # Fisher reward tracking
│   │   └── nonceManager.js       # Async/sync nonce management
│   ├── arcology/          # Arcology blockchain connector
│   │   ├── connector.js          # Arcology RPC integration
│   │   └── parallelMonitor.js    # TPS and parallel execution monitoring
│   ├── encryption/        # Lit Protocol wrapper
│   ├── oracle/            # Pyth Hermes integration
│   └── handlers/          # Intent processing
```

### WhatsApp Bot
- QR code authentication
- End-to-end encrypted messaging
- Command parsing and validation
- Transaction intent relay to Fisher network

### Telegram Bot
- Bot token authentication
- Rich command interface
- Inline keyboards for UX
- Status notifications

## Security Model

### Encryption (Lit Protocol)
- Metadata-only encryption (balances, amounts, positions)
- Threshold encryption (2/3 consensus requirement)
- User-controlled decryption keys
- Access control conditions per transaction
- Encrypted data stored on IPFS/Arweave

### Privacy
- No on-chain visibility of individual transactions
- Smart contract logic remains public (Solidity code on Arcology)
- User parameters and metadata encrypted off-chain
- Aggregate metrics only exposed via Pyth
- Async nonces prevent transaction ordering analysis

### Arcology Security
- Optimistic concurrency control with conflict detection
- EVM equivalence ensures battle-tested security model
- Multi-threaded execution isolated per transaction
- Concurrent Library for storage-slot conflict resolution

### EVVM Fisher Security
- EIP-191 signature verification
- Fisher reward incentive alignment
- Gasless transaction execution
- Trusted relayer network

## Frontend Architecture

### Dashboard
- Portfolio overview with encrypted balances
- Decrypt-on-demand functionality
- System status indicators
- Action cards for common operations
- Arcology parallel execution metrics

### Wallet Integration
- MetaMask and modern wallet support
- Arcology network configuration
- Transaction signing for encrypted operations

## Technology Stack

- **Arcology**: Parallel blockchain with 10k-15k TPS - EVM-equivalent execution
- **EVVM**: Fisher/Relayer bot network with EIP-191 signatures
- **Lit Protocol**: Distributed encryption and key management (metadata only)
- **Pyth Network**: Privacy-preserving oracle data via Hermes Pull method
- **Node.js**: Bot infrastructure (WhatsApp, Telegram, Fisher network)
- **Hardhat**: Smart contract development for Arcology deployment
- **React + Vite**: Frontend dashboard
- **Tailwind CSS**: Styling framework

## Theoretical Properties

| Category | Property | Mechanism |
|----------|----------|-----------|
| Performance | 10k-15k TPS throughput | Arcology parallel execution |
| Privacy | Zero knowledge visibility | Lit Protocol metadata encryption + IPFS/Arweave storage |
| Integrity | Cryptographic verification | Threshold encryption + access control |
| Scalability | Parallel contract execution | Arcology Concurrent Library + optimistic concurrency |
| Usability | Chat-based interface | EVVM Fisher/Relayer integration |
| Interoperability | EVM compatible bytecode | Arcology EVM equivalence |
| Data Transparency | Aggregate exposure only | Pyth Hermes aggregate metrics |

## Use Cases

### Private Trading
- Swap tokens without revealing positions
- No front-running or MEV exploitation via parallel execution
- Price impact protection through metadata encryption
- Strategy confidentiality

### Encrypted Lending
- Lend assets privately
- Hidden collateral positions
- Private liquidation events
- Confidential interest rates

### Dark Pool Liquidity
- Institutional-grade privacy
- Large order execution without slippage via parallel processing
- No public order books
- Aggregate metrics for transparency

## Future Extensions

- **Private Real World Assets (RWAs)**: Institutional-grade private asset tokenization
- **Encrypted DAO Voting**: Governance without public vote tracking
- **Cross-Chain Private Bridges**: Interoperable private liquidity aggregation
- **AI-Powered Private Strategies**: Encrypted algorithmic trading at 10k TPS
- **Advanced Concurrent Contracts**: Leverage Arcology's Concurrent Library for complex DeFi primitives

## Competitive Advantages

| Feature | Traditional DeFi | Shadow Economy |
|---------|-----------------|----------------|
| Throughput | 15-50 TPS | 10,000-15,000 TPS |
| Privacy | Fully public | Encrypted metadata |
| Gas Costs | High ($50-200/tx) | 100x lower |
| UX | Wallet + browser | Chat commands via EVVM Fisher |
| MEV Exposure | High | Minimized via parallel execution |
| Parallel Execution | None | Native Arcology support |
| Oracle Updates | Expensive push | Pull-based efficiency (Hermes) |
