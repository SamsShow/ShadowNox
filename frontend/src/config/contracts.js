/**
 * Contract Addresses Configuration
 * Update these addresses after deploying to Arcology
 */

export const CONTRACT_ADDRESSES = {
  // Arcology DevNet
  devnet: {
    atomicCounter: '0x...', // Update after deployment
    encryptedSwap: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...',
    pythAdapter: '0x...',
    mockPyth: '0x...'
  },
  
  // Arcology Testnet
  testnet: {
    atomicCounter: '0x...',
    encryptedSwap: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...',
    pythAdapter: '0x...'
  },
  
  // Arcology Mainnet
  mainnet: {
    atomicCounter: '0x...',
    encryptedSwap: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...',
    pythAdapter: '0x...'
  },
  
  // Local Hardhat
  localhost: {
    atomicCounter: '0x...',
    encryptedSwap: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...',
    pythAdapter: '0x...',
    mockPyth: '0x...'
  }
};

// Network chain IDs
export const CHAIN_IDS = {
  devnet: 1234,
  testnet: 4321,
  mainnet: 12345, // Update with actual Arcology mainnet chain ID
  localhost: 31337
};

// Get contract addresses for current network
export const getContractAddresses = (chainId) => {
  switch (chainId) {
    case CHAIN_IDS.devnet:
      return CONTRACT_ADDRESSES.devnet;
    case CHAIN_IDS.testnet:
      return CONTRACT_ADDRESSES.testnet;
    case CHAIN_IDS.mainnet:
      return CONTRACT_ADDRESSES.mainnet;
    case CHAIN_IDS.localhost:
      return CONTRACT_ADDRESSES.localhost;
    default:
      console.warn(`Unknown chain ID: ${chainId}, defaulting to localhost`);
      return CONTRACT_ADDRESSES.localhost;
  }
};

// Contract ABIs - Minimal interfaces for testing
export const CONTRACT_ABIS = {
  atomicCounter: [
    'function increment(uint256 delta) external returns (uint256)',
    'function decrement(uint256 delta) external returns (uint256)',
    'function current() external view returns (uint256)',
    'function reset() external',
    'function set(uint256 newValue) external',
    'function owner() external view returns (address)',
    'event Incremented(uint256 newValue, uint256 delta)',
    'event Decremented(uint256 newValue, uint256 delta)',
    'event Reset(uint256 previousValue)'
  ],
  
  encryptedSwap: [
    'function submitSwapIntent(bytes calldata _encryptedIntent, uint256 _asyncNonce) external returns (bytes32)',
    'function executeSwap(bytes32 _intentId, uint256 _volume) external',
    'function batchExecuteSwaps(bytes32[] calldata _intentIds, uint256[] calldata _volumes) external',
    'function cancelSwap(bytes32 _intentId) external',
    'function getAggregateMetrics() external view returns (uint256 volume, uint256 count)',
    'function getSwapIntent(bytes32 _intentId) external view returns (tuple(bytes encryptedIntent, uint256 timestamp, uint256 asyncNonce, bool executed, bool cancelled))',
    'function setFisherRewards(address _fisherRewards) external',
    'event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 asyncNonce, uint256 timestamp)',
    'event SwapExecuted(bytes32 indexed intentId, uint256 timestamp)',
    'event SwapCancelled(bytes32 indexed intentId, uint256 timestamp)',
    'event BatchSwapsExecuted(uint256 count, uint256 totalVolume, uint256 timestamp)',
    'event FisherRewardRecorded(address indexed fisher, bytes32 indexed intentId, uint256 reward)'
  ],
  
  fisherRewards: [
    'function registerFisher() external',
    'function claimRewards() external',
    'function getRewardStats(address _fisher) external view returns (tuple(uint256 totalRewards, uint256 pendingRewards, uint256 claimedRewards, uint256 transactionCount, uint256 lastClaimTime, bool isActive))',
    'function getPoolStats() external view returns (uint256 poolBalance, uint256 totalPaid)',
    'function fundRewardPool() external payable',
    'function calculateReward(uint256 _gasUsed, uint256 _complexity) external view returns (uint256)',
    'function updateRewardParameters(uint256 _baseRate, uint256 _gasMultiplier, uint256 _complexityBonus) external',
    'event FisherRegistered(address indexed fisher, uint256 timestamp)',
    'event RewardsClaimed(address indexed fisher, uint256 amount, uint256 timestamp)',
    'event RewardRecorded(address indexed fisher, bytes32 indexed txHash, uint256 amount, uint256 timestamp)',
    'event RewardPoolFunded(uint256 amount, uint256 timestamp)'
  ],
  
  asyncNonceEngine: [
    'function createAsyncBranch(address _sender, uint256 _asyncNonce, bytes32 _txHash) external returns (bool)',
    'function settleAsync(uint256 _settlementNonce) external',
    'function batchSettleAsync(address[] calldata _senders, uint256[] calldata _settlementNonces) external',
    'function getAsyncState(address _sender, uint256 _asyncNonce) external view returns (tuple(address sender, uint256 asyncNonce, bytes32 txHash, uint8 state, uint256 timestamp, uint256 settlementBlock))',
    'function getPendingNonces(address _sender) external view returns (uint256[] memory)',
    'function hasPendingAsync(address _sender) external view returns (bool)',
    'function getLastSettledNonce(address _sender) external view returns (uint256)',
    'function setAuthorizedContract(address _contract, bool _isAuthorized) external',
    'event AsyncTxCreated(address indexed sender, uint256 asyncNonce, bytes32 txHash)',
    'event AsyncTxSettled(address indexed sender, uint256 asyncNonce, bytes32 txHash)',
    'event AsyncTxDiscarded(address indexed sender, uint256 asyncNonce, bytes32 txHash)',
    'event QuantumCollapse(address indexed sender, uint256 settledNonce, uint256[] discardedNonces)',
    'event BatchSettlementCompleted(address indexed sender, uint256 count, uint256 timestamp)'
  ],
  
  shadowVault: [
    'function createPosition(bytes calldata _encryptedData) external returns (uint256)',
    'function updatePosition(uint256 _positionId, bytes calldata _encryptedData) external',
    'function closePosition(uint256 _positionId) external',
    'function getPosition(address _user, uint256 _positionId) external view returns (tuple(bytes encryptedData, uint256 timestamp, bool active))',
    'function getPositionCount(address _user) external view returns (uint256)',
    'event PositionCreated(address indexed user, uint256 indexed positionId, uint256 timestamp)',
    'event PositionUpdated(address indexed user, uint256 indexed positionId, uint256 timestamp)',
    'event PositionClosed(address indexed user, uint256 indexed positionId, uint256 timestamp)'
  ],
  
  pythAdapter: [
    'function setPriceId(address _token, bytes32 _priceId) external',
    'function updateAggregateMetrics(address _token, int256 _liquidityChange, uint256 _volume, bytes[] calldata _updateData) external payable',
    'function getLatestPrice(address _token) external view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))',
    'function getAggregateMetrics(address _token) external view returns (tuple(uint256 totalLiquidity, uint256 totalVolume, uint256 lastUpdateTime, int64 lastPrice))',
    'event MetricsUpdated(address indexed token, uint256 liquidity, uint256 volume, int64 price, uint256 timestamp)',
    'event PriceIdSet(address indexed token, bytes32 indexed priceId)'
  ]
};

