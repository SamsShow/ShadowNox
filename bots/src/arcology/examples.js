/**
 * Example: Using Arcology Benchmark System
 * 
 * This example demonstrates how to use the transaction batch generator
 * and benchmark executor programmatically.
 */

import { 
  TransactionBatchGenerator, 
  BatchPattern, 
  TransactionType,
  generateTestUsers,
  analyzeParallelism 
} from './batchGenerator.js';
import { BenchmarkExecutor } from './benchmarkExecutor.js';
import { initArcologyConnector } from './connector.js';

/**
 * Example 1: Generate and analyze a batch
 */
async function example1_generateBatch() {
  console.log('\n=== Example 1: Generate Transaction Batch ===\n');
  
  // Generate test users
  const users = generateTestUsers(50);
  console.log(`Generated ${users.length} test users`);
  
  // Create generator
  const generator = new TransactionBatchGenerator();
  
  // Generate swap intent batch
  const swapBatch = generator.generateSwapIntentBatch(
    100, 
    users, 
    BatchPattern.USER_ISOLATED
  );
  
  console.log(`Generated ${swapBatch.length} swap transactions`);
  
  // Analyze parallelism
  const analysis = analyzeParallelism(swapBatch);
  console.log('\nParallelism Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
  
  // Export batch
  generator.exportBatch(swapBatch, './examples/swap-batch.json');
}

/**
 * Example 2: Generate mixed transaction batch
 */
async function example2_mixedBatch() {
  console.log('\n=== Example 2: Mixed Transaction Batch ===\n');
  
  const users = generateTestUsers(100);
  const generator = new TransactionBatchGenerator();
  
  // Custom distribution
  const distribution = {
    [TransactionType.SWAP_INTENT]: 0.5,      // 50% swaps
    [TransactionType.ASYNC_NONCE]: 0.3,      // 30% async nonce
    [TransactionType.VAULT_DEPOSIT]: 0.2     // 20% vault deposits
  };
  
  const mixedBatch = generator.generateMixedBatch(1000, users, distribution);
  
  console.log(`Generated mixed batch: ${mixedBatch.length} transactions`);
  
  // Count by type
  const typeCounts = mixedBatch.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nTransaction Type Distribution:');
  console.log(JSON.stringify(typeCounts, null, 2));
}

/**
 * Example 3: Compare different patterns
 */
async function example3_comparePatterns() {
  console.log('\n=== Example 3: Compare Batch Patterns ===\n');
  
  const users = generateTestUsers(50);
  const generator = new TransactionBatchGenerator();
  const txCount = 500;
  
  // Generate batches with different patterns
  const patterns = [
    BatchPattern.USER_ISOLATED,
    BatchPattern.INDEPENDENT,
    BatchPattern.MIXED,
    BatchPattern.HIGH_CONTENTION
  ];
  
  for (const pattern of patterns) {
    const batch = generator.generateAsyncNonceBatch(txCount, users, pattern);
    const analysis = analyzeParallelism(batch);
    
    console.log(`\nPattern: ${pattern}`);
    console.log(`  Max Parallelism:    ${analysis.maxParallelism}`);
    console.log(`  Expected Conflicts: ${analysis.expectedConflicts}`);
    console.log(`  Conflict Rate:      ${analysis.conflictRate}`);
  }
}

/**
 * Example 4: Generate high-throughput batch
 */
async function example4_highThroughput() {
  console.log('\n=== Example 4: High Throughput Batch (10K TPS Target) ===\n');
  
  // For high TPS, we need:
  // 1. Many users (more parallelism)
  // 2. User-isolated pattern
  // 3. Simple transactions (async nonce is optimal)
  
  const userCount = 200;
  const txCount = 15000;
  
  console.log('Configuration for 10K+ TPS:');
  console.log(`  Users:        ${userCount}`);
  console.log(`  Transactions: ${txCount}`);
  console.log(`  Pattern:      user_isolated`);
  console.log(`  Type:         async_nonce (optimal for parallel)`);
  console.log('');
  
  const users = generateTestUsers(userCount);
  const generator = new TransactionBatchGenerator();
  
  const batch = generator.generateAsyncNonceBatch(
    txCount,
    users,
    BatchPattern.USER_ISOLATED
  );
  
  const analysis = analyzeParallelism(batch);
  
  console.log('Batch Analysis:');
  console.log(`  Total Transactions:     ${analysis.totalTransactions}`);
  console.log(`  Unique Users:           ${analysis.uniqueUsers}`);
  console.log(`  Max Parallelism:        ${analysis.maxParallelism}`);
  console.log(`  Avg Txs per User:       ${analysis.avgTransactionsPerUser}`);
  console.log(`  Expected Conflict Rate: ${analysis.conflictRate}`);
  console.log('');
  console.log('Expected Performance:');
  console.log(`  ✅ High parallelism (${analysis.maxParallelism} concurrent users)`);
  console.log(`  ✅ Low conflicts (${analysis.conflictRate})`);
  console.log(`  ✅ Optimal for 10K-15K TPS target`);
  
  // Export for later execution
  generator.exportBatch(batch, './examples/high-throughput-batch.json');
}

/**
 * Example 5: Sequential batch (for comparison baseline)
 */
async function example5_sequential() {
  console.log('\n=== Example 5: Sequential Batch (Baseline) ===\n');
  
  const user = generateTestUsers(1)[0]; // Single user
  const generator = new TransactionBatchGenerator();
  
  const batch = generator.generateSequentialBatch(100, user);
  
  console.log(`Generated sequential batch: ${batch.length} transactions`);
  console.log('Note: All transactions must execute in order');
  console.log('Use this for comparing parallel vs sequential performance\n');
  
  // Show dependencies
  console.log('First 5 transactions:');
  batch.slice(0, 5).forEach(tx => {
    console.log(`  ${tx.id}: depends on ${tx.metadata.dependsOn || 'none'}`);
  });
}

/**
 * Example 6: Stress test with intentional conflicts
 */
async function example6_stressTest() {
  console.log('\n=== Example 6: Stress Test (High Contention) ===\n');
  
  const users = generateTestUsers(10);
  const generator = new TransactionBatchGenerator();
  
  // Generate high-contention batch
  const batch = generator.generateHighContentionBatch(1000, users);
  
  console.log('High-contention batch generated');
  console.log(`  Transactions: ${batch.length}`);
  console.log(`  All targeting same storage slots`);
  console.log(`  Purpose: Test Arcology's conflict resolution`);
  console.log('');
  console.log('Expected Behavior:');
  console.log('  - High conflict rate (>50%)');
  console.log('  - Automatic retries by Arcology');
  console.log('  - Lower TPS but all transactions eventually succeed');
  
  const analysis = analyzeParallelism(batch);
  console.log(`\nExpected Conflicts: ${analysis.expectedConflicts}`);
  console.log(`Conflict Rate: ${analysis.conflictRate}`);
}

/**
 * Example 7: Custom batch generation
 */
async function example7_custom() {
  console.log('\n=== Example 7: Custom Batch Generation ===\n');
  
  const users = generateTestUsers(30);
  const generator = new TransactionBatchGenerator();
  
  // Mix different batch types
  const swaps = generator.generateSwapIntentBatch(200, users);
  const asyncTxs = generator.generateAsyncNonceBatch(300, users);
  const deposits = generator.generateVaultDepositBatch(150, users);
  
  // Combine into single batch
  const customBatch = [
    ...swaps,
    ...asyncTxs,
    ...deposits
  ];
  
  // Shuffle for realistic load
  const shuffled = generator.shuffleArray(customBatch);
  
  console.log('Custom batch created:');
  console.log(`  Swaps:         ${swaps.length}`);
  console.log(`  Async Nonce:   ${asyncTxs.length}`);
  console.log(`  Vault Deposits: ${deposits.length}`);
  console.log(`  Total:         ${shuffled.length}`);
  
  const analysis = analyzeParallelism(shuffled);
  console.log(`\nMax Parallelism: ${analysis.maxParallelism}`);
  console.log('Type Distribution:', analysis.typeDistribution);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('\n' + '='.repeat(80));
  console.log('ARCOLOGY BENCHMARK SYSTEM - EXAMPLES');
  console.log('='.repeat(80));
  
  try {
    await example1_generateBatch();
    await example2_mixedBatch();
    await example3_comparePatterns();
    await example4_highThroughput();
    await example5_sequential();
    await example6_stressTest();
    await example7_custom();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(80));
    console.log('\nNext steps:');
    console.log('  1. Review generated batches in ./examples/');
    console.log('  2. Execute batches using BenchmarkExecutor');
    console.log('  3. Run: npm run benchmark:quick to test on Arcology');
    console.log('');
  } catch (error) {
    console.error('❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_generateBatch,
  example2_mixedBatch,
  example3_comparePatterns,
  example4_highThroughput,
  example5_sequential,
  example6_stressTest,
  example7_custom
};
