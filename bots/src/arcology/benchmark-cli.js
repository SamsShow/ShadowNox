#!/usr/bin/env node

/**
 * Arcology Benchmark CLI
 * 
 * Command-line interface for running Arcology benchmarks
 * 
 * Usage:
 *   npm run benchmark:arcology -- --transactions 10000 --users 100 --pattern user_isolated
 *   npm run benchmark:arcology -- --preset high-throughput
 *   npm run benchmark:arcology -- --compare
 */

import { Command } from 'commander';
import { TransactionBatchGenerator, BatchPattern, generateTestUsers, analyzeParallelism } from './batchGenerator.js';
import { BenchmarkExecutor } from './benchmarkExecutor.js';
import { initArcologyConnector, getEncryptedSwapContract, getAsyncNonceEngineContract } from './connector.js';
import path from 'path';
import fs from 'fs';

const program = new Command();

// Define presets
const PRESETS = {
  'quick': {
    transactions: 100,
    users: 10,
    pattern: 'user_isolated',
    description: 'Quick test with 100 transactions'
  },
  'moderate': {
    transactions: 1000,
    users: 50,
    pattern: 'user_isolated',
    description: 'Moderate test with 1,000 transactions'
  },
  'high-throughput': {
    transactions: 10000,
    users: 100,
    pattern: 'user_isolated',
    description: 'High throughput test - 10,000 transactions'
  },
  'stress': {
    transactions: 15000,
    users: 200,
    pattern: 'mixed',
    description: 'Stress test - 15,000 mixed transactions'
  },
  'conflict': {
    transactions: 1000,
    users: 10,
    pattern: 'high_contention',
    description: 'Conflict test - intentional contention'
  }
};

program
  .name('arcology-benchmark')
  .description('Benchmark Shadow Economy contracts on Arcology parallel blockchain')
  .version('1.0.0');

program
  .command('run')
  .description('Run a benchmark test')
  .option('-t, --transactions <number>', 'Number of transactions', '1000')
  .option('-u, --users <number>', 'Number of test users', '50')
  .option('-p, --pattern <type>', `Batch pattern: ${Object.values(BatchPattern).join(', ')}`, 'user_isolated')
  .option('--preset <name>', `Use a preset: ${Object.keys(PRESETS).join(', ')}`)
  .option('--type <type>', 'Transaction type (swap, async, lending, vault, mixed)', 'mixed')
  .option('--export <path>', 'Export results to JSON file')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options) => {
    try {
      let config = {
        transactions: parseInt(options.transactions),
        users: parseInt(options.users),
        pattern: options.pattern,
        type: options.type,
        verbose: options.verbose
      };
      
      // Apply preset if specified
      if (options.preset) {
        if (!PRESETS[options.preset]) {
          console.error(`❌ Unknown preset: ${options.preset}`);
          console.log(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
          process.exit(1);
        }
        
        const preset = PRESETS[options.preset];
        config = { ...config, ...preset };
        console.log(`\n📋 Using preset: ${options.preset}`);
        console.log(`   ${preset.description}\n`);
      }
      
      await runBenchmark(config, options.export);
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare parallel vs sequential execution')
  .option('-t, --transactions <number>', 'Number of transactions', '100')
  .option('-u, --users <number>', 'Number of test users', '10')
  .option('--export <path>', 'Export comparison results')
  .action(async (options) => {
    try {
      const config = {
        transactions: parseInt(options.transactions),
        users: parseInt(options.users),
        pattern: 'user_isolated'
      };
      
      await runComparison(config, options.export);
    } catch (error) {
      console.error('❌ Comparison failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate transaction batch without executing')
  .option('-t, --transactions <number>', 'Number of transactions', '1000')
  .option('-u, --users <number>', 'Number of test users', '50')
  .option('-p, --pattern <type>', 'Batch pattern', 'user_isolated')
  .option('--type <type>', 'Transaction type', 'mixed')
  .option('-o, --output <path>', 'Output file path', './benchmark-batch.json')
  .action(async (options) => {
    try {
      const config = {
        transactions: parseInt(options.transactions),
        users: parseInt(options.users),
        pattern: options.pattern,
        type: options.type
      };
      
      await generateBatch(config, options.output);
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('presets')
  .description('List available benchmark presets')
  .action(() => {
    console.log('\n📋 Available Benchmark Presets:\n');
    
    for (const [name, preset] of Object.entries(PRESETS)) {
      console.log(`${name.padEnd(20)} - ${preset.description}`);
      console.log(`${''.padEnd(20)}   ${preset.transactions} txs, ${preset.users} users, ${preset.pattern}`);
      console.log('');
    }
  });

/**
 * Run a benchmark test
 */
async function runBenchmark(config, exportPath) {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 ARCOLOGY BENCHMARK - SHADOW ECONOMY');
  console.log('='.repeat(80));
  console.log('');
  console.log('Configuration:');
  console.log(`  Transactions:  ${config.transactions}`);
  console.log(`  Users:         ${config.users}`);
  console.log(`  Pattern:       ${config.pattern}`);
  console.log(`  Type:          ${config.type}`);
  console.log(`  Target TPS:    10,000-15,000`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  
  // Initialize Arcology connection
  console.log('🔗 Connecting to Arcology...');
  await initArcologyConnector();
  
  // Generate test users
  console.log(`\n👥 Generating ${config.users} test users...`);
  const users = generateTestUsers(config.users);
  console.log(`✅ Generated ${users.length} test users`);
  
  // Generate transaction batch
  console.log(`\n📝 Generating ${config.transactions} transactions...`);
  const generator = new TransactionBatchGenerator();
  
  let batch;
  switch (config.type) {
    case 'swap':
      batch = generator.generateSwapIntentBatch(config.transactions, users, config.pattern);
      break;
    case 'async':
      batch = generator.generateAsyncNonceBatch(config.transactions, users, config.pattern);
      break;
    case 'lending':
      batch = generator.generateLendingDepositBatch(config.transactions, users, config.pattern);
      break;
    case 'vault':
      batch = generator.generateVaultDepositBatch(config.transactions, users, config.pattern);
      break;
    case 'mixed':
    default:
      batch = generator.generateMixedBatch(config.transactions, users);
      break;
  }
  
  console.log(`✅ Generated ${batch.length} transactions`);
  
  // Analyze parallelism
  console.log('\n📊 Analyzing batch parallelism...');
  const analysis = analyzeParallelism(batch);
  console.log(`   Unique users:          ${analysis.uniqueUsers}`);
  console.log(`   Max parallelism:       ${analysis.maxParallelism}`);
  console.log(`   Avg txs per user:      ${analysis.avgTransactionsPerUser}`);
  console.log(`   Expected conflicts:    ${analysis.expectedConflicts}`);
  console.log(`   Conflict rate:         ${analysis.conflictRate}`);
  
  // Get contract instances
  const contractInstances = {
    encryptedSwap: getEncryptedSwapContract(),
    asyncNonceEngine: getAsyncNonceEngineContract()
    // Add other contracts as needed
  };
  
  // Execute benchmark
  const executor = new BenchmarkExecutor({ verbose: config.verbose });
  const metrics = await executor.executeParallelBatch(batch, contractInstances);
  
  // Print results
  executor.printResults(metrics);
  
  // Export if requested
  if (exportPath) {
    executor.exportResults(metrics, exportPath);
  }
  
  // Check if target was reached
  if (metrics.performance.reachedTarget) {
    console.log('🎉 Target TPS reached! Arcology parallel execution successful!\n');
  } else {
    console.log(`⚠️  Target TPS not reached. Achieved: ${metrics.performance.tps} TPS\n`);
    console.log('Consider:');
    console.log('  - Increasing user count for more parallelism');
    console.log('  - Using user_isolated pattern');
    console.log('  - Checking network conditions\n');
  }
}

/**
 * Run parallel vs sequential comparison
 */
async function runComparison(config, exportPath) {
  console.log('\n' + '='.repeat(80));
  console.log('⚖️  PARALLEL vs SEQUENTIAL COMPARISON');
  console.log('='.repeat(80));
  console.log('');
  
  // Initialize
  await initArcologyConnector();
  const users = generateTestUsers(config.users);
  const generator = new TransactionBatchGenerator();
  
  // Generate batch
  const batch = generator.generateAsyncNonceBatch(config.transactions, users, config.pattern);
  
  const contractInstances = {
    encryptedSwap: getEncryptedSwapContract(),
    asyncNonceEngine: getAsyncNonceEngineContract()
  };
  
  const executor = new BenchmarkExecutor();
  
  // Run parallel
  console.log('\n1️⃣  Running PARALLEL execution...\n');
  const parallelMetrics = await executor.executeParallelBatch(batch, contractInstances);
  
  // Run sequential
  console.log('\n2️⃣  Running SEQUENTIAL execution...\n');
  const sequentialMetrics = await executor.executeSequentialBatch(batch, contractInstances);
  
  // Compare
  executor.compareResults(parallelMetrics, sequentialMetrics);
  
  // Export
  if (exportPath) {
    const comparison = {
      parallel: parallelMetrics,
      sequential: sequentialMetrics,
      speedup: (parallelMetrics.performance.tps / sequentialMetrics.performance.tps).toFixed(2)
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(comparison, null, 2));
    console.log(`✅ Comparison exported to ${exportPath}\n`);
  }
}

/**
 * Generate batch without executing
 */
async function generateBatch(config, outputPath) {
  console.log('\n📝 Generating transaction batch...\n');
  console.log(`  Transactions:  ${config.transactions}`);
  console.log(`  Users:         ${config.users}`);
  console.log(`  Pattern:       ${config.pattern}`);
  console.log(`  Type:          ${config.type}`);
  console.log('');
  
  const users = generateTestUsers(config.users);
  const generator = new TransactionBatchGenerator();
  
  let batch;
  switch (config.type) {
    case 'swap':
      batch = generator.generateSwapIntentBatch(config.transactions, users, config.pattern);
      break;
    case 'async':
      batch = generator.generateAsyncNonceBatch(config.transactions, users, config.pattern);
      break;
    case 'mixed':
    default:
      batch = generator.generateMixedBatch(config.transactions, users);
      break;
  }
  
  // Export
  generator.exportBatch(batch, outputPath);
  
  // Analyze
  const analysis = analyzeParallelism(batch);
  console.log('\n📊 Batch Analysis:');
  console.log(`  Total transactions:    ${analysis.totalTransactions}`);
  console.log(`  Unique users:          ${analysis.uniqueUsers}`);
  console.log(`  Max parallelism:       ${analysis.maxParallelism}`);
  console.log(`  Expected conflicts:    ${analysis.expectedConflicts}`);
  console.log('');
  console.log('✅ Batch ready for execution!\n');
}

// Parse and execute
program.parse();
