# Oracle Solution for Arcology

## Problem: Pyth Network Not Available on Arcology

During development, we discovered that **Pyth Network's on-chain contracts are NOT deployed on Arcology blockchain**. This presented a challenge since our architecture relied on Pyth for real-time price feeds.

## Solution: CustomPriceOracle + Pyth Hermes API

We developed a custom oracle solution that uses Pyth's off-chain Hermes API while storing prices on-chain in a way compatible with Arcology.

### Architecture

```
┌─────────────────┐
│  Pyth Hermes API│  (Off-chain - https://hermes.pyth.network)
│  Real Price Data│
└────────┬────────┘
         │
         │ HTTP Fetch
         │
┌────────▼─────────┐
│  Fisher Bots     │  (Off-chain price updaters)
│  - Fetch prices  │
│  - Update oracle │
└────────┬─────────┘
         │
         │ updatePrice() / updatePrices()
         │
┌────────▼──────────┐
│ CustomPriceOracle │  (On-chain - Arcology)
│ - Stores prices   │
│ - Validates data  │
│ - Anti-manipulation
└────────┬──────────┘
         │
         │ getLatestPrice()
         │
┌────────▼──────────┐
│  DeFi Contracts   │  (On-chain - Arcology)
│  - EncryptedSwap  │
│  - SimpleLending  │
└───────────────────┘
```

## CustomPriceOracle Contract

### Key Features

1. **No Pyth On-Chain Dependency**: Works independently without requiring Pyth contracts
2. **Real Price Data**: Fetches from Pyth Hermes API (same data as Pyth on-chain)
3. **Multi-Signature Support**: Multiple authorized updaters (Fisher bots)
4. **Price Staleness Checks**: Configurable maximum price age (default: 60 seconds)
5. **Price Deviation Protection**: Prevents manipulation via sudden price changes (default: 10%)
6. **Batch Updates**: Gas-efficient batch price updates
7. **Aggregate Metrics**: Privacy-preserving market-wide statistics

### Price Data Structure

```solidity
struct Price {
    int64 price;           // Price with implied decimals
    uint64 conf;           // Confidence interval
    int32 expo;            // Price exponent (e.g., -8 = divide by 10^8)
    uint256 publishTime;   // When price was published
}
```

### Main Functions

#### For Administrators

```solidity
// Set token → price feed ID mapping
function setPriceId(address _token, bytes32 _priceId) external onlyOwner

// Authorize Fisher bot to update prices
function setAuthorizedUpdater(address _updater, bool _authorized) external onlyOwner

// Configure staleness threshold
function setMaxStaleness(uint256 _maxStaleness) external onlyOwner

// Configure max price deviation
function setMaxPriceDeviation(uint256 _maxDeviation) external onlyOwner
```

#### For Fisher Bots

```solidity
// Update single price feed
function updatePrice(
    bytes32 _priceId,
    int64 _price,
    uint64 _conf,
    int32 _expo,
    uint256 _publishTime
) external onlyAuthorized

// Batch update multiple prices (gas efficient)
function updatePrices(
    bytes32[] calldata _priceIds,
    int64[] calldata _prices,
    uint64[] calldata _confs,
    int32[] calldata _expos,
    uint256[] calldata _publishTimes
) external onlyAuthorized

// Update aggregate metrics for privacy
function updateAggregateMetrics(
    address _token,
    int256 _liquidityChange,
    uint256 _volumeIncrease
) external onlyAuthorized
```

#### For DeFi Contracts

```solidity
// Get latest price (with staleness check)
function getLatestPrice(address _token) external view returns (Price memory)

// Get price by ID (with staleness check)
function getPrice(bytes32 _priceId) external view returns (Price memory)

// Get price without staleness check (use with caution)
function getPriceUnsafe(address _token) external view returns (Price memory)

// Get aggregate market metrics
function getAggregateMetrics(address _token) external view returns (AggregateMetrics memory)
```

## Pyth Hermes API Integration

### Price Feed IDs

Pyth price feed IDs are the same as on-chain:

```javascript
const PRICE_FEED_IDS = {
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
};
```

Find more at: https://pyth.network/developers/price-feed-ids

### Fetching from Hermes API

```javascript
import { fetchPriceFeeds, updateOnChainPrices } from './bots/src/oracle/pythHermes.js';

// Fetch latest prices
const priceIds = [
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'  // BTC/USD
];

const priceData = await fetchPriceFeeds(priceIds);
console.log(priceData.parsed); // Human-readable prices
```

### Updating Prices On-Chain

```javascript
import { ethers } from 'ethers';

// Connect to oracle contract
const oracle = new ethers.Contract(
  CUSTOM_PRICE_ORACLE_ADDRESS,
  CustomPriceOracleABI,
  wallet
);

// Update prices from Hermes
await updateOnChainPrices(oracle, priceIds, wallet);
```

### Continuous Price Updates

```javascript
import { startContinuousPriceUpdates } from './bots/src/oracle/pythHermes.js';

// Start Fisher bot that updates prices every 30 seconds
const controller = startContinuousPriceUpdates(oracle, priceIds, 30);

// Stop updates when needed
controller.stop();
```

## Deployment Guide

### 1. Deploy CustomPriceOracle

```bash
cd contracts
npx hardhat run scripts/deploy.js --network arcology
```

This will deploy:
- `CustomPriceOracle`
- `EncryptedSwap` (with oracle integration)
- `SimpleLending` (with oracle integration)

### 2. Configure Price Feeds

```javascript
// Map token addresses to Pyth price feed IDs
await oracle.setPriceId(
  USDC_ADDRESS,
  '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a' // USDC/USD
);

await oracle.setPriceId(
  ETH_ADDRESS,
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' // ETH/USD
);
```

### 3. Authorize Fisher Bots

```javascript
// Allow Fisher bot to update prices
await oracle.setAuthorizedUpdater(FISHER_BOT_ADDRESS, true);
```

### 4. Start Price Updates

```javascript
// Fisher bot continuously updates prices
import { startContinuousPriceUpdates } from './bots/src/oracle/pythHermes.js';

const priceIds = [
  '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC/USD
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'  // ETH/USD
];

startContinuousPriceUpdates(oracleContract, priceIds, 30); // Update every 30s
```

## Testing

### Unit Tests

```bash
cd contracts
npx hardhat test test/CustomPriceOracle.test.js
```

### Integration Tests

```bash
npx hardhat test test/EncryptedSwap.test.js
npx hardhat test test/SimpleLending.test.js
```

## Security Considerations

### 1. Price Deviation Protection

CustomPriceOracle rejects price updates that deviate more than 10% from the previous price:

```solidity
// Configurable - can be updated by owner
uint256 public maxPriceDeviation = 10; // 10%
```

This prevents malicious or faulty price updates.

### 2. Staleness Checks

Prices older than 60 seconds are rejected:

```solidity
uint256 public maxStaleness = 60 seconds;
```

### 3. Multi-Signature Updates

Multiple Fisher bots can be authorized as updaters for redundancy:

```solidity
mapping(address => bool) public authorizedUpdaters;
```

### 4. Price Confidence Intervals

Pyth provides confidence intervals with each price:

```solidity
struct Price {
    int64 price;
    uint64 conf;    // ← Confidence interval
    ...
}
```

DeFi protocols can use this to assess price quality.

## Advantages Over Pyth On-Chain

1. **Works on Arcology**: No dependency on unavailable Pyth contracts
2. **Same Price Data**: Uses official Pyth Hermes API
3. **Gas Efficient**: Batch updates, no cross-chain message verification
4. **Flexible**: Easy to add custom validation logic
5. **Controllable**: Fine-grained control over updaters and parameters

## Comparison

| Feature | Pyth On-Chain | CustomPriceOracle |
|---------|---------------|-------------------|
| **Availability on Arcology** | ❌ Not deployed | ✅ Custom deployment |
| **Price Data Source** | Pythnet | Pyth Hermes API |
| **Price Quality** | ✅ Official | ✅ Official (same source) |
| **Update Mechanism** | Cross-chain messaging | Fisher bot updates |
| **Gas Costs** | Variable | Low (no verification) |
| **Staleness Checks** | ✅ Built-in | ✅ Built-in |
| **Customization** | ❌ Fixed | ✅ Fully customizable |

## Future Enhancements

1. **WebSocket Integration**: Real-time price updates via Pyth Hermes WebSocket
2. **Multi-Oracle Aggregation**: Combine Pyth with other oracle sources
3. **DAO Governance**: Decentralized updater authorization
4. **Advanced Staleness Logic**: Different thresholds per asset
5. **Price History**: On-chain TWAP calculations

## References

- Pyth Network: https://pyth.network
- Pyth Hermes API: https://hermes.pyth.network
- Pyth Documentation: https://docs.pyth.network
- Price Feed IDs: https://pyth.network/developers/price-feed-ids
- Arcology Documentation: https://arcology.network/docs

