/**
 * User Intent Handler
 * Processes user commands and routes to appropriate handlers
 */

import { encryptTransaction } from '../encryption/litClient.js';
import { 
  getEncryptedSwapContract, 
  getAsyncNonceEngineContract,
  getEVVMWallet 
} from '../evvm/connector.js';

/**
 * Handle user intent from any platform
 * @param {Object} intent - User intent object
 * @returns {string} Response message
 */
export async function handleUserIntent(intent) {
  const { platform, userAddress, message } = intent;
  
  const [command, ...args] = message.split(' ');
  
  // For testing, we'll use the bot's own wallet address as the user's identity.
  // In a real app, you would look up the user's registered wallet address here.
  const evmWallet = getEVVMWallet();
  const evmAddress = evmWallet.address;

  switch (command.toLowerCase()) {
    case '/swap':
      // Pass the actual EVM address to the handler
      return await handleSwap(evmAddress, args);
    
    case '/lend':
      return `Lending feature is not yet implemented.`;
    
    case '/portfolio':
       return `Portfolio feature is not yet implemented.`;

    case '/help':
      return getHelpMessage();
    
    default:
      return '❌ Unknown command. Type /help for available commands.';
  }
}

/**
 * Handle swap command
 */
async function handleSwap(userAddress, args) {
  if (args.length < 3) {
    return '❌ Invalid swap format. Usage: /swap <amount> <from> <to>\nExample: /swap 1 ETH USDC';
  }
  
  const [amount, fromToken, toToken] = args;
  
  console.log(`Processing swap: ${amount} ${fromToken} → ${toToken} for ${userAddress}`);

  try {
    const swapData = {
      action: 'swap',
      amount,
      fromToken,
      toToken,
      userAddress,
      timestamp: new Date().toISOString(),
    };

    // Encrypt the transaction data
    const { ciphertext, encryptedSymmetricKey, accessControlConditions } = await encryptTransaction(swapData, userAddress);
    
    // Convert the ciphertext string to hex format for contract
    // The ciphertext is already a string, we just need to convert it to hex
    const encryptedDataHex = '0x' + Buffer.from(ciphertext, 'utf8').toString('hex');
    
    // Get contract instances with signer
    const evmWallet = getEVVMWallet();
    const encryptedSwapContract = getEncryptedSwapContract().connect(evmWallet);
    const asyncNonceEngineContract = getAsyncNonceEngineContract().connect(evmWallet);
    
    // Get the next async nonce for this user
    const lastSettled = await asyncNonceEngineContract.getLastSettledNonce(userAddress);
    const asyncNonce = Number(lastSettled) + 1;

    // Submit the encrypted swap intent to the contract
    console.log(`📝 Submitting swap intent with async nonce: ${asyncNonce}`);
    const tx = await encryptedSwapContract.submitSwapIntent(encryptedDataHex, asyncNonce);
    
    console.log(`📄 Swap intent submitted to EVVM. Tx hash: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    return `🔐 Swap intent received and encrypted:\n` +
           `   - Amount: ${amount} ${fromToken} → ${toToken}\n` +
           `   - Async Nonce: ${asyncNonce}\n` +
           `   - User: ${userAddress}\n\n` +
           `✅ Transaction submitted to EVVM for private execution.\n` +
           `   Tx Hash: \`${tx.hash}\`\n` +
           `   Block: ${receipt.blockNumber}`;

  } catch (error) {
    console.error("Error handling swap:", error);
    
    // Provide detailed error information
    let errorMsg = `❌ Swap failed: ${error.message}`;
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMsg = `❌ Insufficient funds to pay for gas. Please add funds to ${userAddress}`;
    } else if (error.code === 'NONCE_EXPIRED') {
      errorMsg = `❌ Nonce expired. Please try again.`;
    } else if (error.code === 'NETWORK_ERROR') {
      errorMsg = `❌ Network error. Please check your connection and try again.`;
    }
    
    return errorMsg;
  }
}

/**
 * Handle lend command (placeholder for future implementation)
 */
async function handleLend(userAddress, args) {
  // TODO: Implement lending logic
  return `Lending feature coming soon!`;
}

/**
 * Handle portfolio command (placeholder for future implementation)
 */
async function handlePortfolio(userAddress) {
  // TODO: Implement portfolio viewing logic
  return `Portfolio feature coming soon!`;
}

/**
 * Get help message
 */
function getHelpMessage() {
  return `📚 *Shadow Nox Commands*\n\n` +
         `*Trading:*\n` +
         `/swap <amount> <from> <to> - Private swap\n` +
         `   Example: /swap 1 ETH USDC\n\n` +
         `*DeFi:*\n` +
         `/lend - Lending operations (coming soon)\n\n` +
         `*Portfolio:*\n` +
         `/portfolio - View your positions\n\n` +
         `*Info:*\n` +
         `/help - This help message`;
}

export { handleSwap, handleLend, handlePortfolio, getHelpMessage };