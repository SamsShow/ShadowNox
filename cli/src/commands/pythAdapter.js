import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { getContract, getSigner, waitForTransaction, formatAmount } from '../utils/blockchain.js';
import { 
  displaySuccess, 
  displayError, 
  displayTxHash, 
  displayStats,
  displayTable,
  displaySection,
  loadingText,
  formatTimestamp
} from '../utils/display.js';

// Set price ID for a token
export async function setPriceId() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Token address:',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      },
      {
        type: 'input',
        name: 'priceId',
        message: 'Pyth Price Feed ID (32 bytes hex):',
        default: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
        validate: (input) => input.startsWith('0x') && input.length === 66 || 'Invalid price ID (must be 32 bytes)'
      }
    ]);

    const spinner = ora(loadingText('Setting price ID')).start();

    const contract = await getContract('PythAdapter');
    const tx = await contract.setPriceId(answers.token, answers.priceId);
    
    spinner.text = loadingText('Waiting for transaction confirmation');
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess('Price ID set successfully!');
    console.log(chalk.cyan(`Token: ${answers.token}`));
    console.log(chalk.cyan(`Price ID: ${answers.priceId}\n`));

  } catch (error) {
    displayError(`Failed to set price ID: ${error.message}`);
  }
}

// Update aggregate metrics with price data
export async function updateMetrics() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Token address:',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      },
      {
        type: 'input',
        name: 'liquidityChange',
        message: 'Liquidity change (can be negative):',
        default: '1000',
        validate: (input) => !isNaN(parseInt(input)) || 'Invalid number'
      },
      {
        type: 'input',
        name: 'volume',
        message: 'Transaction volume:',
        default: '500',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0 || 'Invalid volume'
      },
      {
        type: 'confirm',
        name: 'includePriceData',
        message: 'Include Pyth price update data?',
        default: false
      }
    ]);

    let priceUpdateData = [];
    if (answers.includePriceData) {
      const priceAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'priceData',
          message: 'Price update data (comma-separated hex strings):',
          default: ''
        }
      ]);
      if (priceAnswer.priceData) {
        priceUpdateData = priceAnswer.priceData.split(',').map(s => s.trim());
      }
    }

    const spinner = ora(loadingText('Updating aggregate metrics')).start();

    const contract = await getContract('PythAdapter');
    
    // Get update fee if price data provided
    let value = ethers.parseEther('0');
    if (priceUpdateData.length > 0) {
      // In real scenario, query Pyth contract for fee
      value = ethers.parseEther('0.001'); // Example fee
    }

    const tx = await contract.updateAggregateMetrics(
      answers.token,
      BigInt(answers.liquidityChange),
      BigInt(answers.volume),
      priceUpdateData,
      { value }
    );
    
    spinner.text = loadingText('Waiting for transaction confirmation');
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess('Aggregate metrics updated successfully!');

  } catch (error) {
    displayError(`Failed to update metrics: ${error.message}`);
  }
}

// Get aggregate metrics for a token
export async function getMetrics(tokenArg) {
  try {
    let token = tokenArg;
    
    if (!token) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'token',
          message: 'Token address:',
          default: '0x0000000000000000000000000000000000000001',
          validate: (input) => ethers.isAddress(input) || 'Invalid address'
        }
      ]);
      token = answer.token;
    }

    const spinner = ora(loadingText('Fetching aggregate metrics')).start();

    const contract = await getContract('PythAdapter');
    const metrics = await contract.getAggregateMetrics(token);
    
    spinner.stop();

    displaySection('Aggregate Metrics');
    
    const data = [
      [chalk.bold('Metric'), chalk.bold('Value')],
      ['Token Address', token],
      ['Total Liquidity', metrics.totalLiquidity.toString()],
      ['Total Volume', metrics.totalVolume.toString()],
      ['Last Price', (Number(metrics.lastPrice) / 1e8).toFixed(2) + ' USD'],
      ['Last Update', formatTimestamp(metrics.lastUpdateTime)]
    ];
    
    displayTable(data);

  } catch (error) {
    displayError(`Failed to get metrics: ${error.message}`);
  }
}

// Get current price from Pyth for a token
export async function getPrice(tokenArg) {
  try {
    let token = tokenArg;
    
    if (!token) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'token',
          message: 'Token address:',
          default: '0x0000000000000000000000000000000000000001',
          validate: (input) => ethers.isAddress(input) || 'Invalid address'
        }
      ]);
      token = answer.token;
    }

    const spinner = ora(loadingText('Fetching price')).start();

    const contract = await getContract('PythAdapter');
    const priceData = await contract.getPrice(token);
    
    spinner.stop();

    displaySection('Current Price');
    
    const price = Number(priceData[0]) / 1e8; // Assuming 8 decimals
    const timestamp = priceData[1];
    
    const data = [
      [chalk.bold('Property'), chalk.bold('Value')],
      ['Token Address', token],
      ['Price', price.toFixed(2) + ' USD'],
      ['Timestamp', formatTimestamp(timestamp)],
      ['Age', getAgeString(timestamp)]
    ];
    
    displayTable(data);

  } catch (error) {
    displayError(`Failed to get price: ${error.message}`);
  }
}

// Helper to get age string
function getAgeString(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const age = now - Number(timestamp);
  
  if (age < 60) return `${age} seconds ago`;
  if (age < 3600) return `${Math.floor(age / 60)} minutes ago`;
  if (age < 86400) return `${Math.floor(age / 3600)} hours ago`;
  return `${Math.floor(age / 86400)} days ago`;
}

// Get all price feeds
export async function listPriceFeeds() {
  try {
    console.log(chalk.yellow('\n⚠️  This feature requires event indexing or subgraph.\n'));
    console.log(chalk.blue('Manually configured price feeds will be displayed here.\n'));
    
    // In a real implementation, you would:
    // 1. Query PriceIdSet events
    // 2. Or maintain an off-chain index
    // 3. Or query a subgraph
    
    displaySection('Known Price Feeds');
    
    const knownFeeds = [
      ['ETH/USD', '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'],
      ['BTC/USD', '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'],
      ['USDC/USD', '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a']
    ];
    
    const data = [
      [chalk.bold('Pair'), chalk.bold('Price Feed ID')],
      ...knownFeeds
    ];
    
    displayTable(data);
    
    console.log(chalk.gray('\nNote: These are example Pyth price feed IDs.'));
    console.log(chalk.gray('Visit https://pyth.network/developers/price-feed-ids for official IDs.\n'));

  } catch (error) {
    displayError(`Failed to list price feeds: ${error.message}`);
  }
}

// Export all commands
export const pythAdapterCommands = {
  setPriceId,
  updateMetrics,
  getMetrics,
  getPrice,
  listPriceFeeds
};
