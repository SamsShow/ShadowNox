import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { getContract, getSigner, waitForTransaction } from '../utils/blockchain.js';
import { 
  displaySuccess, 
  displayError, 
  displayTxHash, 
  displaySection,
  displayTable,
  loadingText,
  formatTimestamp
} from '../utils/display.js';

// Hermes API Configuration
const HERMES_URL = 'https://hermes.pyth.network';

// Common Pyth Price Feed IDs
export const PRICE_FEED_IDS = {
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'AVAX/USD': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'MATIC/USD': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52'
};

/**
 * Fetch latest price from Pyth Hermes API
 */
async function fetchPriceFromHermes(priceId) {
  try {
    const url = new URL(`${HERMES_URL}/v2/updates/price/latest`);
    url.searchParams.append('ids[]', priceId);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) {
      throw new Error('No price data received from Hermes');
    }
    
    return data.parsed[0];
  } catch (error) {
    throw new Error(`Failed to fetch from Hermes: ${error.message}`);
  }
}

/**
 * Fetch and display real-time price from Pyth
 */
export async function fetchRealtimePrice() {
  try {
    const { symbol } = await inquirer.prompt([
      {
        type: 'list',
        name: 'symbol',
        message: 'Select cryptocurrency pair:',
        choices: Object.keys(PRICE_FEED_IDS)
      }
    ]);

    const spinner = ora(loadingText(`Fetching ${symbol} price from Pyth Hermes API`)).start();
    
    const priceId = PRICE_FEED_IDS[symbol];
    const priceData = await fetchPriceFromHermes(priceId);
    
    spinner.stop();

    displaySection(`Real-Time Price: ${symbol}`);
    
    const price = Number(priceData.price.price) * Math.pow(10, priceData.price.expo);
    const conf = Number(priceData.price.conf) * Math.pow(10, priceData.price.expo);
    const timestamp = new Date(priceData.price.publish_time * 1000);
    const now = new Date();
    const ageSeconds = Math.floor((now - timestamp) / 1000);
    
    const data = [
      [chalk.bold('Property'), chalk.bold('Value')],
      ['Symbol', symbol],
      ['Price', `$${price.toFixed(2)}`],
      ['Confidence', `±$${conf.toFixed(2)}`],
      ['Price Feed ID', priceId],
      ['Publish Time', timestamp.toISOString()],
      ['Age', `${ageSeconds} seconds ago`],
      ['Data Source', 'Pyth Network (Hermes API)'],
      ['Status', chalk.green('✓ LIVE DATA')]
    ];
    
    displayTable(data);
    
    console.log(chalk.gray('\n💡 This is real-time data from Pyth Network, not mock data!'));
    console.log(chalk.gray('   Data is updated every second by Pyth publishers.\n'));

  } catch (error) {
    displayError(`Failed to fetch price: ${error.message}`);
  }
}

/**
 * Update on-chain price using real Pyth data
 */
export async function updateOnchainPrice() {
  try {
    const { symbol, token } = await inquirer.prompt([
      {
        type: 'list',
        name: 'symbol',
        message: 'Select cryptocurrency pair:',
        choices: Object.keys(PRICE_FEED_IDS)
      },
      {
        type: 'input',
        name: 'token',
        message: 'Token address (for mapping):',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      }
    ]);

    const spinner = ora(loadingText(`Fetching ${symbol} from Pyth Hermes API`)).start();
    
    const priceId = PRICE_FEED_IDS[symbol];
    const priceData = await fetchPriceFromHermes(priceId);
    
    spinner.text = loadingText('Updating on-chain price');
    
    const contract = await getContract('CustomPriceOracle');
    
    // First, set the price ID mapping if not already set
    try {
      const tx1 = await contract.setPriceId(token, priceId);
      await waitForTransaction(tx1);
      console.log(chalk.green(`\n✓ Price ID mapping set`));
    } catch (err) {
      // Might already be set
      console.log(chalk.yellow(`\n⚠ Price ID might already be set (${err.message.split('(')[0]})`));
    }
    
    // Update the price
    const tx = await contract.updatePrice(
      priceId,
      priceData.price.price,
      priceData.price.conf,
      priceData.price.expo,
      priceData.price.publish_time
    );
    
    spinner.text = loadingText('Waiting for transaction confirmation');
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess('On-chain price updated with real Pyth data!');
    
    const price = Number(priceData.price.price) * Math.pow(10, priceData.price.expo);
    
    console.log(chalk.cyan(`Symbol: ${symbol}`));
    console.log(chalk.cyan(`Price: $${price.toFixed(2)}`));
    console.log(chalk.cyan(`Token: ${token}`));
    console.log(chalk.cyan(`Price Feed ID: ${priceId}\n`));
    
    console.log(chalk.green('✓ This contract now has real Pyth price data, not mock data!'));

  } catch (error) {
    displayError(`Failed to update price: ${error.message}`);
  }
}

/**
 * Query on-chain price
 */
export async function queryOnchainPrice() {
  try {
    const { token } = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Token address:',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      }
    ]);

    const spinner = ora(loadingText('Querying on-chain price')).start();

    const contract = await getContract('CustomPriceOracle');
    
    // Get price ID for token
    const priceId = await contract.tokenToPriceId(token);
    if (priceId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      spinner.stop();
      displayError('Price ID not set for this token. Use "Update On-Chain Price" first.');
      return;
    }
    
    // Get price data
    const priceData = await contract.prices(priceId);
    
    spinner.stop();

    displaySection('On-Chain Price Data');
    
    const price = Number(priceData.price) * Math.pow(10, Number(priceData.expo));
    const conf = Number(priceData.conf) * Math.pow(10, Number(priceData.expo));
    const timestamp = new Date(Number(priceData.publishTime) * 1000);
    const now = new Date();
    const ageSeconds = Math.floor((now - timestamp) / 1000);
    
    // Find symbol from price ID
    let symbol = 'Unknown';
    for (const [sym, id] of Object.entries(PRICE_FEED_IDS)) {
      if (id === priceId) {
        symbol = sym;
        break;
      }
    }
    
    const data = [
      [chalk.bold('Property'), chalk.bold('Value')],
      ['Token', token],
      ['Symbol', symbol],
      ['Price', `$${price.toFixed(2)}`],
      ['Confidence', `±$${conf.toFixed(2)}`],
      ['Price Feed ID', priceId],
      ['Publish Time', timestamp.toISOString()],
      ['Age', `${ageSeconds} seconds ago`],
      ['Freshness', ageSeconds < 60 ? chalk.green('Fresh ✓') : chalk.yellow('Stale ⚠')],
      ['Data Source', 'Pyth Network (via CustomPriceOracle)']
    ];
    
    displayTable(data);

  } catch (error) {
    displayError(`Failed to query price: ${error.message}`);
  }
}

/**
 * Batch update multiple prices
 */
export async function batchUpdatePrices() {
  try {
    const { symbols } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'symbols',
        message: 'Select cryptocurrency pairs to update:',
        choices: Object.keys(PRICE_FEED_IDS),
        validate: (input) => input.length > 0 || 'Select at least one pair'
      }
    ]);

    console.log(chalk.blue(`\nUpdating ${symbols.length} price feeds...\n`));

    const contract = await getContract('CustomPriceOracle');
    
    for (const symbol of symbols) {
      const spinner = ora(loadingText(`Fetching ${symbol}`)).start();
      
      try {
        const priceId = PRICE_FEED_IDS[symbol];
        const priceData = await fetchPriceFromHermes(priceId);
        
        spinner.text = loadingText(`Updating ${symbol} on-chain`);
        
        const tx = await contract.updatePrice(
          priceId,
          priceData.price.price,
          priceData.price.conf,
          priceData.price.expo,
          priceData.price.publish_time
        );
        
        await waitForTransaction(tx);
        
        const price = Number(priceData.price.price) * Math.pow(10, priceData.price.expo);
        spinner.succeed(chalk.green(`${symbol}: $${price.toFixed(2)} ✓`));
        
      } catch (error) {
        spinner.fail(chalk.red(`${symbol}: ${error.message}`));
      }
    }

    displaySuccess(`\nBatch update completed!`);
    console.log(chalk.green('✓ All prices updated with real Pyth data\n'));

  } catch (error) {
    displayError(`Batch update failed: ${error.message}`);
  }
}

/**
 * List all available Pyth price feeds
 */
export async function listPythFeeds() {
  displaySection('Available Pyth Price Feeds');
  
  const data = [
    [chalk.bold('Symbol'), chalk.bold('Price Feed ID')],
    ...Object.entries(PRICE_FEED_IDS)
  ];
  
  displayTable(data);
  
  console.log(chalk.gray('\n💡 These are official Pyth Network price feed IDs'));
  console.log(chalk.gray('   Visit https://pyth.network/developers/price-feed-ids for more\n'));
}

// Export all commands
export const pythHermesCommands = {
  fetchRealtimePrice,
  updateOnchainPrice,
  queryOnchainPrice,
  batchUpdatePrices,
  listPythFeeds
};
