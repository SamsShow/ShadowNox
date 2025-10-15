# Shadow Economy - Arcology Migration

## Overview

Shadow Economy has been refactored from EVVM-based execution to **Arcology parallel blockchain** as the execution layer. EVVM now serves exclusively as the **Fisher/Relayer bot infrastructure layer**.

## Architecture Changes

### Previous Architecture
- EVVM Virtual Blockchain: Smart contract execution layer
- Lit Protocol: Full transaction encryption

### New Architecture
- **Arcology Parallel Blockchain**: Smart contract execution (10k-15k TPS)
- **EVVM Fisher Bots**: Transaction relay layer with EIP-191 signatures
- **Lit Protocol**: Metadata-only encryption (balances, amounts, NOT contract bytecode)
- **Pyth Hermes**: Pull oracle integration

## File Renames

| Old Path | New Path |
|----------|----------|
| `bots/config/evvm.config.js` | `bots/config/arcology.config.js` |
| `bots/src/evvm/connector.js` | `bots/src/arcology/connector.js` |
| `frontend/src/utils/evvm.js` | `frontend/src/utils/arcology.js` |

## Environment Variable Changes

| Old Variable | New Variable |
|--------------|--------------|
| `EVVM_RPC_URL` | `ARCOLOGY_RPC_URL` |
| `EVVM_CHAIN_ID` | `ARCOLOGY_CHAIN_ID` |

## Removed Files

- `bots/abi/AsyncNonceEngine.json` - Will be regenerated after Arcology deployment
- `bots/abi/EncryptedSwap.json` - Will be regenerated after Arcology deployment

## New Features Added

### Arcology Integration
- **Parallel Execution**: 10k-15k TPS throughput
- **Optimistic Concurrency Control**: Storage-slot level conflict resolution
- **Concurrent Library**: Future support for parallel DeFi primitives
- **EVM Equivalence**: Full Solidity compatibility

### EVVM Fisher Bot Layer
- **EIP-191 Signatures**: Transaction signing for relay to Arcology
- **Async/Sync Nonce Management**: Flexible transaction ordering
- **Fisher Rewards**: Incentive system for bot operators
- **Gasless UX**: Users don't pay gas directly

### Lit Protocol Clarification
- **Metadata-Only Encryption**: Encrypts user data (balances, amounts, positions)
- **Public Contract Logic**: Smart contracts execute on Arcology with PUBLIC logic
- **Off-Chain Storage**: Encrypted metadata stored on IPFS/Arweave

### Pyth Hermes Integration
- **Pull Oracle**: Fetch price feeds from Hermes API on-demand
- **On-Chain Updates**: `updatePriceFeeds()` for Arcology contracts
- **Aggregate Privacy**: Individual positions hidden, market metrics public

## New Skeleton Files

### EVVM Fisher Infrastructure
- `bots/src/evvm/fisherSignature.js` - EIP-191 signature construction
- `bots/src/evvm/fisherRewards.js` - Fisher reward tracking
- `bots/src/evvm/nonceManager.js` - Async/sync nonce management

### Arcology Integration
- `bots/src/arcology/parallelMonitor.js` - TPS and parallel execution monitoring
- `contracts/arcology/ConcurrentLibrary.md` - Parallel execution patterns

### Pyth Hermes
- `bots/src/oracle/pythHermes.js` - Hermes API integration

### Performance Testing
- `contracts/scripts/benchmark-parallel.sh` - 10k TPS benchmarking

## Import Path Updates

All imports referencing `evvm/connector` or `evvm.js` have been updated to:
- `arcology/connector` (in bots)
- `arcology.js` (in frontend)

**Affected Files:**
- `bots/src/index.js`
- `bots/src/handlers/intentHandler.js`
- `bots/__tests__/handlers.test.js`
- `frontend/src/components/*.jsx`
- `frontend/src/hooks/*.js`

## Smart Contract Updates

All smart contracts now reference Arcology deployment:

- **AsyncNonceEngine.sol**: Arcology async nonce support with optimistic concurrency
- **EncryptedSwap.sol**: Parallel execution at 10k-15k TPS with metadata encryption
- **ShadowVault.sol**: IPFS/Arweave storage for encrypted position data
- **PythAdapter.sol**: Hermes Pull Oracle integration

## Configuration Updates

### Bots Config (`bots/config/arcology.config.js`)
```javascript
export const arcologyConfig = {
  rpcUrl: process.env.ARCOLOGY_RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.ARCOLOGY_CHAIN_ID || '1337'),
  // Async nonce settings for Arcology
  maxPendingAsyncTxs: 5,
  asyncTxTimeout: 60000
};
```

### Frontend Config (`frontend/.env`)
```env
VITE_ARCOLOGY_RPC_URL=http://localhost:8545
VITE_ARCOLOGY_CHAIN_ID=1337
```

## Documentation Updates

- **docs/architecture.md**: Complete rewrite with Arcology + EVVM Fisher architecture
- **README.md**: Updated technology stack and architecture diagram
- **docs/setup.md**: Arcology DevNet setup, EVVM Fisher configuration, Pyth Hermes
- **docs/api-reference.md**: Updated with Arcology parallel execution references

## Migration Steps for Team

1. **Update Local Environment**
   ```bash
   # Rename env vars in bots/.env
   EVVM_RPC_URL → ARCOLOGY_RPC_URL
   EVVM_CHAIN_ID → ARCOLOGY_CHAIN_ID
   ```

2. **Pull Latest Changes**
   ```bash
   git pull origin main
   npm install  # Update dependencies
   ```

3. **Update Imports** (if you have custom bot extensions)
   - Change `from '../evvm/connector'` → `from '../arcology/connector'`
   - Change `import { getEVVMProvider }` → `import { getArcologyProvider }`

4. **Deploy to Arcology**
   ```bash
   cd contracts
   npm run deploy -- --network arcology
   # Update contract addresses in bots/.env
   ```

5. **Test EVVM Fisher Bots**
   ```bash
   cd bots
   npm start
   # Verify EIP-191 signatures, Lit metadata encryption, Arcology submission
   ```

6. **Implement Skeletons** (team tasks)
   - Complete `bots/src/evvm/fisherSignature.js` - EIP-191 logic
   - Complete `bots/src/oracle/pythHermes.js` - Hermes API calls
   - Complete `bots/src/arcology/parallelMonitor.js` - TPS monitoring
   - Add Concurrent Library patterns to contracts

## Key Concepts

### Execution Layer: Arcology
- All smart contracts deploy and execute on Arcology
- 10k-15k TPS parallel processing
- EVM-equivalent (use existing Solidity code)
- Optimistic concurrency control

### Interaction Layer: EVVM Fisher Bots
- Relay user intents from WhatsApp/Telegram to Arcology
- Construct EIP-191 signatures
- Manage async/sync nonces
- Provide gasless UX

### Privacy Layer: Lit Protocol
- **Encrypts METADATA ONLY**: User balances, trade amounts, positions
- **Does NOT encrypt**: Smart contract bytecode (executes publicly on Arcology)
- Off-chain storage: IPFS/Arweave

### Oracle Layer: Pyth Hermes
- Pull price feeds on-demand from Hermes API
- Update on-chain via `updatePriceFeeds()`
- Aggregate metrics only (individual positions private)

## Questions?

Refer to:
- [Architecture Documentation](docs/architecture.md)
- [Setup Guide](docs/setup.md)
- [Arcology Docs](https://arcology.network/docs)
- [EVVM Fisher Network](https://www.evvm.org/)
- [Pyth Hermes API](https://hermes.pyth.network/docs)

