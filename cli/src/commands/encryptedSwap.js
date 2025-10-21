import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { getContract, getSigner, waitForTransaction, formatAmount, parseAmount } from '../utils/blockchain.js';
import { 
  displaySuccess, 
  displayError, 
  displayTxHash, 
  displaySwapIntent,
  displayStats,
  loadingText 
} from '../utils/display.js';

// Submit a swap intent
export async function submitSwapIntent(intentIdArg) {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'tokenIn',
        message: 'Token In Address:',
        default: '0x0000000000000000000000000000000000000001',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      },
      {
        type: 'input',
        name: 'tokenOut',
        message: 'Token Out Address:',
        default: '0x0000000000000000000000000000000000000002',
        validate: (input) => ethers.isAddress(input) || 'Invalid address'
      },
      {
        type: 'input',
        name: 'amountIn',
        message: 'Amount In (in ETH):',
        default: '1.0',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      },
      {
        type: 'input',
        name: 'minAmountOut',
        message: 'Minimum Amount Out (in ETH):',
        default: '0.95',
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0 || 'Invalid amount'
      },
      {
        type: 'input',
        name: 'deadline',
        message: 'Deadline (in seconds from now):',
        default: '3600',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) > 0 || 'Invalid deadline'
      }
    ]);

    const spinner = ora(loadingText('Submitting swap intent')).start();

    const contract = await getContract('EncryptedSwap');
    
    // Encode swap parameters
    const deadline = Math.floor(Date.now() / 1000) + parseInt(answers.deadline);
    const intentData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'uint256', 'uint256'],
      [
        answers.tokenIn,
        answers.tokenOut,
        parseAmount(answers.amountIn),
        parseAmount(answers.minAmountOut),
        deadline
      ]
    );

    // Submit intent
    const tx = await contract.submitSwapIntent(intentData);
    spinner.text = loadingText('Waiting for transaction confirmation');
    
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    // Get intent ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'SwapIntentSubmitted';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      const intentId = parsed.args.intentId;
      
      displayTxHash(receipt.hash);
      displaySuccess(`Swap intent submitted successfully!`);
      console.log(chalk.cyan(`Intent ID: ${intentId}\n`));
    } else {
      displayTxHash(receipt.hash);
      displaySuccess('Transaction confirmed!');
    }

  } catch (error) {
    displayError(`Failed to submit swap intent: ${error.message}`);
  }
}

// Execute a swap
export async function executeSwap(intentIdArg) {
  try {
    let intentId = intentIdArg;
    
    if (!intentId) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'intentId',
          message: 'Intent ID (0x...):',
          validate: (input) => input.startsWith('0x') && input.length === 66 || 'Invalid intent ID'
        }
      ]);
      intentId = answer.intentId;
    }

    // Ask for price update data (optional for testing)
    const { includePriceData } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includePriceData',
        message: 'Include Pyth price update data?',
        default: false
      }
    ]);

    let priceUpdateData = [];
    if (includePriceData) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'priceData',
          message: 'Price update data (comma-separated hex strings):',
          default: ''
        }
      ]);
      if (answer.priceData) {
        priceUpdateData = answer.priceData.split(',').map(s => s.trim());
      }
    }

    const spinner = ora(loadingText('Executing swap')).start();

    const contract = await getContract('EncryptedSwap');
    
    // Execute swap
    const tx = await contract.executeSwap(intentId, priceUpdateData, {
      value: ethers.parseEther('0') // Add value if update fee required
    });
    
    spinner.text = loadingText('Waiting for transaction confirmation');
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess('Swap executed successfully!');

  } catch (error) {
    displayError(`Failed to execute swap: ${error.message}`);
  }
}

// Cancel a swap
export async function cancelSwap(intentIdArg) {
  try {
    let intentId = intentIdArg;
    
    if (!intentId) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'intentId',
          message: 'Intent ID (0x...):',
          validate: (input) => input.startsWith('0x') && input.length === 66 || 'Invalid intent ID'
        }
      ]);
      intentId = answer.intentId;
    }

    const spinner = ora(loadingText('Cancelling swap')).start();

    const contract = await getContract('EncryptedSwap');
    const tx = await contract.cancelSwap(intentId);
    
    spinner.text = loadingText('Waiting for transaction confirmation');
    const receipt = await waitForTransaction(tx);
    spinner.stop();

    displayTxHash(receipt.hash);
    displaySuccess('Swap cancelled successfully!');

  } catch (error) {
    displayError(`Failed to cancel swap: ${error.message}`);
  }
}

// Get swap intent details
export async function getSwapIntent(intentIdArg) {
  try {
    let intentId = intentIdArg;
    
    if (!intentId) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'intentId',
          message: 'Intent ID (0x...):',
          validate: (input) => input.startsWith('0x') && input.length === 66 || 'Invalid intent ID'
        }
      ]);
      intentId = answer.intentId;
    }

    const spinner = ora(loadingText('Fetching swap intent')).start();

    const contract = await getContract('EncryptedSwap');
    const intent = await contract.getSwapIntent(intentId);
    
    spinner.stop();

    displaySwapIntent(intent, intentId);

  } catch (error) {
    displayError(`Failed to get swap intent: ${error.message}`);
  }
}

// Get swap statistics
export async function getStats() {
  try {
    const spinner = ora(loadingText('Fetching statistics')).start();

    const contract = await getContract('EncryptedSwap');
    
    // Get counter contract addresses
    const volumeCounterAddr = await contract.totalSwapVolume();
    const countCounterAddr = await contract.totalSwapCount();
    
    // Get AtomicCounter ABI
    const counterAbi = [
      'function get() external view returns (uint256)'
    ];
    
    const provider = getSigner();
    const volumeCounter = new ethers.Contract(volumeCounterAddr, counterAbi, provider);
    const countCounter = new ethers.Contract(countCounterAddr, counterAbi, provider);
    
    const totalVolume = await volumeCounter.get();
    const totalCount = await countCounter.get();
    
    spinner.stop();

    const stats = {
      'Total Swap Volume': formatAmount(totalVolume) + ' ETH',
      'Total Swap Count': totalCount.toString(),
      'Average Volume': totalCount > 0n 
        ? formatAmount(totalVolume / totalCount) + ' ETH'
        : '0 ETH'
    };

    displayStats(stats, 'Encrypted Swap Statistics');

  } catch (error) {
    displayError(`Failed to get statistics: ${error.message}`);
  }
}

// Export all commands
export const encryptedSwapCommands = {
  submitSwapIntent,
  executeSwap,
  cancelSwap,
  getSwapIntent,
  getStats
};
