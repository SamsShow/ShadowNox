/**
 * Lit Protocol Configuration
 * Configure threshold encryption and key management
 */

export const litConfig = {
  network: process.env.LIT_NETWORK || 'cayenne',
  relayApiKey: process.env.LIT_RELAY_API_KEY,
  
  // Lit Protocol settings
  litNodeClient: {
    alertWhenUnauthorized: false,
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Encryption settings
  chain: 'ethereum',
  
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

