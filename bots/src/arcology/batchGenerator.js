/**
 * Arcology Transaction Batch Generator
 * 
 * Generates transaction batches for benchmarking parallel execution on Arcology
 * 
 * Features:
 * - Generate batches of various transaction types
 * - Support for concurrent user simulations
 * - Configurable batch sizes and patterns
 * - Transaction interdependency management
 * 
 * Target: 10,000-15,000 TPS on Arcology
 */

import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Transaction types for benchmarking
 */
export const TransactionType = {
  SWAP_INTENT: 'swapIntent',
  SETTLE_SWAP: 'settleSwap',
  ASYNC_NONCE: 'asyncNonce',
  LENDING_DEPOSIT: 'lendingDeposit',
  LENDING_BORROW: 'lendingBorrow',
  VAULT_DEPOSIT: 'vaultDeposit',
  VAULT_WITHDRAW: 'vaultWithdraw'
};

/**
 * Batch generation patterns
 */
export const BatchPattern = {
  INDEPENDENT: 'independent',      // All transactions independent (max parallelism)
  SEQUENTIAL: 'sequential',         // Strict ordering required
  MIXED: 'mixed',                   // Mix of independent and dependent
  USER_ISOLATED: 'user_isolated',   // Per-user isolation (optimal for Arcology)
  HIGH_CONTENTION: 'high_contention' // Intentional conflicts for stress testing
};

/**
 * Transaction Batch Generator
 */
export class TransactionBatchGenerator {
  constructor(config = {}) {
    this.config = {
      defaultGasLimit: config.gasLimit || 500000,
      defaultGasPrice: config.gasPrice || ethers.parseUnits('1', 'gwei'),
      ...config
    };
    
    this.transactionCounter = 0;
  }

  /**
   * Generate a batch of swap intent transactions
   * 
   * @param {number} count - Number of transactions to generate
   * @param {Array<Object>} users - Array of user objects with {address, privateKey}
   * @param {string} pattern - Batch pattern (BatchPattern enum)
   * @returns {Array<Object>} Array of transaction objects
   */
  generateSwapIntentBatch(count, users, pattern = BatchPattern.USER_ISOLATED) {
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const user = this.selectUser(users, i, pattern);
      
      // Generate swap parameters
      const tokenIn = this.randomToken();
      const tokenOut = this.randomToken(tokenIn);
      const amountIn = this.randomAmount(1, 1000);
      const minAmountOut = this.randomAmount(0.9, 900);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      
      const tx = {
        id: `swap_${this.transactionCounter++}`,
        type: TransactionType.SWAP_INTENT,
        user: user,
        params: {
          tokenIn,
          tokenOut,
          amountIn,
          minAmountOut,
          deadline
        },
        metadata: {
          batchIndex: i,
          pattern,
          timestamp: Date.now()
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Generate async nonce transactions
   * Optimal for parallel execution - each user manages independent nonces
   * 
   * @param {number} count - Number of transactions
   * @param {Array<Object>} users - User objects
   * @param {string} pattern - Batch pattern
   * @returns {Array<Object>} Transaction batch
   */
  generateAsyncNonceBatch(count, users, pattern = BatchPattern.USER_ISOLATED) {
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const user = this.selectUser(users, i, pattern);
      
      // Each user can have multiple async nonces in flight
      const nonce = Math.floor(Math.random() * 100);
      const data = ethers.hexlify(ethers.randomBytes(32));
      
      const tx = {
        id: `async_${this.transactionCounter++}`,
        type: TransactionType.ASYNC_NONCE,
        user: user,
        params: {
          nonce,
          data,
          timestamp: Date.now()
        },
        metadata: {
          batchIndex: i,
          pattern,
          expectedParallel: pattern === BatchPattern.USER_ISOLATED
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Generate lending deposit transactions
   * 
   * @param {number} count - Number of transactions
   * @param {Array<Object>} users - User objects
   * @param {string} pattern - Batch pattern
   * @returns {Array<Object>} Transaction batch
   */
  generateLendingDepositBatch(count, users, pattern = BatchPattern.USER_ISOLATED) {
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const user = this.selectUser(users, i, pattern);
      const token = this.randomToken();
      const amount = this.randomAmount(100, 10000);
      
      const tx = {
        id: `deposit_${this.transactionCounter++}`,
        type: TransactionType.LENDING_DEPOSIT,
        user: user,
        params: {
          token,
          amount
        },
        metadata: {
          batchIndex: i,
          pattern
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Generate vault deposit transactions
   * Excellent parallel performance - isolated per-user storage
   * 
   * @param {number} count - Number of transactions
   * @param {Array<Object>} users - User objects
   * @param {string} pattern - Batch pattern
   * @returns {Array<Object>} Transaction batch
   */
  generateVaultDepositBatch(count, users, pattern = BatchPattern.USER_ISOLATED) {
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const user = this.selectUser(users, i, pattern);
      const amount = this.randomAmount(10, 1000);
      const lockPeriod = Math.floor(Math.random() * 365) + 1; // 1-365 days
      
      const tx = {
        id: `vault_deposit_${this.transactionCounter++}`,
        type: TransactionType.VAULT_DEPOSIT,
        user: user,
        params: {
          amount,
          lockPeriod
        },
        metadata: {
          batchIndex: i,
          pattern,
          expectedParallel: true // Vault operations are highly parallel
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Generate mixed transaction batch
   * Combines different transaction types
   * 
   * @param {number} count - Total number of transactions
   * @param {Array<Object>} users - User objects
   * @param {Object} distribution - Distribution of transaction types
   * @returns {Array<Object>} Mixed transaction batch
   */
  generateMixedBatch(count, users, distribution = null) {
    const defaultDist = {
      [TransactionType.SWAP_INTENT]: 0.4,
      [TransactionType.ASYNC_NONCE]: 0.3,
      [TransactionType.LENDING_DEPOSIT]: 0.2,
      [TransactionType.VAULT_DEPOSIT]: 0.1
    };
    
    const dist = distribution || defaultDist;
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const txType = this.selectTransactionType(dist);
      const user = this.selectUser(users, i, BatchPattern.USER_ISOLATED);
      
      let tx;
      switch (txType) {
        case TransactionType.SWAP_INTENT:
          tx = this.generateSwapIntentBatch(1, [user])[0];
          break;
        case TransactionType.ASYNC_NONCE:
          tx = this.generateAsyncNonceBatch(1, [user])[0];
          break;
        case TransactionType.LENDING_DEPOSIT:
          tx = this.generateLendingDepositBatch(1, [user])[0];
          break;
        case TransactionType.VAULT_DEPOSIT:
          tx = this.generateVaultDepositBatch(1, [user])[0];
          break;
      }
      
      if (tx) {
        tx.metadata.mixedBatch = true;
        batch.push(tx);
      }
    }
    
    // Shuffle for realistic mixed load
    return this.shuffleArray(batch);
  }

  /**
   * Generate high-contention batch for stress testing
   * Intentionally creates conflicts to test Arcology's conflict resolution
   * 
   * @param {number} count - Number of transactions
   * @param {Array<Object>} users - User objects
   * @returns {Array<Object>} High-contention batch
   */
  generateHighContentionBatch(count, users) {
    // All transactions target the same storage slots
    const targetUser = users[0];
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const tx = {
        id: `contention_${this.transactionCounter++}`,
        type: TransactionType.ASYNC_NONCE,
        user: targetUser,
        params: {
          nonce: 1, // Same nonce for all - intentional conflict
          data: ethers.hexlify(ethers.randomBytes(32)),
          timestamp: Date.now()
        },
        metadata: {
          batchIndex: i,
          pattern: BatchPattern.HIGH_CONTENTION,
          expectedConflict: true
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Generate sequential batch
   * Each transaction depends on the previous one
   * 
   * @param {number} count - Number of transactions
   * @param {Object} user - Single user object
   * @returns {Array<Object>} Sequential batch
   */
  generateSequentialBatch(count, user) {
    const batch = [];
    let currentNonce = 0;
    
    for (let i = 0; i < count; i++) {
      const tx = {
        id: `sequential_${this.transactionCounter++}`,
        type: TransactionType.ASYNC_NONCE,
        user: user,
        params: {
          nonce: currentNonce++,
          data: ethers.hexlify(ethers.randomBytes(32)),
          timestamp: Date.now()
        },
        metadata: {
          batchIndex: i,
          pattern: BatchPattern.SEQUENTIAL,
          dependsOn: i > 0 ? `sequential_${this.transactionCounter - 2}` : null,
          expectedParallel: false
        }
      };
      
      batch.push(tx);
    }
    
    return batch;
  }

  /**
   * Export batch to JSON format
   * 
   * @param {Array<Object>} batch - Transaction batch
   * @param {string} filePath - Output file path
   */
  exportBatch(batch, filePath) {
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        transactionCount: batch.length,
        patterns: [...new Set(batch.map(tx => tx.metadata.pattern))],
        types: [...new Set(batch.map(tx => tx.type))]
      },
      transactions: batch
    };
    
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log(`✅ Batch exported to ${filePath}`);
  }

  // Helper methods

  selectUser(users, index, pattern) {
    switch (pattern) {
      case BatchPattern.USER_ISOLATED:
      case BatchPattern.INDEPENDENT:
        // Round-robin distribution for maximum parallelism
        return users[index % users.length];
      
      case BatchPattern.HIGH_CONTENTION:
        // All use first user
        return users[0];
      
      case BatchPattern.SEQUENTIAL:
      case BatchPattern.MIXED:
      default:
        // Random selection
        return users[Math.floor(Math.random() * users.length)];
    }
  }

  selectTransactionType(distribution) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, prob] of Object.entries(distribution)) {
      cumulative += prob;
      if (rand <= cumulative) {
        return type;
      }
    }
    
    return TransactionType.SWAP_INTENT;
  }

  randomToken(excludeToken = null) {
    const tokens = ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC'];
    let token;
    do {
      token = tokens[Math.floor(Math.random() * tokens.length)];
    } while (token === excludeToken);
    return token;
  }

  randomAmount(min, max) {
    const value = Math.random() * (max - min) + min;
    return ethers.parseUnits(value.toFixed(6), 18).toString();
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Generate test users for benchmarking
 * 
 * @param {number} count - Number of users to generate
 * @returns {Array<Object>} Array of user objects
 */
export function generateTestUsers(count) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const wallet = ethers.Wallet.createRandom();
    users.push({
      id: i,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    });
  }
  
  return users;
}

/**
 * Calculate expected parallelism for a batch
 * 
 * @param {Array<Object>} batch - Transaction batch
 * @returns {Object} Parallelism analysis
 */
export function analyzeParallelism(batch) {
  const userGroups = new Map();
  const typeDistribution = {};
  let expectedConflicts = 0;
  
  for (const tx of batch) {
    // Group by user
    if (!userGroups.has(tx.user.address)) {
      userGroups.set(tx.user.address, []);
    }
    userGroups.get(tx.user.address).push(tx);
    
    // Count types
    typeDistribution[tx.type] = (typeDistribution[tx.type] || 0) + 1;
    
    // Count expected conflicts
    if (tx.metadata.expectedConflict) {
      expectedConflicts++;
    }
  }
  
  const maxParallelism = userGroups.size;
  const avgTxPerUser = batch.length / userGroups.size;
  
  return {
    totalTransactions: batch.length,
    uniqueUsers: userGroups.size,
    maxParallelism,
    avgTransactionsPerUser: avgTxPerUser.toFixed(2),
    typeDistribution,
    expectedConflicts,
    conflictRate: ((expectedConflicts / batch.length) * 100).toFixed(2) + '%'
  };
}

export default TransactionBatchGenerator;
