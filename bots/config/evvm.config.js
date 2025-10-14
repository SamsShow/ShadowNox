/**
 * EVVM Virtual Blockchain Configuration
 * Configure connection to EVVM instance
 */
import dotenv from 'dotenv';
dotenv.config();

export const evvmConfig = {
  rpcUrl: process.env.EVVM_RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.EVVM_CHAIN_ID || '1337'),
  
  // Contract addresses (update after deployment)
  contracts: {
    shadowVault: process.env.SHADOW_VAULT_ADDRESS ,
    encryptedSwap: process.env.ENCRYPTED_SWAP_ADDRESS,
    asyncNonceEngine: process.env.ASYNC_NONCE_ENGINE_ADDRESS,
    pythAdapter: process.env.PYTH_ADAPTER_ADDRESS
  },
  
  // Transaction settings
  gasLimit: 5000000,
  maxFeePerGas: null, // Auto-detect
  maxPriorityFeePerGas: null, // Auto-detect
  
  // Async nonce settings
  maxPendingAsyncTxs: 5,
  asyncTxTimeout: 60000, // 60 seconds
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

export default evvmConfig;

