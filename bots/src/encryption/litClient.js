/**
 * Lit Protocol Client for Shadow Nox
 * Handles threshold encryption and decryption on the server-side.
 * Fixed to use modern Lit Protocol API (v6+)
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { litConfig } from '../../config/lit.config.js';
import { 
  encryptString, 
  decryptToString 
} from '@lit-protocol/encryption';
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers';
import { SiweMessage } from 'siwe';
import { getEVVMWallet } from '../evvm/connector.js';

let litClient = null;

/**
 * Get session signatures for authentication
 * This is the modern way to authenticate with Lit Protocol
 */
async function getSessionSigs() {
  const wallet = getEVVMWallet();
  const address = wallet.address;
  const network = await wallet.provider.getNetwork();
  const chainId = network.chainId;
  
  const domain = "localhost";
  const origin = "https://localhost/login";
  const statement = "Sign in to the Shadow Nox relayer.";
  
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: Number(chainId),
    expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
  });

  const messageToSign = siweMessage.prepareMessage();
  const signature = await wallet.signMessage(messageToSign);

  const authSig = {
    sig: signature,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: messageToSign,
    address: address,
  };

  // Generate session signatures
  const sessionSigs = await litClient.getSessionSigs({
    chain: litConfig.chain || 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LitAbility.LitActionExecution,
      },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, expiration, uri }) => {
      return authSig;
    },
  });

  return sessionSigs;
}

/**
 * Initialize Lit Protocol client
 */
export async function initLitClient() {
  try {
    litClient = new LitNodeClient({
      litNetwork: litConfig.network || LitNetwork.DatilDev,
      debug: false
    });
    
    await litClient.connect();
    console.log('✅ Lit Protocol client connected to', litConfig.network || LitNetwork.DatilDev);
    return litClient;
  } catch (error) {
    console.error('Failed to initialize Lit client:', error);
    throw error;
  }
}

/**
 * Encrypt transaction data with Lit Protocol
 * Using modern unified access control conditions
 */
export async function encryptTransaction(data, userAddress) {
  if (!litClient) throw new Error('Lit client not initialized');

  try {
    const chain = litConfig.chain || 'ethereum';

    // Modern unified access control conditions format
    const accessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: '',
        standardContractType: '',
        chain,
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: '0', // Anyone with a balance can decrypt
        },
      },
    ];

    // Encrypt the data
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions,
        dataToEncrypt: JSON.stringify(data),
      },
      litClient,
    );

    console.log('🔐 Encrypted transaction for', userAddress);

    return {
      encryptedString: ciphertext,
      encryptedSymmetricKey: dataToEncryptHash,
      accessControlConditions, // Store this for decryption
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt transaction data with Lit Protocol
 * Using modern decryptToString method
 */
export async function decryptTransaction(encryptedString, encryptedSymmetricKey, userAddress) {
  if (!litClient) throw new Error('Lit client not initialized');

  try {
    const chain = litConfig.chain || 'ethereum';
    
    // Same access control conditions used for encryption
    const accessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: '',
        standardContractType: '',
        chain,
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: '0',
        },
      },
    ];

    // Get session signatures for decryption
    const sessionSigs = await getSessionSigs();

    // Decrypt using modern API
    const decryptedString = await decryptToString(
      {
        accessControlConditions,
        ciphertext: encryptedString,
        dataToEncryptHash: encryptedSymmetricKey,
        sessionSigs,
        chain,
      },
      litClient,
    );

    console.log('🔓 Decrypted transaction for', userAddress);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

/**
 * Encrypt with user-specific access control
 * Only the specified user address can decrypt
 */
export async function encryptTransactionForUser(data, userAddress) {
  if (!litClient) throw new Error('Lit client not initialized');

  try {
    const chain = litConfig.chain || 'ethereum';

    // Restrict decryption to specific user address
    const accessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: '',
        standardContractType: '',
        chain,
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: userAddress.toLowerCase(),
        },
      },
    ];

    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions,
        dataToEncrypt: JSON.stringify(data),
      },
      litClient,
    );

    console.log('🔐 Encrypted transaction exclusively for', userAddress);

    return {
      encryptedString: ciphertext,
      encryptedSymmetricKey: dataToEncryptHash,
      accessControlConditions,
    };
  } catch (error) {
    console.error('User-specific encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt with stored access control conditions
 * Useful when you store the full encryption metadata
 */
export async function decryptWithStoredConditions(encryptedData) {
  if (!litClient) throw new Error('Lit client not initialized');

  try {
    const sessionSigs = await getSessionSigs();

    const decryptedString = await decryptToString(
      {
        accessControlConditions: encryptedData.accessControlConditions,
        ciphertext: encryptedData.encryptedString,
        dataToEncryptHash: encryptedData.encryptedSymmetricKey,
        sessionSigs,
        chain: litConfig.chain || 'ethereum',
      },
      litClient,
    );

    console.log('🔓 Decrypted transaction with stored conditions');
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption with stored conditions failed:', error);
    throw error;
  }
}

// Utility functions
export function getLitClient() { 
  return litClient; 
}

export async function disconnectLitClient() { 
  if (litClient) {
    await litClient.disconnect();
    console.log('🔌 Lit Protocol client disconnected');
  }
}