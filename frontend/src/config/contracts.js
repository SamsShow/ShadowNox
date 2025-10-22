/**
 * Contract Addresses Configuration
 * Update these addresses after deploying to Arcology
 */

export const CONTRACT_ADDRESSES = {
  // Arcology DevNet
  devnet: {
    customPriceOracle: '0x...', // Update after deployment
    encryptedSwap: '0x...',
    simpleLending: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...'
  },
  
  // Arcology Testnet
  testnet: {
    customPriceOracle: '0x...',
    encryptedSwap: '0x...',
    simpleLending: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...'
  },
  
  // Arcology Mainnet
  mainnet: {
    customPriceOracle: '0x...',
    encryptedSwap: '0x...',
    simpleLending: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...'
  },
  
  // Local Hardhat
  localhost: {
    customPriceOracle: '0x...',
    encryptedSwap: '0x...',
    simpleLending: '0x...',
    fisherRewards: '0x...',
    asyncNonceEngine: '0x...',
    shadowVault: '0x...'
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

// Contract ABIs - Minimal interfaces for production
export const CONTRACT_ABIS = {
  customPriceOracle: [
    'function setPriceId(address token, bytes32 priceId) external',
    'function updatePrice(address token, int64 price, uint64 conf, int32 expo, uint publishTime) external',
    'function updatePrices(address[] calldata tokens, int64[] calldata prices, uint64[] calldata confs, int32[] calldata expos, uint[] calldata publishTimes) external',
    'function getLatestPrice(address token) external view returns (tuple(int64 price, uint64 conf, int32 expo, uint publishTime))',
    'function getPriceUnsafe(address token) external view returns (tuple(int64 price, uint64 conf, int32 expo, uint publishTime))',
    'function setAuthorizedUpdater(address updater, bool authorized) external',
    'function updateAggregateMetrics(address token, int256 liquidityChange, uint256 volume) external',
    'event PriceUpdated(address indexed token, int64 price, uint64 conf, uint publishTime)',
    'event PriceIdSet(address indexed token, bytes32 indexed priceId)'
  ],
  
  encryptedSwap: [
    'function submitSwapIntent(bytes calldata intentData) external returns (bytes32)',
    'function executeSwap(bytes32 intentId, bytes[] calldata priceUpdateData) external payable',
    'function cancelSwap(bytes32 intentId) external',
    'function getSwapIntent(bytes32 intentId) external view returns (tuple(address user, bytes intentData, uint256 timestamp, bool executed, bool cancelled))',
    'function totalSwapVolume() external view returns (address)',
    'function totalSwapCount() external view returns (address)',
    'event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 timestamp)',
    'event SwapExecuted(bytes32 indexed intentId, address indexed user, uint256 volume, uint256 timestamp)',
    'event SwapCancelled(bytes32 indexed intentId, uint256 timestamp)'
  ],
  
  simpleLending: [
    'function deposit() external payable',
    'function withdraw(uint256 amount) external',
    'function borrow(uint256 amount, uint256 collateral, address collateralToken, bytes[] calldata priceUpdateData) external payable',
    'function repay() external payable',
    'function addCollateral(address collateralToken) external payable',
    'function getAccount(address user) external view returns (tuple(uint256 deposited, uint256 borrowed, uint256 collateral, address collateralToken, uint256 lastUpdate))',
    'function totalDeposits() external view returns (address)',
    'function totalBorrows() external view returns (address)',
    'function totalCollateral() external view returns (address)',
    'event Deposited(address indexed user, uint256 amount, uint256 timestamp)',
    'event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)',
    'event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 timestamp)',
    'event Repaid(address indexed user, uint256 amount, uint256 timestamp)'
  ]
};

