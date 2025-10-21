#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config } from 'dotenv';
import { encryptedSwapCommands } from './commands/encryptedSwap.js';
import { lendingCommands } from './commands/lending.js';
import { pythAdapterCommands } from './commands/pythAdapter.js';
import { utilCommands } from './commands/utils.js';
import { displayBanner } from './utils/display.js';

// Load environment variables
config();

program
  .name('shadow-cli')
  .description('CLI for testing Shadow Economy smart contracts on-chain')
  .version('1.0.0');

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive testing mode')
  .action(async () => {
    displayBanner();
    await interactiveMode();
  });

// EncryptedSwap commands
program
  .command('swap:submit')
  .description('Submit a new swap intent')
  .action(encryptedSwapCommands.submitSwapIntent);

program
  .command('swap:execute <intentId>')
  .description('Execute a submitted swap intent')
  .action(encryptedSwapCommands.executeSwap);

program
  .command('swap:cancel <intentId>')
  .description('Cancel a submitted swap intent')
  .action(encryptedSwapCommands.cancelSwap);

program
  .command('swap:get <intentId>')
  .description('Get details of a swap intent')
  .action(encryptedSwapCommands.getSwapIntent);

program
  .command('swap:stats')
  .description('Get swap statistics')
  .action(encryptedSwapCommands.getStats);

// SimpleLending commands
program
  .command('lending:deposit')
  .description('Deposit funds into lending pool')
  .action(lendingCommands.deposit);

program
  .command('lending:withdraw')
  .description('Withdraw funds from lending pool')
  .action(lendingCommands.withdraw);

program
  .command('lending:borrow')
  .description('Borrow funds from lending pool')
  .action(lendingCommands.borrow);

program
  .command('lending:repay')
  .description('Repay borrowed funds')
  .action(lendingCommands.repay);

program
  .command('lending:add-collateral')
  .description('Add collateral to account')
  .action(lendingCommands.addCollateral);

program
  .command('lending:account')
  .description('View account details')
  .action(lendingCommands.getAccount);

program
  .command('lending:stats')
  .description('Get lending statistics')
  .action(lendingCommands.getStats);

// PythAdapter commands
program
  .command('oracle:set-price-id')
  .description('Set Pyth price feed ID for a token')
  .action(pythAdapterCommands.setPriceId);

program
  .command('oracle:update-metrics')
  .description('Update aggregate metrics with price data')
  .action(pythAdapterCommands.updateMetrics);

program
  .command('oracle:get-metrics <token>')
  .description('Get aggregate metrics for a token')
  .action(pythAdapterCommands.getMetrics);

program
  .command('oracle:get-price <token>')
  .description('Get current price from Pyth for a token')
  .action(pythAdapterCommands.getPrice);

// Utility commands
program
  .command('account:balance')
  .description('Check wallet balance')
  .action(utilCommands.checkBalance);

program
  .command('account:info')
  .description('Display wallet and network information')
  .action(utilCommands.accountInfo);

program
  .command('network:info')
  .description('Display network and contract information')
  .action(utilCommands.networkInfo);

// Interactive mode function
async function interactiveMode() {
  while (true) {
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select a category:',
        choices: [
          { name: '🔄 EncryptedSwap Operations', value: 'swap' },
          { name: '💰 Lending Operations', value: 'lending' },
          { name: '📊 Oracle Operations', value: 'oracle' },
          { name: '🔧 Utilities', value: 'utils' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);

    if (category === 'exit') {
      console.log(chalk.yellow('\n👋 Goodbye!\n'));
      process.exit(0);
    }

    await handleCategory(category);
  }
}

async function handleCategory(category) {
  let choices = [];

  if (category === 'swap') {
    choices = [
      { name: '📝 Submit Swap Intent', value: 'submit' },
      { name: '✅ Execute Swap', value: 'execute' },
      { name: '❌ Cancel Swap', value: 'cancel' },
      { name: '🔍 Get Swap Intent', value: 'get' },
      { name: '📊 View Stats', value: 'stats' },
      { name: '⬅️  Back', value: 'back' }
    ];
  } else if (category === 'lending') {
    choices = [
      { name: '💵 Deposit', value: 'deposit' },
      { name: '💸 Withdraw', value: 'withdraw' },
      { name: '🏦 Borrow', value: 'borrow' },
      { name: '💳 Repay', value: 'repay' },
      { name: '🔒 Add Collateral', value: 'addCollateral' },
      { name: '👤 View Account', value: 'account' },
      { name: '📊 View Stats', value: 'stats' },
      { name: '⬅️  Back', value: 'back' }
    ];
  } else if (category === 'oracle') {
    choices = [
      { name: '🔧 Set Price ID', value: 'setPriceId' },
      { name: '📈 Update Metrics', value: 'updateMetrics' },
      { name: '📊 Get Metrics', value: 'getMetrics' },
      { name: '💲 Get Price', value: 'getPrice' },
      { name: '⬅️  Back', value: 'back' }
    ];
  } else if (category === 'utils') {
    choices = [
      { name: '💰 Check Balance', value: 'balance' },
      { name: '👤 Account Info', value: 'accountInfo' },
      { name: '🌐 Network Info', value: 'networkInfo' },
      { name: '⬅️  Back', value: 'back' }
    ];
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices
    }
  ]);

  if (action === 'back') return;

  try {
    await executeAction(category, action);
  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
  }
}

async function executeAction(category, action) {
  if (category === 'swap') {
    switch (action) {
      case 'submit': await encryptedSwapCommands.submitSwapIntent(); break;
      case 'execute': await encryptedSwapCommands.executeSwap(); break;
      case 'cancel': await encryptedSwapCommands.cancelSwap(); break;
      case 'get': await encryptedSwapCommands.getSwapIntent(); break;
      case 'stats': await encryptedSwapCommands.getStats(); break;
    }
  } else if (category === 'lending') {
    switch (action) {
      case 'deposit': await lendingCommands.deposit(); break;
      case 'withdraw': await lendingCommands.withdraw(); break;
      case 'borrow': await lendingCommands.borrow(); break;
      case 'repay': await lendingCommands.repay(); break;
      case 'addCollateral': await lendingCommands.addCollateral(); break;
      case 'account': await lendingCommands.getAccount(); break;
      case 'stats': await lendingCommands.getStats(); break;
    }
  } else if (category === 'oracle') {
    switch (action) {
      case 'setPriceId': await pythAdapterCommands.setPriceId(); break;
      case 'updateMetrics': await pythAdapterCommands.updateMetrics(); break;
      case 'getMetrics': await pythAdapterCommands.getMetrics(); break;
      case 'getPrice': await pythAdapterCommands.getPrice(); break;
    }
  } else if (category === 'utils') {
    switch (action) {
      case 'balance': await utilCommands.checkBalance(); break;
      case 'accountInfo': await utilCommands.accountInfo(); break;
      case 'networkInfo': await utilCommands.networkInfo(); break;
    }
  }
}

// Default to interactive mode if no command specified
if (process.argv.length === 2) {
  displayBanner();
  interactiveMode();
} else {
  program.parse();
}
