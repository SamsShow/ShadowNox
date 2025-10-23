/**
 * Integration Tests for Arcology Benchmark System
 * 
 * Tests the complete benchmarking flow:
 * - Batch generation
 * - Transaction submission
 * - Performance measurement
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { 
  TransactionBatchGenerator, 
  BatchPattern, 
  TransactionType,
  generateTestUsers,
  analyzeParallelism 
} from '../src/arcology/batchGenerator.js';

describe('Transaction Batch Generator', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
    users = generateTestUsers(10);
  });

  test('should generate test users with valid addresses', () => {
    expect(users).toHaveLength(10);
    users.forEach(user => {
      expect(user).toHaveProperty('address');
      expect(user).toHaveProperty('privateKey');
      expect(user.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  test('should generate swap intent batch', () => {
    const batch = generator.generateSwapIntentBatch(
      50,
      users,
      BatchPattern.USER_ISOLATED
    );

    expect(batch).toHaveLength(50);
    batch.forEach(tx => {
      expect(tx.type).toBe(TransactionType.SWAP_INTENT);
      expect(tx).toHaveProperty('id');
      expect(tx).toHaveProperty('params');
      expect(tx.params).toHaveProperty('tokenIn');
      expect(tx.params).toHaveProperty('tokenOut');
      expect(tx.params).toHaveProperty('amountIn');
    });
  });

  test('should generate async nonce batch', () => {
    const batch = generator.generateAsyncNonceBatch(
      100,
      users,
      BatchPattern.USER_ISOLATED
    );

    expect(batch).toHaveLength(100);
    batch.forEach(tx => {
      expect(tx.type).toBe(TransactionType.ASYNC_NONCE);
      expect(tx.params).toHaveProperty('nonce');
      expect(tx.params).toHaveProperty('data');
    });
  });

  test('should generate mixed batch with correct distribution', () => {
    const distribution = {
      [TransactionType.SWAP_INTENT]: 0.5,
      [TransactionType.ASYNC_NONCE]: 0.3,
      [TransactionType.VAULT_DEPOSIT]: 0.2
    };

    const batch = generator.generateMixedBatch(1000, users, distribution);
    expect(batch).toHaveLength(1000);

    // Count types
    const typeCounts = batch.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {});

    // Check approximate distribution (allow 10% variance)
    expect(typeCounts[TransactionType.SWAP_INTENT]).toBeGreaterThan(450);
    expect(typeCounts[TransactionType.SWAP_INTENT]).toBeLessThan(550);
    expect(typeCounts[TransactionType.ASYNC_NONCE]).toBeGreaterThan(250);
    expect(typeCounts[TransactionType.ASYNC_NONCE]).toBeLessThan(350);
  });

  test('should generate high contention batch', () => {
    const batch = generator.generateHighContentionBatch(100, users);
    
    expect(batch).toHaveLength(100);
    
    // All transactions should target the same user
    const targetUser = batch[0].user.address;
    batch.forEach(tx => {
      expect(tx.user.address).toBe(targetUser);
      expect(tx.metadata.expectedConflict).toBe(true);
    });
  });

  test('should generate sequential batch with dependencies', () => {
    const user = users[0];
    const batch = generator.generateSequentialBatch(50, user);

    expect(batch).toHaveLength(50);
    
    // First transaction has no dependency
    expect(batch[0].metadata.dependsOn).toBeNull();
    
    // Others depend on previous
    for (let i = 1; i < batch.length; i++) {
      expect(batch[i].metadata.dependsOn).toBeTruthy();
    }
  });

  test('should generate vault deposit batch', () => {
    const batch = generator.generateVaultDepositBatch(
      30,
      users,
      BatchPattern.USER_ISOLATED
    );

    expect(batch).toHaveLength(30);
    batch.forEach(tx => {
      expect(tx.type).toBe(TransactionType.VAULT_DEPOSIT);
      expect(tx.params).toHaveProperty('amount');
      expect(tx.params).toHaveProperty('lockPeriod');
    });
  });
});

describe('Parallelism Analysis', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
    users = generateTestUsers(20);
  });

  test('should analyze user-isolated batch correctly', () => {
    const batch = generator.generateAsyncNonceBatch(
      100,
      users,
      BatchPattern.USER_ISOLATED
    );

    const analysis = analyzeParallelism(batch);

    expect(analysis.totalTransactions).toBe(100);
    expect(analysis.uniqueUsers).toBeLessThanOrEqual(20);
    expect(analysis.maxParallelism).toBeGreaterThan(0);
    expect(analysis).toHaveProperty('avgTransactionsPerUser');
    expect(analysis).toHaveProperty('typeDistribution');
    expect(analysis).toHaveProperty('conflictRate');
  });

  test('should detect high contention in conflict batch', () => {
    const batch = generator.generateHighContentionBatch(100, users);
    const analysis = analyzeParallelism(batch);

    expect(analysis.uniqueUsers).toBe(1);
    expect(analysis.expectedConflicts).toBeGreaterThan(0);
    expect(parseFloat(analysis.conflictRate)).toBeGreaterThan(0);
  });

  test('should show optimal parallelism for user-isolated pattern', () => {
    const batch = generator.generateAsyncNonceBatch(
      200,
      users,
      BatchPattern.USER_ISOLATED
    );

    const analysis = analyzeParallelism(batch);

    // With 20 users and 200 transactions, max parallelism should be 20
    expect(analysis.maxParallelism).toBeLessThanOrEqual(20);
    expect(analysis.uniqueUsers).toBeGreaterThan(1);
  });
});

describe('Batch Patterns', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
    users = generateTestUsers(10);
  });

  test('USER_ISOLATED pattern should distribute across users', () => {
    const batch = generator.generateAsyncNonceBatch(
      100,
      users,
      BatchPattern.USER_ISOLATED
    );

    const userSet = new Set(batch.map(tx => tx.user.address));
    expect(userSet.size).toBeGreaterThan(1);
  });

  test('HIGH_CONTENTION pattern should use single user', () => {
    const batch = generator.generateAsyncNonceBatch(
      100,
      users,
      BatchPattern.HIGH_CONTENTION
    );

    const userSet = new Set(batch.map(tx => tx.user.address));
    expect(userSet.size).toBe(1);
  });

  test('SEQUENTIAL pattern should create dependencies', () => {
    const user = users[0];
    const batch = generator.generateSequentialBatch(20, user);

    expect(batch[0].metadata.dependsOn).toBeNull();
    
    for (let i = 1; i < batch.length; i++) {
      expect(batch[i].metadata.dependsOn).toBeTruthy();
      expect(batch[i].metadata.expectedParallel).toBe(false);
    }
  });
});

describe('Transaction Types', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
    users = generateTestUsers(5);
  });

  test('swap transactions should have valid parameters', () => {
    const batch = generator.generateSwapIntentBatch(10, users);

    batch.forEach(tx => {
      expect(tx.params.tokenIn).toBeTruthy();
      expect(tx.params.tokenOut).toBeTruthy();
      expect(tx.params.tokenIn).not.toBe(tx.params.tokenOut);
      expect(tx.params.amountIn).toBeTruthy();
      expect(tx.params.minAmountOut).toBeTruthy();
      expect(tx.params.deadline).toBeGreaterThan(Date.now() / 1000);
    });
  });

  test('async nonce transactions should have unique data', () => {
    const batch = generator.generateAsyncNonceBatch(20, users);

    const dataSet = new Set(batch.map(tx => tx.params.data));
    expect(dataSet.size).toBe(20); // All unique
  });

  test('vault deposits should have reasonable lock periods', () => {
    const batch = generator.generateVaultDepositBatch(15, users);

    batch.forEach(tx => {
      expect(tx.params.lockPeriod).toBeGreaterThanOrEqual(1);
      expect(tx.params.lockPeriod).toBeLessThanOrEqual(365);
      expect(tx.params.amount).toBeTruthy();
    });
  });
});

describe('Batch Export', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
    users = generateTestUsers(5);
  });

  test('should export batch to JSON format', () => {
    const batch = generator.generateAsyncNonceBatch(10, users);
    const tempFile = './test-batch-export.json';

    // Mock file system for testing
    const originalWriteFileSync = require('fs').writeFileSync;
    let exportedData;
    
    require('fs').writeFileSync = (path, data) => {
      exportedData = JSON.parse(data);
    };

    generator.exportBatch(batch, tempFile);

    expect(exportedData).toHaveProperty('metadata');
    expect(exportedData).toHaveProperty('transactions');
    expect(exportedData.transactions).toHaveLength(10);
    expect(exportedData.metadata.transactionCount).toBe(10);

    // Restore
    require('fs').writeFileSync = originalWriteFileSync;
  });
});

describe('Performance Expectations', () => {
  let generator;
  let users;

  beforeAll(() => {
    generator = new TransactionBatchGenerator();
  });

  test('should generate 10,000 transactions quickly', () => {
    users = generateTestUsers(100);
    
    const startTime = Date.now();
    const batch = generator.generateAsyncNonceBatch(10000, users);
    const duration = Date.now() - startTime;

    expect(batch).toHaveLength(10000);
    expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
  });

  test('optimal batch should have high parallelism potential', () => {
    users = generateTestUsers(200);
    const batch = generator.generateAsyncNonceBatch(
      15000,
      users,
      BatchPattern.USER_ISOLATED
    );

    const analysis = analyzeParallelism(batch);

    // For 10K-15K TPS, we need good parallelism
    expect(analysis.maxParallelism).toBeGreaterThanOrEqual(100);
    expect(parseFloat(analysis.conflictRate)).toBeLessThan(1); // < 1% conflicts
  });
});
