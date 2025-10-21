import dotenv from 'dotenv';
dotenv.config();

export const arcologyConfig = {
  // Arcology RPC endpoint (DevNet or Testnet)
  rpcUrl: process.env.ARCOLOGY_RPC_URL || 'https://testnet.arcology.network',
  chainId: parseInt(process.env.ARCOLOGY_CHAIN_ID || '118'),
  
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
  maxPriorityFeePerGas: null, 
  

  maxPendingAsyncTxs: 5,
  asyncTxTimeout: 60000, // 60 seconds
  
  parallelExecutionEnabled: true,
  optimisticConcurrency: true,
  
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

export default arcologyConfig;

