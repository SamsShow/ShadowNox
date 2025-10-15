/**
 * Arcology Parallel Blockchain Configuration
 * Configure connection to Arcology parallel execution layer
 * 
 * Arcology provides:
 * - 10,000-15,000 TPS throughput
 * - EVM equivalence (100% Solidity compatible)
 * - Optimistic concurrency control
 * - Concurrent Library for parallel smart contracts
 */
import dotenv from 'dotenv';
dotenv.config();

export const arcologyConfig = {
  // Arcology RPC endpoint (DevNet or Testnet)
  rpcUrl: process.env.ARCOLOGY_RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.ARCOLOGY_CHAIN_ID || '1337'),
  
  // Contract addresses (update after Arcology deployment)
  contracts: {
    shadowVault: process.env.SHADOW_VAULT_ADDRESS,
    encryptedSwap: process.env.ENCRYPTED_SWAP_ADDRESS,
    asyncNonceEngine: process.env.ASYNC_NONCE_ENGINE_ADDRESS,
    pythAdapter: process.env.PYTH_ADAPTER_ADDRESS
  },
  
  // Transaction settings for Arcology
  gasLimit: 5000000,
  maxFeePerGas: null, // Auto-detect from Arcology
  maxPriorityFeePerGas: null, // Auto-detect from Arcology
  
  // Async nonce settings (Arcology supports async nonces natively)
  maxPendingAsyncTxs: 5,
  asyncTxTimeout: 60000, // 60 seconds
  
  // Parallel execution settings
  parallelExecutionEnabled: true,
  optimisticConcurrency: true, // Arcology's default
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

export default arcologyConfig;

