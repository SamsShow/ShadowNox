/**
 * Arcology Benchmark Commands for CLI
 * 
 * Provides benchmark functionality through the Shadow CLI
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Presets configuration
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
    description: 'High throughput test - 10,000 transactions (TPS target)'
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

/**
 * Run benchmark using a preset
 */
async function runPreset() {
  console.log(chalk.cyan('\n📊 Arcology Benchmark - Preset Selection\n'));
  
  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Select a benchmark preset:',
      choices: [
        { name: '⚡ Quick (100 tx, 10 users) - Fast validation', value: 'quick' },
        { name: '📊 Moderate (1K tx, 50 users) - Standard testing', value: 'moderate' },
        { name: '🚀 High-Throughput (10K tx, 100 users) - TPS target test', value: 'high-throughput' },
        { name: '💪 Stress (15K tx, 200 users) - Heavy load test', value: 'stress' },
        { name: '⚠️  Conflict (1K tx, contention) - Stress test conflicts', value: 'conflict' }
      ]
    }
  ]);

  const config = PRESETS[preset];
  console.log(chalk.yellow('\n⚙️  Configuration:'));
  console.log(`   Transactions: ${chalk.green(config.transactions)}`);
  console.log(`   Users:        ${chalk.green(config.users)}`);
  console.log(`   Pattern:      ${chalk.green(config.pattern)}`);
  console.log(`   ${config.description}\n`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Start benchmark?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('❌ Benchmark cancelled\n'));
    return;
  }

  await executeBenchmark(['run', '--preset', preset]);
}

/**
 * Run custom benchmark
 */
async function runCustom() {
  console.log(chalk.cyan('\n📊 Arcology Benchmark - Custom Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'transactions',
      message: 'Number of transactions:',
      default: 1000,
      validate: (input) => input > 0 ? true : 'Must be greater than 0'
    },
    {
      type: 'number',
      name: 'users',
      message: 'Number of test users:',
      default: 50,
      validate: (input) => input > 0 ? true : 'Must be greater than 0'
    },
    {
      type: 'list',
      name: 'pattern',
      message: 'Select batch pattern:',
      choices: [
        { name: '👥 User Isolated (Recommended - Max parallelism)', value: 'user_isolated' },
        { name: '🔀 Independent (High parallelism)', value: 'independent' },
        { name: '🔄 Mixed (Realistic workload)', value: 'mixed' },
        { name: '📝 Sequential (Baseline comparison)', value: 'sequential' },
        { name: '⚠️  High Contention (Stress test)', value: 'high_contention' }
      ],
      default: 'user_isolated'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Transaction type:',
      choices: [
        { name: '🔀 Mixed (All types)', value: 'mixed' },
        { name: '⚡ Async Nonce (Optimal for parallel)', value: 'async' },
        { name: '💱 Swap Intents', value: 'swap' },
        { name: '🏦 Lending Operations', value: 'lending' },
        { name: '🔒 Vault Operations', value: 'vault' }
      ],
      default: 'mixed'
    },
    {
      type: 'confirm',
      name: 'exportResults',
      message: 'Export results to JSON?',
      default: false
    }
  ]);

  console.log(chalk.yellow('\n⚙️  Configuration Summary:'));
  console.log(`   Transactions: ${chalk.green(answers.transactions)}`);
  console.log(`   Users:        ${chalk.green(answers.users)}`);
  console.log(`   Pattern:      ${chalk.green(answers.pattern)}`);
  console.log(`   Type:         ${chalk.green(answers.type)}\n`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Start benchmark?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('❌ Benchmark cancelled\n'));
    return;
  }

  const args = [
    'run',
    '--transactions', answers.transactions.toString(),
    '--users', answers.users.toString(),
    '--pattern', answers.pattern,
    '--type', answers.type
  ];

  if (answers.exportResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    args.push('--export', `benchmark-results-${timestamp}.json`);
  }

  await executeBenchmark(args);
}

/**
 * Compare parallel vs sequential execution
 */
async function compareExecution() {
  console.log(chalk.cyan('\n⚖️  Arcology Benchmark - Parallel vs Sequential Comparison\n'));

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'transactions',
      message: 'Number of transactions to compare:',
      default: 500,
      validate: (input) => input > 0 && input <= 2000 ? true : 'Must be between 1 and 2000 for comparison'
    },
    {
      type: 'number',
      name: 'users',
      message: 'Number of test users:',
      default: 25,
      validate: (input) => input > 0 ? true : 'Must be greater than 0'
    }
  ]);

  console.log(chalk.yellow('\n⚙️  Comparison Configuration:'));
  console.log(`   Transactions: ${chalk.green(answers.transactions)}`);
  console.log(`   Users:        ${chalk.green(answers.users)}`);
  console.log(`   This will run both parallel and sequential modes\n`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Start comparison?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('❌ Comparison cancelled\n'));
    return;
  }

  await executeBenchmark([
    'compare',
    '--transactions', answers.transactions.toString(),
    '--users', answers.users.toString()
  ]);
}

/**
 * Generate batch without executing
 */
async function generateBatch() {
  console.log(chalk.cyan('\n📝 Arcology Benchmark - Generate Transaction Batch\n'));

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'transactions',
      message: 'Number of transactions:',
      default: 1000
    },
    {
      type: 'number',
      name: 'users',
      message: 'Number of test users:',
      default: 50
    },
    {
      type: 'list',
      name: 'pattern',
      message: 'Batch pattern:',
      choices: [
        { name: '👥 User Isolated', value: 'user_isolated' },
        { name: '🔀 Independent', value: 'independent' },
        { name: '🔄 Mixed', value: 'mixed' },
        { name: '📝 Sequential', value: 'sequential' },
        { name: '⚠️  High Contention', value: 'high_contention' }
      ]
    },
    {
      type: 'list',
      name: 'type',
      message: 'Transaction type:',
      choices: [
        { name: '🔀 Mixed', value: 'mixed' },
        { name: '⚡ Async Nonce', value: 'async' },
        { name: '💱 Swap', value: 'swap' },
        { name: '🏦 Lending', value: 'lending' },
        { name: '🔒 Vault', value: 'vault' }
      ]
    },
    {
      type: 'input',
      name: 'output',
      message: 'Output file path:',
      default: 'benchmark-batch.json'
    }
  ]);

  await executeBenchmark([
    'generate',
    '--transactions', answers.transactions.toString(),
    '--users', answers.users.toString(),
    '--pattern', answers.pattern,
    '--type', answers.type,
    '--output', answers.output
  ]);
}

/**
 * List available presets
 */
async function listPresets() {
  console.log(chalk.cyan('\n📋 Available Benchmark Presets:\n'));

  for (const [name, config] of Object.entries(PRESETS)) {
    console.log(chalk.yellow(`${name.padEnd(20)}`));
    console.log(`  ${config.description}`);
    console.log(`  ${chalk.gray(`${config.transactions} txs, ${config.users} users, ${config.pattern}`)}\n`);
  }

  console.log(chalk.gray('Use ') + chalk.cyan('benchmark:preset') + chalk.gray(' to run a preset\n'));
}

/**
 * Show benchmark information
 */
async function showInfo() {
  console.log(chalk.cyan('\n📊 Arcology Benchmark System\n'));
  console.log('Test Shadow Economy contracts on Arcology parallel blockchain');
  console.log(chalk.yellow('Target: 10,000-15,000 TPS\n'));

  console.log(chalk.cyan('Available Commands:\n'));
  console.log(`  ${chalk.green('benchmark:preset')}    - Run a preset benchmark`);
  console.log(`  ${chalk.green('benchmark:custom')}    - Run custom benchmark`);
  console.log(`  ${chalk.green('benchmark:compare')}   - Compare parallel vs sequential`);
  console.log(`  ${chalk.green('benchmark:generate')}  - Generate transaction batch`);
  console.log(`  ${chalk.green('benchmark:presets')}   - List all presets`);
  console.log(`  ${chalk.green('benchmark:info')}      - Show this information\n`);

  console.log(chalk.cyan('Transaction Types:\n'));
  console.log(`  ${chalk.yellow('swap')}       - Encrypted swap intents`);
  console.log(`  ${chalk.yellow('async')}      - Async nonce (optimal for parallelism) ⭐`);
  console.log(`  ${chalk.yellow('lending')}    - Lending operations`);
  console.log(`  ${chalk.yellow('vault')}      - Vault operations`);
  console.log(`  ${chalk.yellow('mixed')}      - Mix of all types\n`);

  console.log(chalk.cyan('Batch Patterns:\n'));
  console.log(`  ${chalk.yellow('user_isolated')}    - Max parallelism (recommended) ⭐`);
  console.log(`  ${chalk.yellow('independent')}      - High parallelism`);
  console.log(`  ${chalk.yellow('sequential')}       - Baseline comparison`);
  console.log(`  ${chalk.yellow('mixed')}            - Realistic workload`);
  console.log(`  ${chalk.yellow('high_contention')}  - Stress test\n`);

  console.log(chalk.gray('Documentation: docs/ARCOLOGY_BENCHMARK.md\n'));
}

/**
 * Execute benchmark CLI
 */
async function executeBenchmark(args) {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyan('\n🚀 Starting benchmark...\n'));

    // Path to the benchmark CLI script
    const botsDir = path.resolve(__dirname, '../../../bots');
    const scriptPath = path.join(botsDir, 'src/arcology/benchmark-cli.js');

    const child = spawn('node', [scriptPath, ...args], {
      cwd: botsDir,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✅ Benchmark completed successfully!\n'));
        resolve();
      } else {
        console.log(chalk.red(`\n❌ Benchmark failed with exit code ${code}\n`));
        reject(new Error(`Benchmark failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.log(chalk.red(`\n❌ Failed to start benchmark: ${error.message}\n`));
      reject(error);
    });
  });
}

export const benchmarkCommands = {
  runPreset,
  runCustom,
  compareExecution,
  generateBatch,
  listPresets,
  showInfo
};
