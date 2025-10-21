import { ethers } from 'ethers';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

// Contract addresses from deployments
const CONTRACTS = {
  EncryptedSwap: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  SimpleLending: '0x0000000000000000000000000000000000000000', // Update if deployed
  PythAdapter: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  MockPyth: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  ShadowVault: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  FisherRewards: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
};

// Network configuration
const NETWORK_CONFIG = {
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  chainId: parseInt(process.env.CHAIN_ID || '118')
};

// Get provider
export function getProvider() {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
}

// Get signer from private key
export function getSigner() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in environment variables');
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get contract instance
export async function getContract(contractName, signerOrProvider = null) {
  const address = CONTRACTS[contractName];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`${contractName} not deployed or address not configured`);
  }

  const provider = signerOrProvider || getSigner();
  
  // Load ABI from artifacts
  const abiPath = getAbiPath(contractName);
  const abi = await loadAbi(abiPath);
  
  return new ethers.Contract(address, abi, provider);
}

// Get ABI path for a contract
function getAbiPath(contractName) {
  const contractPaths = {
    EncryptedSwap: '../../../contracts/artifacts/contracts/core/EncryptedSwap.sol/EncryptedSwap.json',
    SimpleLending: '../../../contracts/artifacts/contracts/core/SimpleLending.sol/SimpleLending.json',
    PythAdapter: '../../../contracts/artifacts/contracts/oracle/PythAdapter.sol/PythAdapter.json',
    MockPyth: '../../../contracts/artifacts/contracts/mocks/MockPyth.sol/MockPyth.json',
    ShadowVault: '../../../contracts/artifacts/contracts/core/ShadowVault.sol/ShadowVault.json',
    FisherRewards: '../../../contracts/artifacts/contracts/core/FisherRewards.sol/FisherRewards.json'
  };

  return contractPaths[contractName];
}

// Load ABI from file
async function loadAbi(relativePath) {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    // Dynamic import for JSON in ES modules
    const fs = await import('fs');
    const fileContent = fs.default.readFileSync(fullPath, 'utf-8');
    const artifact = JSON.parse(fileContent);
    return artifact.abi;
  } catch (error) {
    // Fallback to minimal ABIs if artifact not found
    return getMinimalAbi(relativePath);
  }
}

// Minimal ABIs for essential functions (fallback)
function getMinimalAbi(contractPath) {
  if (contractPath.includes('EncryptedSwap')) {
    return [
      'function submitSwapIntent(bytes calldata intentData) external returns (bytes32)',
      'function executeSwap(bytes32 intentId, bytes[] calldata priceUpdateData) external payable',
      'function cancelSwap(bytes32 intentId) external',
      'function getSwapIntent(bytes32 intentId) external view returns (tuple(address user, bytes intentData, uint256 timestamp, bool executed, bool cancelled))',
      'function totalSwapVolume() external view returns (address)',
      'function totalSwapCount() external view returns (address)',
      'event SwapIntentSubmitted(address indexed user, bytes32 indexed intentId, uint256 timestamp)',
      'event SwapExecuted(bytes32 indexed intentId, address indexed user, uint256 volume, uint256 timestamp)',
      'event SwapCancelled(bytes32 indexed intentId, uint256 timestamp)'
    ];
  } else if (contractPath.includes('SimpleLending')) {
    return [
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
    ];
  } else if (contractPath.includes('PythAdapter')) {
    return [
      'function setPriceId(address token, bytes32 priceId) external',
      'function updateAggregateMetrics(address token, int256 liquidityChange, uint256 volume, bytes[] calldata updateData) external payable',
      'function getAggregateMetrics(address token) external view returns (tuple(uint256 totalLiquidity, uint256 totalVolume, uint256 lastUpdateTime, int64 lastPrice))',
      'function getPrice(address token) external view returns (int64, uint256)',
      'event MetricsUpdated(address indexed token, uint256 liquidity, uint256 volume, int64 price, uint256 timestamp)',
      'event PriceIdSet(address indexed token, bytes32 indexed priceId)'
    ];
  }
  
  throw new Error(`No ABI found for contract at path: ${contractPath}`);
}

// Format address for display
export function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format amount with decimals
export function formatAmount(amount, decimals = 18) {
  return ethers.formatUnits(amount, decimals);
}

// Parse amount to wei
export function parseAmount(amount, decimals = 18) {
  return ethers.parseUnits(amount.toString(), decimals);
}

// Wait for transaction with confirmation
export async function waitForTransaction(tx, confirmations = 1) {
  const receipt = await tx.wait(confirmations);
  return receipt;
}

// Export constants
export { CONTRACTS, NETWORK_CONFIG };
