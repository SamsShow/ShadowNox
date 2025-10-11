# Shadow Nox API Reference

## Bot Commands

### User-Facing Commands

All commands work on both WhatsApp and Telegram interfaces.

#### `/start`
**Description**: Initialize bot session and display welcome message

**Usage**: `/start`

**Response**: Welcome message with command overview

---

#### `/help`
**Description**: Display help message with all available commands

**Usage**: `/help`

**Response**: Comprehensive command list with examples

---

#### `/swap`
**Description**: Execute a private token swap

**Usage**: `/swap <amount> <from_token> <to_token>`

**Parameters**:
- `amount`: Amount of tokens to swap (numeric)
- `from_token`: Source token symbol (e.g., ETH, USDC)
- `to_token`: Destination token symbol

**Example**:
```
/swap 1 ETH USDC
/swap 1000 USDC DAI
```

**Response**: Transaction confirmation with encrypted execution status

---

#### `/lend`
**Description**: Lend assets to earn yield

**Usage**: `/lend <amount> <token>`

**Parameters**:
- `amount`: Amount of tokens to lend
- `token`: Token symbol to lend

**Example**:
```
/lend 1000 USDC
/lend 5 ETH
```

**Response**: Lending position confirmation with encrypted details

---

#### `/portfolio`
**Description**: View encrypted portfolio and positions

**Usage**: `/portfolio`

**Response**: Decrypted portfolio summary including:
- Total portfolio value
- Active positions
- Pending transactions
- Yield earned

---

#### `/withdraw`
**Description**: Withdraw funds from positions

**Usage**: `/withdraw <amount> <token>`

**Parameters**:
- `amount`: Amount to withdraw (or "all" for full withdrawal)
- `token`: Token symbol to withdraw

**Example**:
```
/withdraw 500 USDC
/withdraw all ETH
```

**Response**: Withdrawal confirmation and transaction status

---

#### `/metrics`
**Description**: View aggregate market metrics

**Usage**: `/metrics [token]`

**Parameters** (optional):
- `token`: Specific token to query (defaults to all)

**Response**: Aggregate market data including:
- Total liquidity
- 24h trading volume
- Active positions count
- Average APR

---

#### `/status`
**Description**: Check Shadow Nox system status

**Usage**: `/status`

**Response**: System component status:
- EVVM connectivity
- Lit Protocol status
- Pyth Oracle status
- Async Nonce Engine status

---

## Smart Contract Interfaces

### ShadowVault.sol

#### `createPosition(bytes calldata _encryptedData)`
Create a new encrypted position

**Parameters**:
- `_encryptedData`: Lit Protocol encrypted position data

**Returns**: `uint256` Position ID

**Events**: `PositionCreated(address indexed user, uint256 indexed positionId, uint256 timestamp)`

---

#### `updatePosition(uint256 _positionId, bytes calldata _encryptedData)`
Update an existing position

**Parameters**:
- `_positionId`: Position ID to update
- `_encryptedData`: New encrypted position data

**Events**: `PositionUpdated(address indexed user, uint256 indexed positionId, uint256 timestamp)`

---

#### `closePosition(uint256 _positionId)`
Close a position

**Parameters**:
- `_positionId`: Position ID to close

**Events**: `PositionClosed(address indexed user, uint256 indexed positionId, uint256 timestamp)`

---

#### `getPosition(address _user, uint256 _positionId)`
Get encrypted position data

**Parameters**:
- `_user`: User address
- `_positionId`: Position ID

**Returns**: `EncryptedPosition` struct

---

### EncryptedSwap.sol

#### `submitSwapIntent(bytes calldata _encryptedIntent, uint256 _asyncNonce)`
Submit an encrypted swap intent

**Parameters**:
- `_encryptedIntent`: Encrypted swap details
- `_asyncNonce`: Async nonce for parallel execution

**Returns**: `bytes32` Intent ID

**Events**: `SwapIntentSubmitted(bytes32 indexed intentId, uint256 asyncNonce, uint256 timestamp)`

---

#### `executeSwap(bytes32 _intentId)`
Execute a pending swap

**Parameters**:
- `_intentId`: Intent ID to execute

**Events**: `SwapExecuted(bytes32 indexed intentId, uint256 timestamp)`

---

#### `cancelSwap(bytes32 _intentId)`
Cancel a pending swap

**Parameters**:
- `_intentId`: Intent ID to cancel

**Events**: `SwapCancelled(bytes32 indexed intentId, uint256 timestamp)`

---

#### `getAggregateMetrics()`
Get aggregate swap metrics

**Returns**: 
- `uint256 volume`: Total swap volume
- `uint256 count`: Total swap count

---

### AsyncNonceEngine.sol

#### `createAsyncBranch(uint256 _asyncNonce, bytes32 _txHash)`
Create a new async transaction branch

**Parameters**:
- `_asyncNonce`: Async nonce for this transaction
- `_txHash`: Transaction hash

**Returns**: `bool` Success status

**Events**: `AsyncTxCreated(address indexed sender, uint256 asyncNonce, bytes32 txHash)`

---

#### `settleAsync(address _sender, uint256 _settlementNonce)`
Settle async transactions (collapse quantum state)

**Parameters**:
- `_sender`: Address to settle for
- `_settlementNonce`: Nonce to settle

**Events**: 
- `AsyncTxSettled(address indexed sender, uint256 asyncNonce, bytes32 txHash)`
- `QuantumCollapse(address indexed sender, uint256[] settledNonces, uint256[] discardedNonces)`

---

#### `getAsyncState(address _sender, uint256 _asyncNonce)`
Query async transaction state

**Parameters**:
- `_sender`: Transaction sender
- `_asyncNonce`: Async nonce to query

**Returns**: `AsyncTransaction` struct

---

#### `hasPendingAsync(address _sender)`
Check for pending async transactions

**Parameters**:
- `_sender`: Address to check

**Returns**: `bool` Has pending transactions

---

### PythAdapter.sol

#### `setPriceId(address _token, bytes32 _priceId)`
Set Pyth price feed ID for a token

**Parameters**:
- `_token`: Token address
- `_priceId`: Pyth price feed ID

**Events**: `PriceIdSet(address indexed token, bytes32 priceId)`

---

#### `updateAggregateMetrics(address _token)`
Update aggregate metrics from Pyth

**Parameters**:
- `_token`: Token address to update

**Events**: `MetricsUpdated(address indexed token, uint256 liquidity, uint256 price, uint256 timestamp)`

---

#### `getAggregateMetrics(address _token)`
Get aggregate market metrics

**Parameters**:
- `_token`: Token address

**Returns**: `AggregateMetrics` struct:
- `uint256 totalLiquidity`
- `uint256 averagePrice`
- `uint256 volatilityIndex`
- `uint256 lastUpdateTime`

---

#### `getPrivatePrice(address _token)`
Get privacy-preserving price estimate

**Parameters**:
- `_token`: Token address

**Returns**: `uint256` Obscured price (with privacy noise)

---

## Frontend Utilities

### EVVM Utilities (`frontend/src/utils/evvm.js`)

#### `getEVVMProvider()`
Get EVVM provider instance

**Returns**: `ethers.JsonRpcProvider`

---

#### `connectWallet()`
Connect MetaMask or other wallet

**Returns**: `Promise<string>` Connected account address

**Throws**: Error if no wallet found

---

#### `switchToEVVM()`
Switch wallet to EVVM network

**Returns**: `Promise<void>`

**Throws**: Error if network switch fails

---

#### `submitEncryptedTransaction(encryptedTx, asyncNonce)`
Submit encrypted transaction to EVVM

**Parameters**:
- `encryptedTx`: Encrypted transaction data
- `asyncNonce`: Async nonce for parallel execution

**Returns**: Transaction receipt object

---

#### `queryAsyncState(userAddress, asyncNonce)`
Query async transaction state

**Parameters**:
- `userAddress`: User address
- `asyncNonce`: Async nonce to query

**Returns**: Async state object

---

### Lit Protocol Hook (`frontend/src/hooks/useLitProtocol.js`)

#### `useLitProtocol()`
React hook for Lit Protocol integration

**Returns**: Object with:
- `isInitialized`: Boolean - Lit client ready
- `litClient`: Lit client instance
- `encrypt(data)`: Function - Encrypt data
- `decrypt(encryptedData)`: Function - Decrypt data

**Example**:
```jsx
const { isInitialized, encrypt, decrypt } = useLitProtocol()

if (isInitialized) {
  const encrypted = await encrypt(myData)
  const decrypted = await decrypt(encrypted)
}
```

---

## Data Structures

### EncryptedPosition
```solidity
struct EncryptedPosition {
    bytes encryptedData;    // Lit Protocol encrypted data
    uint256 timestamp;      // Creation timestamp
    bool active;            // Position status
}
```

### SwapIntent
```solidity
struct SwapIntent {
    bytes encryptedIntent;  // Encrypted swap details
    uint256 timestamp;      // Submission time
    uint256 asyncNonce;     // Async nonce
    bool executed;          // Execution status
}
```

### AsyncTransaction
```solidity
struct AsyncTransaction {
    address sender;
    uint256 asyncNonce;
    bytes32 txHash;
    TxState state;          // Pending | Settled | Discarded
    uint256 timestamp;
    uint256 settlementBlock;
}
```

### AggregateMetrics
```solidity
struct AggregateMetrics {
    uint256 totalLiquidity;
    uint256 averagePrice;
    uint256 volatilityIndex;
    uint256 lastUpdateTime;
}
```

---

## Event Reference

### ShadowVault Events

- `PositionCreated(address indexed user, uint256 indexed positionId, uint256 timestamp)`
- `PositionUpdated(address indexed user, uint256 indexed positionId, uint256 timestamp)`
- `PositionClosed(address indexed user, uint256 indexed positionId, uint256 timestamp)`

### EncryptedSwap Events

- `SwapIntentSubmitted(bytes32 indexed intentId, uint256 asyncNonce, uint256 timestamp)`
- `SwapExecuted(bytes32 indexed intentId, uint256 timestamp)`
- `SwapCancelled(bytes32 indexed intentId, uint256 timestamp)`

### AsyncNonceEngine Events

- `AsyncTxCreated(address indexed sender, uint256 asyncNonce, bytes32 txHash)`
- `AsyncTxSettled(address indexed sender, uint256 asyncNonce, bytes32 txHash)`
- `AsyncTxDiscarded(address indexed sender, uint256 asyncNonce, bytes32 txHash)`
- `QuantumCollapse(address indexed sender, uint256[] settledNonces, uint256[] discardedNonces)`

### PythAdapter Events

- `MetricsUpdated(address indexed token, uint256 liquidity, uint256 price, uint256 timestamp)`
- `PriceIdSet(address indexed token, bytes32 priceId)`

---

## Error Codes

### Common Errors

- `"Lit client not initialized"`: Lit Protocol not ready
- `"EVVM connector not initialized"`: EVVM connection not established
- `"No wallet found"`: Web3 wallet not detected
- `"Invalid swap format"`: Incorrect swap command syntax
- `"Unknown command"`: Command not recognized

### Smart Contract Errors

- `"Position not found"`: Position ID doesn't exist
- `"Unauthorized"`: User doesn't own position
- `"Invalid async nonce"`: Nonce already used or invalid
- `"Swap already executed"`: Cannot re-execute swap
- `"Insufficient balance"`: Not enough tokens

