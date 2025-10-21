# Shadow Economy CLI Testing Guide

This guide provides comprehensive testing scenarios for the Shadow Economy smart contracts using the CLI tool.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Test Scenarios](#test-scenarios)
4. [Common Workflows](#common-workflows)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Setup

1. **Blockchain Node Running**
   - For local testing: Start Hardhat node
   ```bash
   cd ../contracts
   npx hardhat node
   ```

2. **Contracts Deployed**
   ```bash
   cd ../contracts
   npm run deploy
   ```

3. **CLI Configured**
   ```bash
   cd ../cli
   ./setup.sh
   # Edit .env with your private key
   ```

4. **Funded Wallet**
   - Your wallet needs ETH for gas fees
   - For local Hardhat: Use one of the default accounts

## Getting Started

### Quick Start

```bash
cd cli
npm start
```

This launches the interactive menu. Navigate using arrow keys and Enter.

### Verify Setup

1. Test connection:
```bash
node src/index.js network:info
```

2. Check your balance:
```bash
node src/index.js account:balance
```

3. View contract addresses:
```bash
node src/index.js network:info
```

## Test Scenarios

### Scenario 1: Simple Swap Flow

**Objective**: Submit and execute a basic swap intent

1. **Submit Swap Intent**
   ```
   Action: EncryptedSwap > Submit Swap Intent
   
   Inputs:
   - Token In: 0x0000000000000000000000000000000000000001
   - Token Out: 0x0000000000000000000000000000000000000002
   - Amount In: 1.0 ETH
   - Min Amount Out: 0.95 ETH
   - Deadline: 3600 seconds
   
   Expected Result:
   ✅ Transaction confirmed
   📝 Intent ID displayed
   ```

2. **View Intent Details**
   ```
   Action: EncryptedSwap > Get Swap Intent
   
   Input: <Intent ID from step 1>
   
   Expected Result:
   ✅ Intent details displayed
   - User address matches your wallet
   - Executed: false
   - Cancelled: false
   ```

3. **Execute Swap**
   ```
   Action: EncryptedSwap > Execute Swap
   
   Input: <Intent ID>
   Include price data: No (for testing)
   
   Expected Result:
   ✅ Swap executed successfully
   ```

4. **Verify Execution**
   ```
   Action: EncryptedSwap > Get Swap Intent
   
   Expected Result:
   - Executed: true
   ```

5. **Check Statistics**
   ```
   Action: EncryptedSwap > View Stats
   
   Expected Result:
   - Total Swap Count: 1
   - Total Volume increased
   ```

### Scenario 2: Swap Cancellation

**Objective**: Submit and cancel a swap intent

1. **Submit Intent**
   ```
   Follow steps from Scenario 1
   ```

2. **Cancel Before Execution**
   ```
   Action: EncryptedSwap > Cancel Swap
   
   Input: <Intent ID>
   
   Expected Result:
   ✅ Swap cancelled successfully
   ```

3. **Verify Cancellation**
   ```
   Action: EncryptedSwap > Get Swap Intent
   
   Expected Result:
   - Cancelled: true
   - Executed: false
   ```

4. **Try to Execute (Should Fail)**
   ```
   Action: EncryptedSwap > Execute Swap
   
   Expected Result:
   ❌ Transaction should fail (already cancelled)
   ```

### Scenario 3: Lending Protocol Flow

**Objective**: Test the complete lending lifecycle

1. **Deposit Funds**
   ```
   Action: Lending Operations > Deposit
   
   Input: 10.0 ETH
   
   Expected Result:
   ✅ Deposited successfully
   ```

2. **Check Account**
   ```
   Action: Lending Operations > View Account
   
   Expected Result:
   - Deposited: 10.0 ETH
   - Borrowed: 0 ETH
   - Collateral: 0 ETH
   ```

3. **Add Collateral**
   ```
   Action: Lending Operations > Add Collateral
   
   Inputs:
   - Amount: 5.0 ETH
   - Token: 0x0000000000000000000000000000000000000001
   
   Expected Result:
   ✅ Collateral added successfully
   ```

4. **Borrow Against Collateral**
   ```
   Action: Lending Operations > Borrow
   
   Input: 3.0 ETH
   
   Expected Result:
   ✅ Borrowed successfully
   ```

5. **Check Account Again**
   ```
   Action: Lending Operations > View Account
   
   Expected Result:
   - Deposited: 10.0 ETH
   - Borrowed: 3.0 ETH
   - Collateral: 5.0 ETH
   ```

6. **View Protocol Stats**
   ```
   Action: Lending Operations > View Stats
   
   Expected Result:
   - Total Deposits: 10.0 ETH
   - Total Borrows: 3.0 ETH
   - Total Collateral: 5.0 ETH
   - Available Liquidity: 7.0 ETH
   ```

7. **Repay Loan**
   ```
   Action: Lending Operations > Repay
   
   Input: 1.5 ETH
   
   Expected Result:
   ✅ Repaid successfully
   ```

8. **Verify Repayment**
   ```
   Action: Lending Operations > View Account
   
   Expected Result:
   - Borrowed: 1.5 ETH (reduced)
   ```

### Scenario 4: Oracle Integration

**Objective**: Configure and use Pyth oracle

1. **Set Price Feed ID**
   ```
   Action: Oracle Operations > Set Price ID
   
   Inputs:
   - Token: 0x0000000000000000000000000000000000000001
   - Price ID: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
   
   Expected Result:
   ✅ Price ID set successfully
   ```

2. **Update Metrics**
   ```
   Action: Oracle Operations > Update Metrics
   
   Inputs:
   - Token: 0x0000000000000000000000000000000000000001
   - Liquidity Change: 1000
   - Volume: 500
   - Include price data: No
   
   Expected Result:
   ✅ Metrics updated successfully
   ```

3. **Query Metrics**
   ```
   Action: Oracle Operations > Get Metrics
   
   Input: 0x0000000000000000000000000000000000000001
   
   Expected Result:
   - Total Liquidity: 1000
   - Total Volume: 500
   - Last Update timestamp shown
   ```

## Common Workflows

### Daily Testing Routine

1. **Start with Network Check**
   ```bash
   npm start
   > Utilities > Network Info
   ```

2. **Check Balance**
   ```bash
   > Utilities > Check Balance
   ```

3. **Run Test Scenarios**
   - Execute Scenario 1 (Swap)
   - Execute Scenario 3 (Lending)

4. **Review Statistics**
   - Check swap stats
   - Check lending stats

### Pre-Deployment Testing

Before deploying to testnet or mainnet:

1. **Test All Contract Functions**
   - Submit multiple swaps
   - Test lending deposits/withdrawals
   - Test borrowing with collateral
   - Test oracle price updates

2. **Test Error Conditions**
   - Try to withdraw more than deposited
   - Try to borrow without collateral
   - Try to execute cancelled swap
   - Try to cancel executed swap

3. **Verify State Consistency**
   - Check account balances match expectations
   - Verify total statistics are accurate
   - Confirm timestamps are recent

### Continuous Integration

Use in automated testing:

```bash
# Test connection
node src/index.js network:info

# Check contract deployment
node src/index.js account:balance

# Run specific test command
# (Can be automated with scripts)
```

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to blockchain"

**Solution:**
```bash
# Check if Hardhat node is running
cd ../contracts
npx hardhat node

# Verify RPC_URL in .env
cat .env | grep RPC_URL
```

#### Issue: "Insufficient funds"

**Solution:**
```bash
# Check balance
node src/index.js account:balance

# For local Hardhat, use funded account
# Update PRIVATE_KEY in .env with a funded account
```

#### Issue: "Contract not deployed"

**Solution:**
```bash
# Deploy contracts
cd ../contracts
npm run deploy

# Verify deployment
cat deployments.json
```

#### Issue: "Transaction reverted"

**Causes:**
- Insufficient collateral for borrow
- Trying to withdraw more than deposited
- Contract state doesn't allow operation

**Solution:**
1. Check account state first
2. Verify parameters are valid
3. Review contract error messages

#### Issue: "Price feed not set"

**Solution:**
```bash
# Set price feed ID first
node src/index.js
> Oracle Operations > Set Price ID
```

### Debug Mode

For detailed transaction information:

1. Note transaction hash from CLI output
2. Check transaction on block explorer (if testnet)
3. For local Hardhat, check node console output

### Getting Help

If you encounter issues:

1. Check the main README.md
2. Review contract documentation in `/docs`
3. Examine transaction receipts for error messages
4. Check Hardhat node logs for detailed errors

## Best Practices

1. **Always test on local network first**
2. **Use small amounts for initial testing**
3. **Verify each step before proceeding**
4. **Keep track of Intent IDs and transaction hashes**
5. **Monitor account state after each operation**
6. **Check statistics to verify aggregate data**

## Advanced Testing

### Load Testing

Submit multiple operations in sequence:

```bash
# Submit 10 swaps
for i in {1..10}; do
  node src/index.js swap:submit
done

# Check statistics
node src/index.js swap:stats
```

### Parallel Operations (Arcology)

Arcology supports parallel execution:

1. Deploy to Arcology network
2. Submit multiple operations simultaneously
3. Verify conflict-free execution
4. Check aggregate metrics

### Integration Testing

Test interactions between contracts:

1. Submit swap with oracle price check
2. Borrow in lending with oracle validation
3. Verify consistent state across contracts

---

**Happy Testing! 🚀**
