import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { getContract, getSigner, waitForTransaction, formatAmount, parseAmount } from '../utils/blockchain.js';
import { 
  displaySuccess, 
  displayError, 
  displayTxHash, 
  displayLendingAccount,
  displayStats,
  loadingText 
} from '../utils/display.js';

// Deposit funds
export async function deposit() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount to deposit (in ETH):',
        default: '1.0',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      }
    ]);

    const spinner = ora(loadingText('Depositing funds')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answer.amount);
    
    const tx = await contract.deposit(amount);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully deposited ${answer.amount} ETH!`);

  } catch (error) {
    displayError(`Failed to deposit: ${error.message}`);
  }
}

// Withdraw funds
export async function withdraw() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount to withdraw (in ETH):',
        default: '0.5',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      }
    ]);

    const spinner = ora(loadingText('Withdrawing funds')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answer.amount);
    
    const tx = await contract.withdraw(amount);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully withdrew ${answer.amount} ETH!`);

  } catch (error) {
    displayError(`Failed to withdraw: ${error.message}`);
  }
}

// Add collateral
export async function addCollateral() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount of collateral (in ETH):',
        default: '2.0',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      },
      {
        type: 'input',
        name: 'token',
        message: 'Collateral token address:',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      }
    ]);

    const spinner = ora(loadingText('Adding collateral')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answers.amount);
    
    const tx = await contract.addCollateral(amount, answers.token);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully added ${answers.amount} ETH as collateral!`);

  } catch (error) {
    displayError(`Failed to add collateral: ${error.message}`);
  }
}

// Borrow funds
export async function borrow() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount to borrow (in ETH):',
        default: '1.0',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      }
    ]);

    const spinner = ora(loadingText('Borrowing funds')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answer.amount);
    
    const tx = await contract.borrow(amount);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully borrowed ${answer.amount} ETH!`);

  } catch (error) {
    displayError(`Failed to borrow: ${error.message}`);
  }
}

// Repay loan
export async function repay() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount to repay (in ETH):',
        default: '0.5',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      }
    ]);

    const spinner = ora(loadingText('Repaying loan')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answer.amount);
    
    const tx = await contract.repay(amount);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully repaid ${answer.amount} ETH!`);

  } catch (error) {
    displayError(`Failed to repay: ${error.message}`);
  }
}

// Withdraw collateral
export async function withdrawCollateral() {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount of collateral to withdraw (in ETH):',
        default: '0.5',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      }
    ]);

    const spinner = ora(loadingText('Withdrawing collateral')).start();

    const contract = await getContract('SimpleLending');
    const amount = parseAmount(answer.amount);
    
    const tx = await contract.withdrawCollateral(amount);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess(`Successfully withdrew ${answer.amount} ETH collateral!`);

  } catch (error) {
    displayError(`Failed to withdraw collateral: ${error.message}`);
  }
}

// Get account details
export async function getAccount() {
  try {
    const signer = getSigner();
    const userAddress = await signer.getAddress();

    const spinner = ora(loadingText('Fetching account details')).start();

    const contract = await getContract('SimpleLending');
    const account = await contract.getAccount(userAddress);
    
    spinner.stop();

    // Format account data
    const formattedAccount = {
      deposited: formatAmount(account.deposited),
      borrowed: formatAmount(account.borrowed),
      collateral: formatAmount(account.collateral),
      collateralToken: account.collateralToken,
      lastUpdate: account.lastUpdate
    };

    displayLendingAccount(formattedAccount, userAddress);

  } catch (error) {
    displayError(`Failed to get account details: ${error.message}`);
  }
}

// Get lending statistics
export async function getStats() {
  try {
    const spinner = ora(loadingText('Fetching statistics')).start();

    const contract = await getContract('SimpleLending');
    
    // Get aggregate metrics
    const metrics = await contract.getAggregateMetrics();
    const availableLiquidity = await contract.getAvailableLiquidity();
    
    spinner.stop();

    const stats = {
      'Total Deposits': formatAmount(metrics[0]) + ' ETH',
      'Total Borrows': formatAmount(metrics[1]) + ' ETH',
      'Total Collateral': formatAmount(metrics[2]) + ' ETH',
      'Available Liquidity': formatAmount(availableLiquidity) + ' ETH',
      'Utilization Rate': metrics[0] > 0n 
        ? ((Number(metrics[1]) / Number(metrics[0])) * 100).toFixed(2) + '%'
        : '0%'
    };

    displayStats(stats, 'Lending Protocol Statistics');

  } catch (error) {
    displayError(`Failed to get statistics: ${error.message}`);
  }
}

// Export all commands
export const lendingCommands = {
  deposit,
  withdraw,
  borrow,
  repay,
  addCollateral,
  withdrawCollateral,
  getAccount,
  getStats
};
