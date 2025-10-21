import chalk from 'chalk';
import ora from 'ora';
import { getSigner, getProvider, CONTRACTS, NETWORK_CONFIG, formatAmount } from '../utils/blockchain.js';
import { 
  displaySuccess, 
  displayError, 
  displayNetworkInfo,
  displayWalletInfo,
  displayContractAddresses,
  displaySection,
  loadingText 
} from '../utils/display.js';

// Check wallet balance
export async function checkBalance() {
  try {
    const spinner = ora(loadingText('Checking balance')).start();

    const signer = getSigner();
    const address = await signer.getAddress();
    const balance = await signer.provider.getBalance(address);
    
    spinner.stop();

    displaySection('Wallet Balance');
    console.log(chalk.cyan(`Address: ${address}`));
    console.log(chalk.green(`Balance: ${formatAmount(balance)} ETH\n`));

  } catch (error) {
    displayError(`Failed to check balance: ${error.message}`);
  }
}

// Display account information
export async function accountInfo() {
  try {
    const spinner = ora(loadingText('Fetching account information')).start();

    const signer = getSigner();
    const address = await signer.getAddress();
    const balance = await signer.provider.getBalance(address);
    const nonce = await signer.getNonce();
    
    spinner.stop();

    const info = {
      address,
      balance: formatAmount(balance),
      nonce: nonce.toString()
    };

    displayWalletInfo(info);

  } catch (error) {
    displayError(`Failed to get account info: ${error.message}`);
  }
}

// Display network information
export async function networkInfo() {
  try {
    const spinner = ora(loadingText('Fetching network information')).start();

    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    spinner.stop();

    const info = {
      network: network.name || 'unknown',
      chainId: network.chainId.toString(),
      rpcUrl: NETWORK_CONFIG.rpcUrl,
      blockNumber: blockNumber.toString()
    };

    displayNetworkInfo(info);
    displayContractAddresses(CONTRACTS);

  } catch (error) {
    displayError(`Failed to get network info: ${error.message}`);
  }
}

// Get gas price
export async function getGasPrice() {
  try {
    const spinner = ora(loadingText('Fetching gas price')).start();

    const provider = getProvider();
    const feeData = await provider.getFeeData();
    
    spinner.stop();

    displaySection('Gas Information');
    
    if (feeData.gasPrice) {
      console.log(chalk.cyan(`Gas Price: ${formatAmount(feeData.gasPrice, 'gwei')} gwei`));
    }
    
    if (feeData.maxFeePerGas) {
      console.log(chalk.cyan(`Max Fee Per Gas: ${formatAmount(feeData.maxFeePerGas, 'gwei')} gwei`));
    }
    
    if (feeData.maxPriorityFeePerGas) {
      console.log(chalk.cyan(`Max Priority Fee: ${formatAmount(feeData.maxPriorityFeePerGas, 'gwei')} gwei\n`));
    }

  } catch (error) {
    displayError(`Failed to get gas price: ${error.message}`);
  }
}

// Get latest block info
export async function getBlockInfo() {
  try {
    const spinner = ora(loadingText('Fetching block information')).start();

    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    spinner.stop();

    if (!block) {
      displayError('Failed to fetch block data');
      return;
    }

    displaySection('Latest Block Information');
    
    console.log(chalk.cyan(`Block Number: ${block.number}`));
    console.log(chalk.cyan(`Block Hash: ${block.hash}`));
    console.log(chalk.cyan(`Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`));
    console.log(chalk.cyan(`Transactions: ${block.transactions.length}`));
    console.log(chalk.cyan(`Gas Used: ${block.gasUsed.toString()}`));
    console.log(chalk.cyan(`Gas Limit: ${block.gasLimit.toString()}\n`));

  } catch (error) {
    displayError(`Failed to get block info: ${error.message}`);
  }
}

// Test connection
export async function testConnection() {
  try {
    const spinner = ora(loadingText('Testing connection')).start();

    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    
    const signer = getSigner();
    const address = await signer.getAddress();
    
    spinner.stop();

    displaySuccess('Connection successful!');
    console.log(chalk.cyan(`RPC URL: ${NETWORK_CONFIG.rpcUrl}`));
    console.log(chalk.cyan(`Current Block: ${blockNumber}`));
    console.log(chalk.cyan(`Wallet Address: ${address}\n`));

  } catch (error) {
    displayError(`Connection failed: ${error.message}`);
  }
}

// Export all commands
export const utilCommands = {
  checkBalance,
  accountInfo,
  networkInfo,
  getGasPrice,
  getBlockInfo,
  testConnection
};
