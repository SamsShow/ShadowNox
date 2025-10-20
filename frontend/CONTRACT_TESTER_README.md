# Contract Tester - Testing Dashboard

A comprehensive testing interface for all Shadow Economy smart contracts deployed on Arcology.

## Features

### 🧪 Contract Testing Modules

1. **AtomicCounter**
   - Increment/Decrement operations
   - View current value
   - Reset counter
   - Test parallel execution patterns

2. **EncryptedSwap**
   - Submit swap intents
   - View aggregate metrics
   - Test batch execution (owner only)
   - Monitor Fisher rewards

3. **FisherRewards**
   - Register as Fisher bot
   - View reward statistics
   - Claim accumulated rewards
   - Fund reward pool
   - Check pool status

4. **AsyncNonceEngine**
   - View pending nonces
   - Settle async transactions
   - Test parallel nonce management
   - Check settlement status

5. **ShadowVault**
   - Create encrypted positions
   - View position count
   - Retrieve position details
   - Test concurrent operations

6. **PythAdapter**
   - View price feeds
   - Check aggregate metrics
   - Test oracle integration

## Setup

### 1. Update Contract Addresses

After deploying contracts to Arcology, update the addresses in:

```
frontend/src/config/contracts.js
```

Find your deployed addresses in:
```
contracts/.env.arcology
```

or

```
contracts/deployments.json
```

### 2. Configure Network

The tester automatically detects the connected network. Supported networks:

- **Arcology DevNet** (Chain ID: 1234)
- **Arcology Testnet** (Chain ID: 4321)
- **Arcology Mainnet** (Chain ID: TBD)
- **Local Hardhat** (Chain ID: 31337)

### 3. Connect Wallet

1. Install MetaMask or another Web3 wallet
2. Add Arcology network to your wallet:
   - Network Name: Arcology DevNet
   - RPC URL: Your Arcology RPC URL
   - Chain ID: 1234 (or appropriate)
   - Currency Symbol: ARC

3. Click "Connect Wallet" in the tester

## Usage

### Testing AtomicCounter

```javascript
// Increment by 1 ETH worth
Value: 1
Click: ➕ Increment

// View current value
Click: 📊 Get Current

// Decrement
Value: 0.5
Click: ➖ Decrement

// Reset to zero
Click: 🔄 Reset
```

### Testing EncryptedSwap

```javascript
// Submit a swap intent
Intent Data: "my_encrypted_swap"
Async Nonce: 1
Click: 📤 Submit Intent

// View aggregate metrics
Click: 📊 Get Metrics
```

### Testing FisherRewards

```javascript
// 1. Register as Fisher
Click: ✅ Register Fisher

// 2. Check your stats
Click: 📊 Get Stats

// 3. Fund the pool (if needed)
Click: 💵 Fund Pool (1 ETH)

// 4. Claim rewards (after earning)
Click: 💰 Claim Rewards

// 5. Check pool status
Click: 🏦 Pool Stats
```

### Testing AsyncNonceEngine

```javascript
// View your pending nonces
Click: 📊 Get Pending Nonces

// Check if you have pending
Click: ❓ Has Pending

// Settle a nonce
Nonce to Settle: 2
Click: ✅ Settle Nonce
```

### Testing ShadowVault

```javascript
// Create a position
Encrypted Data: "my_position_data"
Click: ➕ Create Position

// Check your position count
Click: 📊 Get Count

// View a specific position
Position ID: 0
Click: 🔍 Get Position
```

## Features

### ✅ Real-Time Testing
- Immediate transaction execution
- Live results display
- Transaction hash tracking
- Error handling

### 📊 Comprehensive Coverage
- All 6 core contracts
- All major functions
- View and write operations
- Event monitoring

### 🎨 User-Friendly Interface
- Tabbed navigation
- Clear input fields
- Loading states
- Result formatting

### 🔐 Wallet Integration
- MetaMask support
- Network detection
- Account management
- Transaction signing

## Development

### Running Locally

```bash
cd frontend
npm install
npm run dev
```

Navigate to: `http://localhost:5173/test-contracts`

### Adding New Tests

1. Add new test function in `ContractTester.jsx`
2. Create UI component for inputs
3. Add button with action
4. Handle results

Example:
```javascript
const testNewFeature = async (action, data) => {
  setLoading(true);
  try {
    const tx = await contracts.myContract.myFunction(data);
    const receipt = await tx.wait();
    setResult(`✅ Success! Tx: ${receipt.hash}`);
  } catch (error) {
    setResult(`❌ Error: ${error.message}`);
  }
  setLoading(false);
};
```

## Troubleshooting

### "Please install MetaMask"
- Install MetaMask browser extension
- Refresh the page

### "Contract addresses not set"
- Update addresses in `frontend/src/config/contracts.js`
- Deploy contracts first if not deployed

### "Wrong network"
- Switch to Arcology network in MetaMask
- Check chain ID matches configuration

### "Transaction reverted"
- Check you have sufficient funds
- Verify you're the owner (for owner-only functions)
- Check function parameters are valid

### "Gas estimation failed"
- Function may have require() checks failing
- Review contract state
- Check function access control

## Security Notes

### ⚠️ Testing Environment Only

This interface is designed for testing and development:

- **DO NOT use with mainnet funds initially**
- Test on DevNet/Testnet first
- Verify all functions work as expected
- Review transaction details before signing

### 🔐 Best Practices

1. **Never share your private keys**
2. **Always verify transaction details**
3. **Test with small amounts first**
4. **Keep wallet software updated**
5. **Use hardware wallet for mainnet**

## Integration with Bots

The Contract Tester helps bot developers understand:

- Function signatures
- Parameter formats
- Expected behaviors
- Event structures
- Error handling

Marked integration points in contracts with:
```solidity
// BOT INTEGRATION: Description
```

## Supported Operations

### Read Operations (No gas)
- ✅ View counters
- ✅ Check balances
- ✅ Query statistics
- ✅ Get pending nonces
- ✅ Retrieve positions

### Write Operations (Requires gas)
- ⛽ Submit intents
- ⛽ Execute swaps
- ⛽ Claim rewards
- ⛽ Create positions
- ⛽ Settle nonces

## Next Steps

1. ✅ Deploy contracts to Arcology
2. ✅ Update contract addresses in config
3. ✅ Connect wallet to Arcology network
4. ✅ Test all contract functions
5. ✅ Verify bot integration points
6. ✅ Document any issues
7. ✅ Proceed with bot development

## Support

For issues or questions:
- Check contract deployment status
- Review transaction logs
- Consult ARCOLOGY_IMPLEMENTATION.md
- Contact development team

---

**Ready to test! 🚀**

Navigate to `/test-contracts` in the frontend to get started.

