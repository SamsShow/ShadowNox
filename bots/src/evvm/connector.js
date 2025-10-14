/**
 * EVVM Virtual Blockchain Connector
 * Handles transaction relay to EVVM instance
 */

import { ethers } from 'ethers';
import { evvmConfig } from '../../config/evvm.config.js';

// Import contract ABIs
import EncryptedSwapAbi from '../../abi/EncryptedSwap.json'  with { type: 'json' };
import AsyncNonceEngineAbi from '../../abi/AsyncNonceEngine.json'  with { type: 'json' };
import dotenv from 'dotenv';
dotenv.config();

let evvmProvider = null;
let evvmWallet = null;
let encryptedSwapContract = null;
let asyncNonceEngineContract = null;

/**
 * Initialize EVVM connector
 */
export async function initEVVMConnector() {
  evvmProvider = new ethers.JsonRpcProvider(evvmConfig.rpcUrl);
  
  const network = await evvmProvider.getNetwork();
  console.log('✅ Connected to EVVM network:', network.name || 'EVVM', 'Chain ID:', network.chainId.toString());
  
  if (!process.env.BOT_PRIVATE_KEY) {
    throw new Error("BOT_PRIVATE_KEY is not set in environment variables.");
  }
  evvmWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, evvmProvider);
  console.log('✅ Bot wallet initialized:', evvmWallet.address);

  // Initialize contract instances
  encryptedSwapContract = new ethers.Contract(
    evvmConfig.contracts.encryptedSwap,
    EncryptedSwapAbi.abi,
    evvmWallet
  );
  asyncNonceEngineContract = new ethers.Contract(
    evvmConfig.contracts.asyncNonceEngine,
    AsyncNonceEngineAbi.abi,
    evvmWallet
  );
  
  console.log(`✅ Contracts loaded at addresses:
    - EncryptedSwap: ${await encryptedSwapContract.getAddress()}
    - AsyncNonceEngine: ${await asyncNonceEngineContract.getAddress()}`);

  return { provider: evvmProvider, wallet: evvmWallet };
}

/**
 * Gets the next available async nonce for a user.
 * @param {string} userAddress The user's EVM address.
 * @returns {Promise<number>} The next nonce.
 */
export async function getNextAsyncNonce(userAddress) {
    if (!asyncNonceEngineContract) throw new Error("AsyncNonceEngine not initialized.");
    const lastSettled = await asyncNonceEngineContract.getLastSettledNonce(userAddress);
    return Number(lastSettled) + 1;
}

// Getter functions
export function getEVVMProvider() { return evvmProvider; }
export function getEVVMWallet() { return evvmWallet; }
export function getEncryptedSwapContract() { return encryptedSwapContract; }
export function getAsyncNonceEngineContract() { return asyncNonceEngineContract; }