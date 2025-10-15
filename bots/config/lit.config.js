/**
 * Lit Protocol Configuration
 * Configure threshold encryption and key management
 * 
 * ⚠️ IMPORTANT: Lit Protocol encrypts TRANSACTION METADATA ONLY
 * 
 * What gets encrypted:
 * - User balances and portfolio positions
 * - Trade amounts and counterparties
 * - Lending/borrowing parameters
 * - Historical transaction metadata
 * 
 * What remains PUBLIC on Arcology:
 * - Smart contract bytecode (Solidity logic)
 * - Aggregate protocol metrics
 * - Market-wide statistics
 * 
 * Architecture: Smart contracts execute on Arcology with PUBLIC logic, PRIVATE parameters
 * Storage: Encrypted metadata stored off-chain (IPFS/Arweave)
 */

export const litConfig = {
  network: process.env.LIT_NETWORK || 'datil-dev',
  relayApiKey: process.env.LIT_RELAY_API_KEY,
  
  // Lit Protocol settings
  litNodeClient: {
    alertWhenUnauthorized: false,
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Encryption settings (for Arcology chain)
  chain: 'ethereum', // Will be updated when Arcology adds Lit support
  
  // Access control conditions
  defaultAccessControlConditions: [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'ethereum',
      method: '',
      parameters: [],
      returnValueTest: {
        comparator: '>=',
        value: '0'
      }
    }
  ],
  
  // Key management
  keyDerivationPolicy: 'user-address', // Derive keys from user addresses
  
  // Performance settings
  sessionTimeout: 3600000, // 1 hour
  cacheEnabled: true
};

export default litConfig;

